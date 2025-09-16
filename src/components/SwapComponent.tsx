"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Box, Flex, Heading, Text, IconButton, VStack, HStack, Button, Link as ChakraLink,
  useDisclosure,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { FiArrowDown, FiSettings } from "react-icons/fi";
import { GradientButton } from "@/components/ui/GradientButton";
import { SettingsModal } from "./ui/SettingsModal";
import { TokenInfo, getDefaultTokens } from "../constants/tokens";
import { TokenSelectModal } from "./ui/TokenSelectModal";
import { TokenInput } from "./ui/TokenInput"; // QUAN TRỌNG: Tái sử dụng!
import { useAccount, useChainId, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient, useWatchContractEvent } from "wagmi";
import { type Abi, formatUnits, parseUnits, decodeEventLog, parseAbiItem, type Log } from "viem";
import { quantumSwapRouterAbi as routerAbi, quantumSwapPairAbi as erc20Abi, quantumSwapFactoryAbi as factoryAbi } from "../constants/abi/minimal";
import { getContracts } from "../constants/addresses";
import { useTransactionStatus } from "../hooks/useTransactionStatus";
import { useSettings } from "@/contexts/SettingsContext";

// --- HOOKS VÀ LOGIC (Không có thay đổi lớn, giữ nguyên logic cốt lõi) ---

function useDebounce<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const id = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(id); }, [value, delay]);
  return debounced;
}

// Component con để hiển thị các hàng thông tin chi tiết
function InfoRow({ label, value, valueColor }: { label: React.ReactNode; value: React.ReactNode; valueColor?: string }) {
  return (
    <Flex justify="space-between" align="center">
      <Text fontSize="sm" color="whiteAlpha.600">{label}</Text>
      <Text fontSize="sm" fontWeight="medium" color={valueColor ?? "whiteAlpha.800"}>{value}</Text>
    </Flex>
  );
}

// --- COMPONENT CHÍNH ---

interface SwapComponentProps { onTokenChange?: (inputToken: TokenInfo | null, outputToken: TokenInfo | null) => void; }

export function SwapComponent({ onTokenChange }: SwapComponentProps) {
  // ... (toàn bộ state và logic hook từ code gốc của bạn được giữ nguyên ở đây)
  const chainId = useChainId() ?? 31337;
  const account = useAccount();
  const contracts = getContracts(chainId);
  const router = contracts?.QuantumSwapRouter as `0x${string}`;
  const _weth = contracts?.WETH as `0x${string}`;
  const defaults = getDefaultTokens(chainId);
  const [inputToken, setInputToken] = useState<TokenInfo | null>(defaults[0]);
  const [outputToken, setOutputToken] = useState<TokenInfo | null>(defaults[1]);
  useEffect(() => { onTokenChange?.(inputToken, outputToken); }, [inputToken, outputToken, onTokenChange]);
  const [inputAmount, setInputAmount] = useState("");
  const [outputAmount, setOutputAmount] = useState("");
  const [isTyping, setIsTyping] = useState<"in" | "out">("in");
  const debouncedIn = useDebounce(inputAmount);
  const { open: isSelecting, onOpen: onOpenSelector, onClose: onCloseSelector } = useDisclosure();
  const [selectingFor, setSelectingFor] = useState<"in" | "out">("in");
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const { slippageTolerance, deadlineMinutes, setSlippageTolerance, setDeadlineMinutes } = useSettings();
  const { open: isSettingsOpen, onOpen: onOpenSettings, onClose: onCloseSettings } = useDisclosure();
  const { open: _isDetailsOpen } = useDisclosure();
  const { open: isConfirmOpen, onOpen: onOpenConfirm, onClose: onCloseConfirm } = useDisclosure();
  const publicClient = usePublicClient();
  const [gasLimit, setGasLimit] = useState<bigint | undefined>(undefined);
  const [gasPrice, setGasPrice] = useState<bigint | undefined>(undefined);

  const routePath = useMemo(() => inputToken && outputToken ? [inputToken.address, outputToken.address] : [], [inputToken, outputToken]);

  // ===== Pair selection for history =====
  const pairRead = useReadContract({
    address: contracts?.QuantumSwapFactory as `0x${string}` | undefined,
    abi: factoryAbi as Abi,
    functionName: "getPair",
    args: inputToken && outputToken ? [inputToken.address, outputToken.address] : undefined,
    query: { enabled: Boolean(inputToken && outputToken) }
  });
  const pair = pairRead.data as `0x${string}` | undefined;
  const token0Read = useReadContract({ address: pair, abi: erc20Abi as Abi, functionName: "token0", query: { enabled: Boolean(pair) } });
  const token1Read = useReadContract({ address: pair, abi: erc20Abi as Abi, functionName: "token1", query: { enabled: Boolean(pair) } });
  const t0Addr = token0Read.data as `0x${string}` | undefined;
  const t1Addr = token1Read.data as `0x${string}` | undefined;
  const dec0 = t0Addr && inputToken && t0Addr.toLowerCase() === inputToken.address.toLowerCase() ? inputToken.decimals : (t0Addr && outputToken && t0Addr.toLowerCase() === outputToken.address.toLowerCase() ? outputToken.decimals : 18);
  const dec1 = t1Addr && inputToken && t1Addr.toLowerCase() === inputToken.address.toLowerCase() ? inputToken.decimals : (t1Addr && outputToken && t1Addr.toLowerCase() === outputToken.address.toLowerCase() ? outputToken.decimals : 18);
  const sym0 = t0Addr && inputToken && t0Addr.toLowerCase() === inputToken.address.toLowerCase() ? inputToken.symbol : (t0Addr && outputToken && t0Addr.toLowerCase() === outputToken.address.toLowerCase() ? outputToken.symbol : "TKN0");
  const sym1 = t1Addr && inputToken && t1Addr.toLowerCase() === inputToken.address.toLowerCase() ? inputToken.symbol : (t1Addr && outputToken && t1Addr.toLowerCase() === outputToken.address.toLowerCase() ? outputToken.symbol : "TKN1");

  // Recent swaps for the selected pair
  const [logs, setLogs] = useState<Log[]>([]);
  const swapEvent = parseAbiItem('event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)');
  type Timeframe = "1h" | "24h" | "7d";
  const [timeframe, setTimeframe] = useState<Timeframe>("24h");
  function approxBlocks(tf: Timeframe) {
    const perHour = 300; // ~12s/block
    if (tf === "1h") return perHour;
    if (tf === "7d") return perHour * 24 * 7;
    return perHour * 24;
  }

  function decodeSwap(l: Log) {
    try {
      const ev = decodeEventLog({ abi: erc20Abi as Abi, data: l.data!, topics: l.topics as unknown as [`0x${string}`, ...`0x${string}`[]] });
      if (ev.eventName !== "Swap") return undefined;
      const args = ev.args as unknown as { amount0In: bigint; amount1In: bigint; amount0Out: bigint; amount1Out: bigint };
      const a0In = Number(args.amount0In);
      const a1In = Number(args.amount1In);
      const a0Out = Number(args.amount0Out);
      const a1Out = Number(args.amount1Out);
      let dir = "";
      let out: number | undefined = undefined;
      if (a1Out > 0 && a0In > 0) { // 0 -> 1
        dir = `${sym0}→${sym1}`;
        out = a1Out / 10 ** dec1;
      } else if (a0Out > 0 && a1In > 0) { // 1 -> 0
        dir = `${sym1}→${sym0}`;
        out = a0Out / 10 ** dec0;
      }
      return { block: l.blockNumber?.toString(), tx: l.transactionHash, dir, out };
    } catch {
      return undefined;
    }
  }

  // Initial fetch and live updates
  useEffect(() => {
    if (!pair || !publicClient) return;
    let stale = false;
    (async () => {
      try {
        const latest = await publicClient.getBlockNumber();
        const range = BigInt(approxBlocks(timeframe));
        const fromBlock = latest > range ? latest - range : 0n;
        const fetched = await publicClient.getLogs({ address: pair, fromBlock, toBlock: latest, event: swapEvent });
        if (!stale) setLogs(fetched.slice(-12).reverse());
      } catch {}
    })();
    return () => { stale = true; };
  }, [pair, publicClient, swapEvent, timeframe]);

  useWatchContractEvent({
    address: pair,
    abi: erc20Abi as Abi,
    eventName: "Swap",
    onLogs: async () => {
      try {
        if (!publicClient || !pair) return;
        const latest = await publicClient.getBlockNumber();
        const range = BigInt(approxBlocks(timeframe));
        const fromBlock = latest > range ? latest - range : 0n;
        const fetched = await publicClient.getLogs({ address: pair, fromBlock, toBlock: latest, event: swapEvent });
        setLogs(fetched.slice(-12).reverse());
      } catch {}
    },
    enabled: Boolean(pair),
  });

  const amountsOut = useReadContract({
    address: router, abi: routerAbi as Abi, functionName: "getAmountsOut",
    args: isTyping === "in" && debouncedIn && routePath.length > 0 ? [parseUnits(debouncedIn, inputToken!.decimals), routePath] : undefined,
    query: { enabled: isTyping === "in" && !!debouncedIn && routePath.length > 0 }
  });

  const amountsIn = useReadContract({
    address: router, abi: routerAbi as Abi, functionName: "getAmountsIn",
    args: isTyping === "out" && outputAmount && routePath.length > 0 ? [parseUnits(outputAmount, outputToken!.decimals), routePath] : undefined,
    query: { enabled: isTyping === "out" && !!outputAmount && routePath.length > 0 }
  });

  useEffect(() => {
    if (isTyping === "in" && amountsOut.data && outputToken) {
      const out = (amountsOut.data as bigint[])[1];
      setOutputAmount(formatUnits(out, outputToken.decimals));
    }
  }, [amountsOut.data, isTyping, outputToken]);

  useEffect(() => {
    if (isTyping === "out" && amountsIn.data && inputToken) {
      const [input] = amountsIn.data as bigint[];
      setInputAmount(formatUnits(input, inputToken.decimals));
    }
  }, [amountsIn.data, isTyping, inputToken]);
  
  const allowance = useReadContract({ address: inputToken?.address, abi: erc20Abi as Abi, functionName: "allowance", args: account.address && router ? [account.address, router] : undefined, query: { enabled: !!account.address && !!inputToken } });
  const balance = useReadContract({ address: inputToken?.address, abi: erc20Abi as Abi, functionName: "balanceOf", args: account.address ? [account.address] : undefined, query: { enabled: !!account.address && !!inputToken } });
  
  const needsApproval = useMemo(() => {
    if (!inputToken || !inputAmount || !allowance.data) return false;
    return (allowance.data as bigint) < parseUnits(inputAmount, inputToken.decimals);
  }, [allowance.data, inputAmount, inputToken]);

  const hasInsufficient = useMemo(() => {
    if (!inputToken || !inputAmount || !balance.data) return false;
    return (balance.data as bigint) < parseUnits(inputAmount, inputToken.decimals);
  }, [balance.data, inputAmount, inputToken]);

  const { writeContractAsync } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: txHash });
  useTransactionStatus({ isPending: receipt.isLoading, isSuccess: receipt.isSuccess, isError: receipt.isError, error: receipt.error, hash: txHash });
  
  const priceText = useMemo(() => {
    const inNum = parseFloat(inputAmount);
    const outNum = parseFloat(outputAmount);
    if (!inNum || !outNum || !inputToken || !outputToken) return "-";
    const rate = outNum / inNum;
    return `1 ${inputToken.symbol} ≈ ${rate.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${outputToken.symbol}`;
  }, [inputAmount, outputAmount, inputToken, outputToken]);

  // Swap details: price impact (rough), min received, route, deadline
  const priceImpactPct = useMemo(() => {
    const inNum = parseFloat(inputAmount);
    const outNum = parseFloat(outputAmount);
    if (!inNum || !outNum) return undefined;
    // Simplified placeholder: price impact relative to quote out/in at last rate
    // In production, compute using pool reserves. Here, estimate 0 for minimal UI.
    return 0;
  }, [inputAmount, outputAmount]);
  const minReceivedText = useMemo(() => {
    if (!outputToken || !outputAmount) return "-";
    const out = parseUnits(outputAmount, outputToken.decimals);
    const bps = BigInt(Math.floor(slippageTolerance * 100));
    const denom = 10000n;
    const min = (out * (denom - bps)) / denom;
    return `${formatUnits(min, outputToken.decimals)} ${outputToken.symbol}`;
  }, [outputAmount, outputToken, slippageTolerance]);
  const deadlineText = useMemo(() => `${deadlineMinutes} min`, [deadlineMinutes]);

  async function handleAction() {
    if (needsApproval) {
      const hash = await writeContractAsync({ address: inputToken!.address, abi: erc20Abi as Abi, functionName: "approve", args: [router, parseUnits(inputAmount, inputToken!.decimals)] });
      setTxHash(hash);
    } else {
      const bps = BigInt(Math.floor(slippageTolerance * 100));
      const denom = 10000n;
      const out = parseUnits(outputAmount, outputToken!.decimals);
      const amountOutMin = (out * (denom - bps)) / denom;
      const deadline = BigInt(Math.floor(Date.now() / 1000)) + BigInt(deadlineMinutes) * 60n;
      const hash = await writeContractAsync({ address: router, abi: routerAbi as Abi, functionName: "swapExactTokensForTokens", args: [parseUnits(inputAmount, inputToken!.decimals), amountOutMin, routePath, account.address!, deadline] });
      setTxHash(hash);
    }
  }

  const actionLabel = !account.isConnected ? "Connect Wallet" : !inputToken || !outputToken ? "Select Tokens" : !inputAmount ? "Enter an amount" : hasInsufficient ? `Insufficient ${inputToken.symbol}` : needsApproval ? `Approve ${inputToken.symbol}` : "Swap";

  // Gas estimate effect
  useEffect(() => {
    (async () => {
      try {
        if (!publicClient || !router || !account.address || !inputToken || !outputToken || !inputAmount || routePath.length === 0) { setGasLimit(undefined); setGasPrice(undefined); return; }
        const inAmt = parseUnits(inputAmount, inputToken.decimals);
        const outNum = outputAmount ? parseUnits(outputAmount, outputToken.decimals) : 0n;
        const bps = BigInt(Math.floor(slippageTolerance * 100));
        const denom = 10000n;
        const minOut = (outNum * (denom - bps)) / denom;
        const deadline = BigInt(Math.floor(Date.now() / 1000)) + BigInt(deadlineMinutes) * 60n;
        const gas = await publicClient.estimateContractGas({
          address: router,
          abi: routerAbi as Abi,
          functionName: "swapExactTokensForTokens",
          args: [inAmt, minOut, routePath as [`0x${string}`, `0x${string}`], account.address, deadline],
          account: account.address,
        });
        const fees = await publicClient.estimateFeesPerGas();
        setGasLimit(gas);
        setGasPrice((fees.maxFeePerGas ?? fees.gasPrice) || 0n);
      } catch {
        setGasLimit(undefined);
        setGasPrice(undefined);
      }
    })();
  }, [publicClient, router, account.address, inputToken, outputToken, inputAmount, outputAmount, routePath, slippageTolerance, deadlineMinutes]);

  const gasText = useMemo(() => {
    if (!gasLimit || !gasPrice) return "-";
    const eth = gasLimit * gasPrice;
    return `${formatUnits(eth, 18)} ETH`;
  }, [gasLimit, gasPrice]);

  function explorerTxUrl(chain: number | undefined, hash?: string) {
    if (!hash) return undefined;
    if (chain === 1) return `https://etherscan.io/tx/${hash}`;
    if (chain === 11155111) return `https://sepolia.etherscan.io/tx/${hash}`;
    return undefined;
  }

  return (
    <>
      <Box
        maxW="520px"
        w="100%"
        p={{ base: 4, md: 6 }}
        rounded="2xl"
        bg="rgba(23, 35, 53, 0.75)"
        backdropFilter="blur(15px)"
        border="1px solid"
        borderColor="rgba(255, 255, 255, 0.05)"
        boxShadow="0 10px 30px rgba(0,0,0,0.3)"
      >
        <VStack align="stretch" gap={4}>
          <Flex justify="space-between" align="center">
            <Heading size="lg" color="whiteAlpha.900">Swap</Heading>
            <IconButton
              aria-label="Settings"
              onClick={onOpenSettings}
              variant="ghost"
              color="whiteAlpha.600"
              _hover={{ color: "white", bg: "whiteAlpha.100" }}
              rounded="lg"
            >
              <Box as={FiSettings} />
            </IconButton>
          </Flex>

          <VStack align="stretch" gap={1}>
            <TokenInput
              label="From"
              token={inputToken}
              amount={inputAmount}
              onAmountChange={(v) => { setInputAmount(v); setIsTyping("in"); }}
              onTokenSelect={() => { setSelectingFor("in"); onOpenSelector(); }}
              refreshKey={Number(txHash || 0)}
            />

            <Flex justify="center" my={1} zIndex={1}>
              <IconButton
                aria-label="Invert swap"
                onClick={() => { setInputToken(outputToken); setOutputToken(inputToken); setInputAmount(outputAmount); setOutputAmount(inputAmount); }}
                rounded="lg"
                size="sm"
                bg="blackAlpha.400"
                color="whiteAlpha.700"
                border="1px solid"
                borderColor="rgba(255, 255, 255, 0.05)"
                _hover={{ bg: "blackAlpha.500" }}
              >
                <Box as={FiArrowDown} />
              </IconButton>
            </Flex>

            <TokenInput
              label="To (estimated)"
              token={outputToken}
              amount={outputAmount}
              onAmountChange={(v) => { setOutputAmount(v); setIsTyping("out"); }}
              onTokenSelect={() => { setSelectingFor("out"); onOpenSelector(); }}
              refreshKey={Number(txHash || 0)}
            />
          </VStack>

          {parseFloat(inputAmount) > 0 && parseFloat(outputAmount) > 0 && (
            <VStack p={3} bg="blackAlpha.300" rounded="xl" gap={2} align="stretch">
              <InfoRow label="Price" value={priceText} />
              <InfoRow label="Price impact" value={priceImpactPct !== undefined ? `${priceImpactPct.toFixed(2)}%` : "-"} valueColor={priceImpactPct && priceImpactPct > 5 ? "red.300" : priceImpactPct && priceImpactPct > 1 ? "yellow.300" : undefined} />
              <InfoRow label="Min received" value={minReceivedText} />
              <InfoRow label="Route" value={routePath.length === 2 ? "Direct" : `${routePath.length - 1} hops`} />
              <InfoRow label="Deadline" value={deadlineText} />
              <InfoRow label="Gas estimate" value={gasText} />
            </VStack>
          )}

          <GradientButton size="lg" fontSize="md" onClick={() => onOpenConfirm()} disabled={!account.isConnected || hasInsufficient || !inputAmount} loading={receipt.isLoading}>
            {actionLabel}
          </GradientButton>

          {/* Confirm modal */}
          {isConfirmOpen && (
            <Box position="fixed" inset={0} bg="blackAlpha.700" backdropFilter="blur(6px)" zIndex={1000} onClick={onCloseConfirm}>
              <VStack
                onClick={(e) => e.stopPropagation()}
                position="absolute" left="50%" top="50%" transform="translate(-50%, -50%)"
                bg="rgba(23, 35, 53, 0.9)" border="1px solid" borderColor="rgba(255,255,255,0.08)" rounded="2xl" p={5} gap={3} align="stretch" w="full" maxW="440px"
              >
                <Heading size="md" color="white">Confirm Swap</Heading>
                <VStack align="stretch" gap={2}>
                  <InfoRow label="You pay" value={`${inputAmount || 0} ${inputToken?.symbol ?? ""}`} />
                  <InfoRow label="You receive (est.)" value={`${outputAmount || 0} ${outputToken?.symbol ?? ""}`} />
                  <InfoRow label="Min received" value={minReceivedText} />
                  <InfoRow label="Price impact" value={priceImpactPct !== undefined ? `${priceImpactPct.toFixed(2)}%` : "-"} valueColor={priceImpactPct && priceImpactPct > 5 ? "red.300" : priceImpactPct && priceImpactPct > 1 ? "yellow.300" : undefined} />
                  <InfoRow label="Slippage" value={`${slippageTolerance.toFixed(2)}%`} />
                  <InfoRow label="Route" value={routePath.length === 2 ? "Direct" : `${routePath.length - 1} hops`} />
                  <InfoRow label="Deadline" value={deadlineText} />
                </VStack>
                {(priceImpactPct && priceImpactPct > 5) && (
                  <Text color="red.300" fontSize="sm">High price impact! Proceed with caution.</Text>
                )}
                <HStack justify="flex-end" gap={2}>
                  <GradientButton hoverOnly onClick={onCloseConfirm}>Cancel</GradientButton>
                  <GradientButton onClick={() => { onCloseConfirm(); handleAction(); }}>Confirm Swap</GradientButton>
                </HStack>
              </VStack>
            </Box>
          )}

          {/* Recent Swaps */}
          {pair && (
            <VStack align="stretch" gap={2} mt={2} p={3} bg="blackAlpha.300" rounded="xl">
              <Heading size="sm" color="white">Recent Swaps</Heading>
              <HStack justify="space-between">
                <HStack gap={2}>
                  {["1h", "24h", "7d"].map((tf) => (
                    <Button
                      key={tf}
                      size="xs"
                      rounded="full"
                      px={3}
                      variant={timeframe === tf ? "solid" : "outline"}
                      colorScheme={timeframe === tf ? "teal" : undefined}
                      color={timeframe === tf ? "white" : "whiteAlpha.900"}
                      borderColor={timeframe === tf ? "teal.400" : "whiteAlpha.400"}
                      onClick={() => setTimeframe(tf as Timeframe)}
                    >
                      {tf.toUpperCase()}
                    </Button>
                  ))}
                </HStack>
                <ChakraLink as={NextLink} href={`/pair/${pair}`} color="whiteAlpha.800" _hover={{ color: "white" }}>View all</ChakraLink>
              </HStack>
              {logs.length === 0 ? (
                <Text color="whiteAlpha.600">No recent swaps.</Text>
              ) : (
                <VStack align="stretch" gap={1}>
                  {logs.slice(0, 10).map((l, i) => {
                    const d = decodeSwap(l);
                    return (
                      <HStack key={`${l.blockHash}-${l.logIndex}-${i}`} justify="space-between">
                        <Text color="whiteAlpha.800" fontSize="sm">Block {l.blockNumber?.toString()}</Text>
                        <Text color="whiteAlpha.700" fontSize="sm">{d?.dir || "Swap"} {d?.out ? d.out.toLocaleString(undefined, { maximumFractionDigits: 6 }) : ""}</Text>
                        <Text color="whiteAlpha.600" fontSize="xs">Tx {l.transactionHash?.slice(0, 10)}…</Text>
                      </HStack>
                    );
                  })}
                </VStack>
              )}
            </VStack>
          )}
          {txHash && (
            <HStack justify="space-between" mt={2}>
              <Text color="whiteAlpha.700" fontSize="sm">Tx: {txHash.slice(0, 10)}…</Text>
              {explorerTxUrl(chainId, txHash) ? (
                <ChakraLink href={explorerTxUrl(chainId, txHash)} target="_blank" rel="noreferrer" color="#00D1B2">View on explorer</ChakraLink>
              ) : null}
            </HStack>
          )}
        </VStack>
      </Box>

      {/* Các Modal được tách ra để dễ quản lý */}
      <TokenSelectModal
        isOpen={isSelecting}
        onClose={onCloseSelector}
        onTokenSelect={(t) => {
          if (selectingFor === "in") setInputToken(t);
          else setOutputToken(t);
        }}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={onCloseSettings}
        slippageTolerance={slippageTolerance}
        setSlippageTolerance={setSlippageTolerance}
        deadlineMinutes={deadlineMinutes}
        setDeadlineMinutes={setDeadlineMinutes}
      />
      {/* ConfirmModal có thể bổ sung sau */}
    </>
  );
}