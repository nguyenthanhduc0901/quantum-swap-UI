"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Box, Flex, Heading, Text, IconButton, VStack, HStack, Button,
  useDisclosure, // Thêm các component cần thiết
} from "@chakra-ui/react";
import { FiArrowDown, FiSettings, FiAlertTriangle } from "react-icons/fi";
import { GradientButton } from "./ui/GradientButton";
import { SettingsModal } from "./ui/SettingsModal";
import { TokenInfo, getDefaultTokens } from "../constants/tokens";
import { TokenSelectModal } from "./ui/TokenSelectModal";
import { TokenInput } from "./ui/TokenInput"; // QUAN TRỌNG: Tái sử dụng!
import { useAccount, useChainId, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from "wagmi";
import { type Abi, formatUnits, parseUnits } from "viem";
import { quantumSwapRouterAbi as routerAbi, quantumSwapPairAbi as erc20Abi, quantumSwapFactoryAbi as factoryAbi } from "../constants/abi/minimal";
import { getContracts, type QuantumSwapAddresses } from "../constants/addresses";
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
  const weth = contracts?.WETH as `0x${string}`;
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
  const { open: isDetailsOpen, onToggle: onToggleDetails } = useDisclosure();
  const { open: isConfirmOpen, onOpen: onOpenConfirm, onClose: onCloseConfirm } = useDisclosure();
  const publicClient = usePublicClient();

  const routePath = useMemo(() => inputToken && outputToken ? [inputToken.address, outputToken.address] : [], [inputToken, outputToken]);

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
              {/* Thêm các chi tiết khác nếu cần */}
            </VStack>
          )}

          <GradientButton size="lg" fontSize="md" onClick={handleAction} disabled={!account.isConnected || hasInsufficient || !inputAmount} loading={receipt.isLoading}>
            {actionLabel}
          </GradientButton>
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