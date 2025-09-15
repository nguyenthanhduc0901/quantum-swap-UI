"use client";

import { useState } from "react";
import {
  Box, Flex, Heading, Text, HStack, Button, Skeleton,
  VStack, Image, chakra
} from "@chakra-ui/react";
import { GradientButton } from "@/components/ui/GradientButton";
import type { Abi } from "viem";
import { formatUnits } from "viem";
import { useAccount, useChainId, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { quantumSwapPairAbi as pairAbi, quantumSwapRouterAbi as routerAbi } from "@/constants/abi/minimal";
import { getContracts } from "@/constants/addresses";
import { useTokenList } from "@/hooks/useTokenList";
import { useSettings } from "@/contexts/SettingsContext";
import { useTransactionStatus } from "@/hooks/useTransactionStatus";

function InfoRow({ label, value }: { label: string, value: React.ReactNode }) {
  const isPrimitive = typeof value === 'string' || typeof value === 'number';
  return (
    <Flex justify="space-between" align="center">
      <Text color="whiteAlpha.600" fontSize="sm">{label}</Text>
      {isPrimitive ? (
        <Text color="whiteAlpha.800" fontSize="sm">{value as any}</Text>
      ) : (
        <Box>{value}</Box>
      )}
    </Flex>
  );
}

function TokenAmountDisplay({ symbol, amount, logo, isLoading }: { symbol: string, amount: string, logo?: string, isLoading: boolean }) {
  return (
    <Flex justify="space-between" align="center" w="full">
      <HStack>
        <Image src={logo} boxSize="28px" rounded="full" />
        <Text fontSize="lg" fontWeight="bold" color="white">{symbol}</Text>
      </HStack>
      {isLoading ? (
        <Box h="32px" w="140px" bg="whiteAlpha.200" rounded="md" />
      ) : (
        <Heading size="lg" color="whiteAlpha.900">{amount}</Heading>
      )}
    </Flex>
  );
}

type Props = { pairAddress: `0x${string}`; onClose?: () => void };

export function RemoveLiquidityComponent({ pairAddress, onClose }: Props) {
  const chainId = useChainId() ?? 31337;
  const { address } = useAccount();
  const { tokens } = useTokenList();
  const { slippageTolerance, deadlineMinutes } = useSettings();
  const contracts = getContracts(chainId);
  const router = contracts?.QuantumSwapRouter as `0x${string}`;

  const [percentageToRemove, setPercentageToRemove] = useState<number>(25);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const reads = useReadContracts({
    contracts: [
      { address: pairAddress, abi: pairAbi as Abi, functionName: "token0" },
      { address: pairAddress, abi: pairAbi as Abi, functionName: "token1" },
      { address: pairAddress, abi: pairAbi as Abi, functionName: "getReserves" },
      { address: pairAddress, abi: pairAbi as Abi, functionName: "totalSupply" },
      ...(address ? [
        { address: pairAddress, abi: pairAbi as Abi, functionName: "balanceOf", args: [address] },
        { address: pairAddress, abi: pairAbi as Abi, functionName: "allowance", args: [address, router] },
      ] : []),
    ],
    query: { enabled: Boolean(pairAddress) },
  });

  const token0 = reads.data?.[0]?.result as `0x${string}` | undefined;
  const token1 = reads.data?.[1]?.result as `0x${string}` | undefined;
  const reserves = reads.data?.[2]?.result as [bigint, bigint, number] | undefined;
  const totalSupplyRaw = reads.data?.[3]?.result as bigint | undefined;
  const lpBalanceRaw = reads.data?.[4]?.result as bigint | undefined;
  const allowanceRaw = reads.data?.[5]?.result as bigint | undefined;
  const totalSupply = totalSupplyRaw ?? 0n;
  const lpBalance = lpBalanceRaw ?? 0n;
  const allowance = allowanceRaw ?? 0n;

  // Read token metadata on-chain for accuracy (fallback to token list)
  const ERC20_META = [
    { name: "symbol", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
    { name: "decimals", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  ] as const satisfies Abi;
  const metaReads = useReadContracts({
    contracts: token0 && token1 ? [
      { address: token0 as `0x${string}`, abi: ERC20_META as Abi, functionName: "symbol" as const },
      { address: token0 as `0x${string}`, abi: ERC20_META as Abi, functionName: "decimals" as const },
      { address: token1 as `0x${string}`, abi: ERC20_META as Abi, functionName: "symbol" as const },
      { address: token1 as `0x${string}`, abi: ERC20_META as Abi, functionName: "decimals" as const },
    ] : [],
    query: { enabled: Boolean(token0 && token1) }
  });

  const t0Meta = token0 ? tokens.find(t => t.address.toLowerCase() === token0.toLowerCase()) : undefined;
  const t1Meta = token1 ? tokens.find(t => t.address.toLowerCase() === token1.toLowerCase()) : undefined;
  const sym0OnChain = (metaReads.data?.[0]?.result as string) ?? undefined;
  const dec0OnChain = (metaReads.data?.[1]?.result as number | undefined) ?? undefined;
  const sym1OnChain = (metaReads.data?.[2]?.result as string) ?? undefined;
  const dec1OnChain = (metaReads.data?.[3]?.result as number | undefined) ?? undefined;
  const symbol0 = sym0OnChain ?? t0Meta?.symbol ?? "TKN0";
  const symbol1 = sym1OnChain ?? t1Meta?.symbol ?? "TKN1";
  const decimals0 = (dec0OnChain !== undefined ? Number(dec0OnChain) : t0Meta?.decimals) ?? 18;
  const decimals1 = (dec1OnChain !== undefined ? Number(dec1OnChain) : t1Meta?.decimals) ?? 18;
  const logo0 = t0Meta?.logoURI;
  const logo1 = t1Meta?.logoURI;

  const amountLpToBurn = lpBalance * BigInt(percentageToRemove) / 100n;
  const reserve0 = reserves?.[0] ?? 0n;
  const reserve1 = reserves?.[1] ?? 0n;
  // Integer on-chain estimate (may floor to 0 for very small shares)
  const amount0ToReceive = totalSupply > 0n ? (reserve0 * amountLpToBurn) / totalSupply : 0n;
  const amount1ToReceive = totalSupply > 0n ? (reserve1 * amountLpToBurn) / totalSupply : 0n;

  // Float estimate for UI to avoid floor-to-zero effect on very small shares
  const reserve0Float = Number(formatUnits(reserve0 ?? 0n, decimals0));
  const reserve1Float = Number(formatUnits(reserve1 ?? 0n, decimals1));
  const shareFloat = totalSupply > 0n ? (Number(amountLpToBurn) / Number(totalSupply)) : 0;
  const est0Float = reserve0Float * shareFloat;
  const est1Float = reserve1Float * shareFloat;
  const a0Num = Number(formatUnits(amount0ToReceive, decimals0));
  const a1Num = Number(formatUnits(amount1ToReceive, decimals1));
  function formatEstimatedAmount(exact: number, estimate: number): string {
    const val = exact > 0 ? exact : estimate;
    if (!isFinite(val)) return "-";
    if (val > 0 && val < 1e-6) return "<0.000001";
    return val.toLocaleString(undefined, { maximumFractionDigits: 6 });
  }
  const amount0Display = formatEstimatedAmount(a0Num, est0Float);
  const amount1Display = formatEstimatedAmount(a1Num, est1Float);
  const res0Display = (reserve0Float || 0).toLocaleString(undefined, { maximumFractionDigits: 6 });
  const res1Display = (reserve1Float || 0).toLocaleString(undefined, { maximumFractionDigits: 6 });

  const hasData = Boolean(reserves && totalSupplyRaw !== undefined);
  const showEstimates = true;
  const isLoadingMeta = metaReads.isLoading;
  const isLoadingData = reads.isLoading || isLoadingMeta;
  const isLoadingPairOnly = reads.isLoading;
  const isLoadingAmounts = reads.isLoading || (reads as any).isFetching; // amounts should not wait for metadata
  const needsApproval = allowance < amountLpToBurn;

  const { writeContractAsync } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: txHash });
  useTransactionStatus({ isPending: receipt.isLoading, isSuccess: receipt.isSuccess, isError: receipt.isError, error: receipt.error, hash: txHash });

  async function onApprove() {
    if (!pairAddress || amountLpToBurn === 0n) return;
    try {
      const hash = await writeContractAsync({ address: pairAddress, abi: pairAbi as Abi, functionName: "approve", args: [router, amountLpToBurn] });
      setTxHash(hash);
    } catch {}
  }

  async function onRemove() {
    if (!token0 || !token1 || amountLpToBurn === 0n || !address) return;
    try {
      const bps = Math.floor(slippageTolerance * 100);
      const denom = 10000n;
      const min0 = (amount0ToReceive * (denom - BigInt(bps))) / denom;
      const min1 = (amount1ToReceive * (denom - BigInt(bps))) / denom;
      const deadline = BigInt(Math.floor(Date.now() / 1000) + deadlineMinutes * 60);
      const hash = await writeContractAsync({ address: router, abi: routerAbi as Abi, functionName: "removeLiquidity", args: [token0, token1, amountLpToBurn, min0, min1, address, deadline] });
      setTxHash(hash);
    } catch {}
  }

  return (
    <Box w={{ base: "100%", md: "560px" }} p={{ base: 5, md: 6 }} bg="rgba(23, 35, 53, 0.75)" backdropFilter="blur(15px)" border="1px solid" borderColor="rgba(255, 255, 255, 0.05)" rounded="2xl" boxShadow="0 10px 30px rgba(0,0,0,0.3)">
      <VStack align="stretch" gap={6}>
        <VStack align="flex-start" gap={1}>
          <Heading size="lg" color="whiteAlpha.900">Remove Liquidity</Heading>
          {isLoadingData ? (
            <Box h="20px" w="120px" bg="whiteAlpha.200" rounded="md" />
          ) : (
            <Text color="whiteAlpha.600" fontSize="sm">Pair: {symbol0} / {symbol1}</Text>
          )}
        </VStack>

        <Box h="1px" bg="whiteAlpha.200" />

        <VStack gap={3}>
          <Heading size="2xl" color="white">{percentageToRemove}%</Heading>
          <Box position="relative" px={1} w="full">
            <chakra.input
              type="range"
              min={0}
              max={100}
              step={1}
              value={percentageToRemove}
              onChange={(e: any) => setPercentageToRemove(Number(e.target.value))}
              w="100%"
              css={{
                WebkitAppearance: 'none',
                appearance: 'none',
                height: '6px',
                borderRadius: '9999px',
                background: 'linear-gradient(90deg, #0052FF 0%, #00D1B2 100%)',
                outline: 'none',
                opacity: 0.9,
                transition: 'opacity 0.2s',
                '&:hover': { opacity: 1 },
                '::-webkit-slider-thumb': {
                  WebkitAppearance: 'none',
                  appearance: 'none',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: '#0f1928',
                  border: '2px solid #00FFC2',
                  boxShadow: '0 0 12px rgba(0,255,194,0.5)',
                  cursor: 'pointer',
                  marginTop: '-6px',
                },
                '::-moz-range-thumb': {
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: '#0f1928',
                  border: '2px solid #00FFC2',
                  boxShadow: '0 0 12px rgba(0,255,194,0.5)',
                  cursor: 'pointer',
                },
                '::-ms-thumb': {
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: '#0f1928',
                  border: '2px solid #00FFC2',
                  boxShadow: '0 0 12px rgba(0,255,194,0.5)',
                  cursor: 'pointer',
                },
              }}
            />
          </Box>
          <HStack w="full" justify="space-between">
            {[25, 50, 75, 100].map(val => (<Button key={val} size="sm" variant="ghost" color="whiteAlpha.600" _hover={{ bg: 'whiteAlpha.100', color: 'white' }} onClick={() => setPercentageToRemove(val)}>{val}%</Button>))}
          </HStack>
        </VStack>

        <VStack p={4} bg="blackAlpha.300" rounded="xl" border="1px solid" borderColor="rgba(255, 255, 255, 0.08)" gap={3} align="stretch">
          <Text fontWeight="semibold" color="whiteAlpha.800">Pool Reserves</Text>
          <HStack justify="space-between">
            <Box>
              <Text color="whiteAlpha.700" fontSize="sm">Reserve0</Text>
              <Text color="white" fontWeight="bold">{res0Display} {symbol0}</Text>
            </Box>
            <Box>
              <Text color="whiteAlpha.700" fontSize="sm">Reserve1</Text>
              <Text color="white" fontWeight="bold">{res1Display} {symbol1}</Text>
            </Box>
          </HStack>
        </VStack>

        <VStack p={4} bg="blackAlpha.400" rounded="xl" border="1px solid" borderColor="rgba(255, 255, 255, 0.08)" gap={4} align="stretch">
          <Text fontWeight="semibold" color="whiteAlpha.800">You will receive (estimated)</Text>
          <TokenAmountDisplay symbol={symbol0} amount={amount0Display} logo={logo0} isLoading={isLoadingAmounts} />
          <TokenAmountDisplay symbol={symbol1} amount={amount1Display} logo={logo1} isLoading={isLoadingAmounts} />
        </VStack>

        <VStack gap={2} align="stretch">
          <InfoRow label="Your LP token balance" value={isLoadingPairOnly ? <Skeleton rounded="md" h="20px" w="100px" /> : formatUnits(lpBalance, 18)} />
          <InfoRow label="LP tokens to remove" value={isLoadingPairOnly ? <Skeleton rounded="md" h="20px" w="100px" /> : formatUnits(amountLpToBurn, 18)} />
        </VStack>

        <HStack pt={2}>
          {onClose && <Button variant="outline" borderColor="whiteAlpha.300" color="whiteAlpha.800" _hover={{ bg: 'whiteAlpha.100' }} onClick={onClose} flex={1}>Cancel</Button>}
          <GradientButton onClick={needsApproval ? onApprove : onRemove} loading={receipt.isLoading} disabled={amountLpToBurn === 0n || !address} flex={2}>
            {needsApproval ? "Approve" : "Remove"}
          </GradientButton>
        </HStack>
      </VStack>
    </Box>
  );
}