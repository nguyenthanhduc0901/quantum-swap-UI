"use client";
import { useMemo, useState, useEffect } from "react";
import { Box, Center, Flex, Heading, Text, VStack } from "@chakra-ui/react";
import { FiPlus } from "react-icons/fi"; // Biểu tượng dấu cộng thay thế
import { GradientButton } from "@/components/ui/GradientButton";
import { useAccount, useChainId, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import type { Abi } from "viem";
import { parseUnits } from "viem";

// --- Import các component và hook đã được thiết kế lại ---
import { TokenSelectModal } from "@/components/ui/TokenSelectModal";
import { TokenInput } from "@/components/ui/TokenInput"; // QUAN TRỌNG: Tái sử dụng component này
import { getDefaultTokens, type TokenInfo } from "@/constants/tokens";
import { useLiquidityCalculations } from "@/hooks/useLiquidityCalculations";
import { getContracts, type QuantumSwapAddresses } from "@/constants/addresses";
import { quantumSwapRouterAbi as routerAbi, quantumSwapPairAbi as pairAbi } from "@/constants/abi/minimal";
import { useTransactionStatus } from "@/hooks/useTransactionStatus";
import { useSettings } from "@/contexts/SettingsContext";

// Component con để hiển thị thông tin giá
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Flex justify="space-between" align="center">
      <Text fontSize="sm" color="whiteAlpha.600">{label}</Text>
      <Box fontSize="sm" fontWeight="medium" color="whiteAlpha.800">{value}</Box>
    </Flex>
  );
}

export function AddLiquidityComponent() {
  // --- TOÀN BỘ LOGIC HOOKS VÀ STATE (Không thay đổi) ---
  const chainId = useChainId() ?? 31337;
  const account = useAccount();
  const contracts = getContracts(chainId) as QuantumSwapAddresses | undefined;
  const router = contracts?.QuantumSwapRouter as `0x${string}` | undefined;

  const defaults = useMemo(() => getDefaultTokens(chainId), [chainId]);
  const [tokenA, setTokenA] = useState<TokenInfo | null>(defaults[0] ?? null);
  const [tokenB, setTokenB] = useState<TokenInfo | null>(defaults[1] ?? null);
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [selecting, setSelecting] = useState<"A" | "B" | null>(null);

  const { priceAB, priceBA, shareOfPool, reserves } = useLiquidityCalculations({ tokenA, tokenB, amountA, amountB });
  const sameToken = useMemo(() => tokenA && tokenB && tokenA.address.toLowerCase() === tokenB.address.toLowerCase(), [tokenA, tokenB]);

  // Không tự động điền. Chỉ hiển thị thông tin khi cả hai trường đã nhập.

  const allowanceA = useReadContract({ address: tokenA?.address, abi: pairAbi as Abi, functionName: "allowance", args: account.address && tokenA && router ? [account.address, router] : undefined, query: { enabled: Boolean(account.address && tokenA && router) } });
  const allowanceB = useReadContract({ address: tokenB?.address, abi: pairAbi as Abi, functionName: "allowance", args: account.address && tokenB && router ? [account.address, router] : undefined, query: { enabled: Boolean(account.address && tokenB && router) } });

  const amountAWei = tokenA ? parseUnits((amountA || "0") as `${string}`, tokenA.decimals) : 0n;
  const amountBWei = tokenB ? parseUnits((amountB || "0") as `${string}`, tokenB.decimals) : 0n;
  
  const needsApproveA = useMemo(() => tokenA && allowanceA.data ? ((allowanceA.data as bigint) < amountAWei) : false, [allowanceA.data, tokenA, amountAWei]);
  const needsApproveB = useMemo(() => tokenB && allowanceB.data ? ((allowanceB.data as bigint) < amountBWei) : false, [allowanceB.data, tokenB, amountBWei]);

  const { writeContractAsync } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const receipt = useWaitForTransactionReceipt({ hash: txHash });
  useTransactionStatus({ isPending: !!txHash && receipt.isLoading, isSuccess: receipt.isSuccess, isError: receipt.isError, error: receipt.error, hash: txHash as string });

  const [step, setStep] = useState<"approveA" | "approveB" | "supply">("approveA");
  useEffect(() => { setStep(needsApproveA ? "approveA" : needsApproveB ? "approveB" : "supply"); }, [needsApproveA, needsApproveB]);

  const { slippageTolerance, deadlineMinutes } = useSettings();

  // Minimal ERC20 approve ABI
  const ERC20_APPROVE = [{ name: "approve", type: "function", stateMutability: "nonpayable", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [{ type: "bool" }] }] as const;
  const MAX_UINT = (2n ** 256n - 1n);

  async function onApproveA() {
    try {
      if (!tokenA || !router) return;
      const hash = await writeContractAsync({ address: tokenA.address, abi: ERC20_APPROVE as unknown as Abi, functionName: "approve", args: [router, MAX_UINT] });
      setTxHash(hash);
    } catch (e) { /* user rejected or error */ }
  }
  async function onApproveB() {
    try {
      if (!tokenB || !router) return;
      const hash = await writeContractAsync({ address: tokenB.address, abi: ERC20_APPROVE as unknown as Abi, functionName: "approve", args: [router, MAX_UINT] });
      setTxHash(hash);
    } catch (e) { /* user rejected or error */ }
  }
  async function onSupply() {
    try {
      if (!tokenA || !tokenB || !router || !account.address) return;
      const bps = BigInt(Math.floor(slippageTolerance * 100)); // 100 = hundredths of a percent
      const denom = 10000n; // basis points denominator

      // Compute optimal amounts using current reserves to avoid INSUFFICIENT_*_MIN
      let usedA = amountAWei;
      let usedB = amountBWei;
      if (reserves && reserves.reserveA > 0n && reserves.reserveB > 0n) {
        const optimalB = (amountAWei * reserves.reserveB) / reserves.reserveA;
        if (optimalB <= amountBWei) {
          usedA = amountAWei;
          usedB = optimalB;
        } else {
          const optimalA = (amountBWei * reserves.reserveA) / reserves.reserveB;
          usedA = optimalA;
          usedB = amountBWei;
        }
      }

      const amountAMin = usedA > 0n ? (usedA * (denom - bps)) / denom : 0n;
      const amountBMin = usedB > 0n ? (usedB * (denom - bps)) / denom : 0n;
      const deadline = BigInt(Math.floor(Date.now() / 1000)) + BigInt(deadlineMinutes) * 60n;
      const hash = await writeContractAsync({ address: router, abi: routerAbi as Abi, functionName: "addLiquidity", args: [tokenA.address, tokenB.address, amountAWei, amountBWei, amountAMin, amountBMin, account.address, deadline] });
      setTxHash(hash);
    } catch (e) { /* user rejected or error */ }
  }
  
  const mainCta = useMemo(() => {
    if (!account.isConnected) return { label: "Connect Wallet", action: undefined };
    if (sameToken) return { label: "Select different tokens", action: undefined };
    if (!tokenA || !tokenB || !(Number(amountA) > 0 && Number(amountB) > 0)) return { label: "Enter amounts", action: undefined };
    if (step === "approveA") return { label: `Approve ${tokenA.symbol}`, action: onApproveA };
    if (step === "approveB") return { label: `Approve ${tokenB.symbol}`, action: onApproveB };
    return { label: "Supply", action: onSupply };
  }, [account.isConnected, tokenA, tokenB, amountA, amountB, step, sameToken]);
  
  const bothEntered = Boolean(Number(amountA) > 0 && Number(amountB) > 0);
  const canSubmit = Boolean(tokenA && tokenB && bothEntered && mainCta.action);

  // --- GIAO DIỆN ĐÃ ĐƯỢC THIẾT KẾ LẠI ---
  return (
    <Box
      w={{ base: "100%", md: "520px" }}
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
          <Heading size="lg" color="whiteAlpha.900">Add Liquidity</Heading>
          {/* Có thể thêm nút cài đặt ở đây trong tương lai */}
        </Flex>

        {/* Tái sử dụng TokenInput */}
        <TokenInput
          label="You deposit"
          token={tokenA}
          amount={amountA}
          onAmountChange={setAmountA}
          onTokenSelect={() => setSelecting("A")}
          refreshKey={Number(txHash || 0)}
        />

        {/* Biểu tượng dấu cộng */}
        <Flex justify="center" my={-2}>
          <Center
            boxSize="40px"
            bg="blackAlpha.300"
            border="1px solid"
            borderColor="rgba(255, 255, 255, 0.05)"
            rounded="lg"
            color="whiteAlpha.600"
          >
            <Box as={FiPlus} />
          </Center>
        </Flex>

        {/* Tái sử dụng TokenInput */}
        <TokenInput
          label="You deposit"
          token={tokenB}
          amount={amountB}
          onAmountChange={setAmountB}
          onTokenSelect={() => setSelecting("B")}
          refreshKey={Number(txHash || 0)}
        />

        {/* Hiển thị thông tin giá và tỷ lệ */}
        {bothEntered && (
          <VStack
            p={4}
            bg="blackAlpha.300"
            rounded="xl"
            border="1px solid"
            borderColor="rgba(255, 255, 255, 0.05)"
            gap={2}
          >
            <InfoRow label="Price" value={
              tokenA && tokenB && priceAB && priceBA ? (
                <VStack align="flex-end" gap={0} fontSize="sm">
                  <Text>1 {tokenA.symbol} ≈ {priceAB.toFixed(6)} {tokenB.symbol}</Text>
                  <Text>1 {tokenB.symbol} ≈ {priceBA.toFixed(6)} {tokenA.symbol}</Text>
                </VStack>
              ) : "..."
            } />
            {bothEntered && typeof shareOfPool === "number" && (
              <InfoRow label="Share of Pool" value={`${shareOfPool.toFixed(4)}%`} />
            )}
          </VStack>
        )}

        {/* Nút hành động chính */}
        <GradientButton 
          disabled={!mainCta.action} 
          onClick={() => mainCta.action?.()}
          size="lg"
          fontSize="md"
        >
          {mainCta.label}
        </GradientButton>
      </VStack>

      <TokenSelectModal
        isOpen={Boolean(selecting)}
        onClose={() => setSelecting(null)}
        onTokenSelect={(t) => {
          if (selecting === "A") setTokenA(t);
          if (selecting === "B") setTokenB(t);
        }}
      />
    </Box>
  );
}