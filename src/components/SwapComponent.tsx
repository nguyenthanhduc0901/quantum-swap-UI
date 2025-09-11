"use client";

import { useMemo, useState } from "react";
import { Box, Flex, HStack, Heading, Button, Text, IconButton } from "@chakra-ui/react";
import { FiArrowDown } from "react-icons/fi";
import { TokenInfo, getDefaultTokens } from "../constants/tokens";
import { TokenSelectModal } from "./ui/TokenSelectModal";
import { useAccount, useChainId, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import type { Abi } from "viem";
import routerAbi from "../constants/abi/QuantumSwapRouter.json";
import erc20Abi from "../constants/abi/QuantumSwapPair.json"; // contains ERC20 ABI subset for demo (balance/allowance/approve)
import { getContracts, type QuantumSwapAddresses } from "../constants/addresses";
import { useTransactionStatus } from "../hooks/useTransactionStatus";
import { TokenInput } from "./ui/TokenInput";

function useDebounce<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useMemo(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function SwapComponent() {
  const chainId = useChainId() ?? 31337;
  const account = useAccount();
  const contracts = getContracts(chainId) as QuantumSwapAddresses | undefined;
  const router = (contracts?.QuantumSwapRouter ?? "0x0000000000000000000000000000000000000000") as `0x${string}`;

  const defaults = getDefaultTokens(chainId);
  const [inputToken, setInputToken] = useState<TokenInfo | null>(defaults[0]);
  const [outputToken, setOutputToken] = useState<TokenInfo | null>(defaults[1]);
  const [inputAmount, setInputAmount] = useState("");
  const [outputAmount, setOutputAmount] = useState("");
  const [selecting, setSelecting] = useState<"in" | "out" | null>(null);
  const [txStatus, setTxStatus] = useState<
    "idle" | "pendingApproval" | "approving" | "pendingSwap" | "swapping" | "success" | "error"
  >("idle");
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [slippageTolerance, setSlippageTolerance] = useState<number>(0.5);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const debouncedIn = useDebounce(inputAmount, 400);
  const debouncedOut = useDebounce(outputAmount, 400);

  const path = useMemo(() => (inputToken && outputToken ? [inputToken.address, outputToken.address] : []), [inputToken, outputToken]);

  const amountsOut = useReadContract({
    address: router,
    abi: routerAbi.abi as Abi,
    functionName: "getAmountsOut",
    args: inputAmount && path.length === 2 ? [BigInt(Math.floor(Number(debouncedIn || "0") * 10 ** (inputToken?.decimals ?? 18))), path] : undefined,
    query: { enabled: Boolean(inputAmount) && path.length === 2 },
  });

  const amountsIn = useReadContract({
    address: router,
    abi: routerAbi.abi as Abi,
    functionName: "getAmountsIn",
    args: outputAmount && path.length === 2 ? [BigInt(Math.floor(Number(debouncedOut || "0") * 10 ** (outputToken?.decimals ?? 18))), path] : undefined,
    query: { enabled: Boolean(outputAmount) && path.length === 2 },
  });

  // Update derived amounts
  useMemo(() => {
    if (amountsOut.data && inputToken && outputToken) {
      const arr = amountsOut.data as unknown as bigint[];
      const out = arr[arr.length - 1];
      setOutputAmount((Number(out) / 10 ** (outputToken.decimals || 18)).toString());
    }
  }, [amountsOut.data, inputToken, outputToken]);

  useMemo(() => {
    if (amountsIn.data && inputToken && outputToken && !inputAmount) {
      const arr = amountsIn.data as unknown as bigint[];
      const reqIn = arr[0];
      setInputAmount((Number(reqIn) / 10 ** (inputToken.decimals || 18)).toString());
    }
  }, [amountsIn.data, inputAmount, inputToken, outputToken]);

  // Allowance check on input token (using Pair ABI as placeholder ERC20)
  const allowance = useReadContract({
    address: (inputToken?.address ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
    abi: erc20Abi.abi as Abi,
    functionName: "allowance",
    args: account.address && inputToken ? [account.address, router] : undefined,
    query: { enabled: Boolean(account.address && inputToken) },
  });

  const { writeContractAsync } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: txHash, query: { enabled: Boolean(txHash) } });
  useTransactionStatus({
    isPending: !!txHash && receipt.isLoading,
    isSuccess: receipt.isSuccess,
    isError: receipt.isError,
    error: receipt.error,
    hash: txHash as string,
  });

  const needsApproval = useMemo(() => {
    if (!inputAmount || !allowance.data || !inputToken) return false;
    const needed = BigInt(Math.floor(Number(inputAmount) * 10 ** (inputToken.decimals || 18)));
    try {
      return (allowance.data as unknown as bigint) < needed;
    } catch {
      return false;
    }
  }, [allowance.data, inputAmount, inputToken]);

  // Derived price display
  const priceText = useMemo(() => {
    if (!inputToken || !outputToken) return "-";
    const inAmt = Number(inputAmount || "0");
    const outAmt = Number(outputAmount || "0");
    if (inAmt > 0 && outAmt > 0) {
      const rate = outAmt / inAmt;
      return `1 ${inputToken.symbol} ≈ ${rate.toFixed(6)} ${outputToken.symbol}`;
    }
    return "-";
  }, [inputAmount, outputAmount, inputToken, outputToken]);

  function computeAmountOutMin(calculatedOut: bigint, slippagePct: number): bigint {
    const slippage = BigInt(Math.floor((Number(calculatedOut) * slippagePct) / 100));
    return calculatedOut - slippage;
  }

  async function onApprove() {
    if (!inputToken) return;
    setTxStatus("approving");
    try {
      const hash = await writeContractAsync({
        address: inputToken.address,
        abi: erc20Abi.abi as Abi,
        functionName: "approve",
        args: [router, BigInt(2) ** BigInt(256) - BigInt(1)],
      });
      setTxHash(hash as `0x${string}`);
      setTxStatus("pendingSwap");
    } catch {
      setTxStatus("error");
    }
  }

  async function onSwap() {
    if (!inputToken || !outputToken || !path.length || !inputAmount) return;
    setTxStatus("swapping");
    try {
      const amountIn = BigInt(Math.floor(Number(inputAmount) * 10 ** (inputToken.decimals || 18)));
      // Compute min out with slippage if we have a quote
      let minOut = 0n;
      if (amountsOut.data) {
        const outBig = (amountsOut.data as unknown as bigint[]).slice(-1)[0];
        minOut = computeAmountOutMin(outBig, slippageTolerance);
      }
      const hash = await writeContractAsync({
        address: router,
        abi: routerAbi.abi as Abi,
        functionName: "swapExactTokensForTokens",
        args: [amountIn, minOut, path, account.address!, BigInt(Math.floor(Date.now() / 1000) + 1800)],
      });
      setTxHash(hash as `0x${string}`);
      setTxStatus("success");
    } catch {
      setTxStatus("error");
    }
  }

  const actionLabel = useMemo(() => {
    if (!account.isConnected) return "Connect Wallet";
    if (!inputToken || !outputToken) return "Select a token";
    if (!inputAmount) return "Enter amount";
    if (needsApproval) return `Approve ${inputToken.symbol}`;
    return "Swap";
  }, [account.isConnected, inputToken, outputToken, inputAmount, needsApproval]);

  async function onAction() {
    if (!account.isConnected) return; // Navbar button manages connection
    if (!inputToken || !outputToken || !inputAmount) return;
    if (needsApproval) return onApprove();
    return onSwap();
  }

  return (
    <Box maxW="520px" w="100%" borderWidth="1px" borderColor="cardBorder" rounded="xl" p={6} bg="cardBg" boxShadow="card">
      <Flex direction="column" align="stretch" gap={4}>
        <Flex justify="space-between" align="center">
          <Heading size="lg" mb={1} fontWeight="semibold">Swap</Heading>
          <IconButton aria-label="settings" variant="ghost" onClick={() => setSettingsOpen(true)}>
            ⚙️
          </IconButton>
        </Flex>

        <TokenInput
          label="From"
          token={inputToken}
          amount={inputAmount}
          onAmountChange={(v) => { setInputAmount(v); setOutputAmount(""); }}
          onTokenSelect={() => setSelecting("in")}
        />
        <HStack justify="center">
          <IconButton 
            aria-label="invert" 
            variant="ghost" 
            colorScheme="brand"
            onClick={() => {
              const a = inputToken; const b = outputToken; setInputToken(b); setOutputToken(a);
              const ai = inputAmount; const ao = outputAmount; setInputAmount(ao); setOutputAmount(ai);
            }}
          >
            <FiArrowDown />
          </IconButton>
        </HStack>

        <TokenInput
          label="To"
          token={outputToken}
          amount={outputAmount}
          onAmountChange={(v) => { setOutputAmount(v); setInputAmount(""); }}
          onTokenSelect={() => setSelecting("out")}
        />

        <Button colorScheme="brand" onClick={onAction} loading={txStatus === "approving" || txStatus === "swapping"} disabled={!inputToken || !outputToken || !inputAmount} _disabled={{ opacity: 0.6, cursor: "not-allowed" }}>
          {actionLabel}
        </Button>
        <Box>
          <Button variant="ghost" colorScheme="brand" size="sm" onClick={() => setDetailsOpen((v) => !v)}>
            {detailsOpen ? "Hide details ↑" : "Show details ↓"}
          </Button>
          {detailsOpen && (
            <Box mt={2} fontSize="sm" color="gray.400">
              <Text>Slippage tolerance: {slippageTolerance}%</Text>
              {path.length > 1 && (
                <Text>Route: {path.map((p, i) => (i === 0 ? p : ` → ${p}`))}</Text>
              )}
            </Box>
          )}
        </Box>
      </Flex>

      <TokenSelectModal
        isOpen={Boolean(selecting)}
        onClose={() => setSelecting(null)}
        onTokenSelect={(t) => (selecting === "in" ? setInputToken(t) : setOutputToken(t))}
      />

      {/* Settings Overlay */}
      {settingsOpen && (
        <Box position="fixed" inset={0} bg="blackAlpha.600" zIndex={1000} onClick={() => setSettingsOpen(false)}>
          <Box
            onClick={(e) => e.stopPropagation()}
            bg="panelBg"
            borderWidth="1px"
            borderColor="panelBorder"
            rounded="lg"
            shadow="lg"
            w="full"
            maxW="420px"
            mx="auto"
            mt="15vh"
            p={4}
          >
            <Heading size="sm" mb={3}>Swap Settings</Heading>
            <Flex direction="column" gap={3}>
              <Text fontSize="sm" color="gray.400">Slippage tolerance</Text>
              <HStack>
                {[0.1, 0.5, 1.0].map((v) => (
                  <Button key={v} variant={slippageTolerance === v ? "solid" : "outline"} colorScheme="brand" size="sm" onClick={() => setSlippageTolerance(v)}>
                    {v}%
                  </Button>
                ))}
              </HStack>
              <Flex align="center" gap={2}>
                <Text fontSize="sm">Custom:</Text>
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={slippageTolerance}
                  onChange={(e) => setSlippageTolerance(Number(e.target.value))}
                  style={{ width: 100, background: "transparent", border: "1px solid", borderColor: "rgba(255,255,255,0.2)", padding: "6px 8px", borderRadius: 6 }}
                />
                <Text>%</Text>
              </Flex>
              <Flex justify="flex-end" pt={2}>
                <Button onClick={() => setSettingsOpen(false)}>Close</Button>
              </Flex>
            </Flex>
          </Box>
        </Box>
      )}
    </Box>
  );
}


