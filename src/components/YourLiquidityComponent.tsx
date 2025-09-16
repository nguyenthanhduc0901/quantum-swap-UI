"use client";

import { useMemo } from "react";
import {
  Text, VStack, Heading, Skeleton, Link as ChakraLink,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useAccount, useChainId, useReadContract, useReadContracts } from "wagmi";
import type { Abi } from "viem";
import { formatUnits } from "viem";
import { LiquidityPositionCard } from "./LiquidityPositionCard";
import { useTokenList } from "@/hooks/useTokenList";
import { quantumSwapFactoryAbi as factoryAbi, quantumSwapPairAbi as pairAbi } from "@/constants/abi/minimal";
import { getContracts } from "@/constants/addresses";
import { GradientButton } from "@/components/ui/GradientButton";

// Logic hooks và state không thay đổi nhiều, chỉ tổ chức lại
export function YourLiquidityComponent() {
  const chainId = useChainId() ?? 31337;
  const account = useAccount();
  const contracts = getContracts(chainId);
  const factory = contracts?.QuantumSwapFactory as `0x${string}`;

  // 1. Lấy tổng số cặp
  const { data: lengthData, isLoading: isLoadingLength } = useReadContract({
    address: factory, abi: factoryAbi as Abi, functionName: "allPairsLength",
  });
  const length = Number((lengthData as bigint) ?? 0n);

  // 2. Lấy địa chỉ của tất cả các cặp
  const pairIndexCalls = useMemo(() => Array.from({ length }, (_, i) => ({
    address: factory, abi: factoryAbi as Abi, functionName: "allPairs" as const, args: [BigInt(i)],
  })), [factory, length]);
  const { data: pairsData, isLoading: isLoadingPairs } = useReadContracts({
    contracts: pairIndexCalls, query: { enabled: length > 0 },
  });
  const pairAddresses = useMemo(() => (pairsData?.map(r => r.result as `0x${string}`).filter(Boolean) ?? []) as `0x${string}`[], [pairsData]);

  // 3. Lấy số dư của người dùng cho mỗi cặp
  const balanceCalls = useMemo(() => !account.address ? [] : pairAddresses.map(p => ({
    address: p, abi: pairAbi as Abi, functionName: "balanceOf" as const, args: [account.address],
  })), [pairAddresses, account.address]);
  const { data: balancesData, isLoading: isLoadingBalances } = useReadContracts({
    contracts: balanceCalls, query: { enabled: !!account.address && pairAddresses.length > 0 },
  });

  // Lọc ra các vị thế mà người dùng có sở hữu
  const positionsWithBalance = useMemo(() => {
    if (!balancesData) return [];
    return balancesData.map((r, i) => ({
      balance: (r.result as bigint) ?? 0n,
      pairAddress: pairAddresses[i],
    })).filter(x => x.balance > 0n);
  }, [balancesData, pairAddresses]);

  // 4. Lấy thông tin token cho các vị thế sở hữu
  const tokenCalls = useMemo(() => positionsWithBalance.flatMap(p => [
    { address: p.pairAddress, abi: pairAbi as Abi, functionName: "token0" as const },
    { address: p.pairAddress, abi: pairAbi as Abi, functionName: "token1" as const },
  ]), [positionsWithBalance]);
  const { data: tokensData, isLoading: isLoadingTokens } = useReadContracts({ contracts: tokenCalls });

  const { tokens: tokenList } = useTokenList();
  const symbolMap = useMemo(() => new Map(tokenList.map(t => [t.address.toLowerCase(), t.symbol])), [tokenList]);
  const logoMap = useMemo(() => new Map(tokenList.map(t => [t.address.toLowerCase(), t.logoURI])), [tokenList]);

  const positions = useMemo(() => positionsWithBalance.map((p, i) => {
    const token0Address = tokensData?.[i * 2]?.result as `0x${string}` | undefined;
    const token1Address = tokensData?.[i * 2 + 1]?.result as `0x${string}` | undefined;
    return {
      ...p,
      token0Symbol: token0Address ? symbolMap.get(token0Address.toLowerCase()) ?? "TKN0" : "...",
      token1Symbol: token1Address ? symbolMap.get(token1Address.toLowerCase()) ?? "TKN1" : "...",
      token0Logo: token0Address ? logoMap.get(token0Address.toLowerCase()) : undefined,
      token1Logo: token1Address ? logoMap.get(token1Address.toLowerCase()) : undefined,
    };
  }), [positionsWithBalance, tokensData, symbolMap, logoMap]);

  // Trạng thái loading tổng hợp
  const isLoading = isLoadingLength || isLoadingPairs || isLoadingBalances || (positionsWithBalance.length > 0 && isLoadingTokens);

  if (isLoading) {
    return (
      <VStack
        w="full"
        p={{ base: 4, md: 6 }}
        gap={4}
        align="stretch"
        bg="rgba(23, 35, 53, 0.5)"
        backdropFilter="blur(10px)"
        border="1px solid"
        borderColor="rgba(255, 255, 255, 0.05)"
        rounded="2xl"
      >
        <Skeleton height="30px" width="200px" />
        <Skeleton height="80px" rounded="xl" />
        <Skeleton height="80px" rounded="xl" />
      </VStack>
    );
  }

  if (positions.length === 0) {
    return (
      <VStack
        w="full"
        p={{ base: 6, md: 8 }}
        gap={4}
        bg="rgba(23, 35, 53, 0.5)"
        backdropFilter="blur(10px)"
        border="1px solid"
        borderColor="rgba(255, 255, 255, 0.05)"
        rounded="2xl"
        textAlign="center"
      >
        <Heading size="md" color="whiteAlpha.900">No Liquidity Found</Heading>
        <Text color="whiteAlpha.600">You do not have any liquidity positions in this pool yet.</Text>
        <ChakraLink as={NextLink} href="/pool">
          <GradientButton>Add Liquidity</GradientButton>
        </ChakraLink>
      </VStack>
    );
  }

  return (
    <VStack w="full" align="stretch" gap={4}>
      <Heading size="lg" color="whiteAlpha.900">Your Liquidity</Heading>
      {positions.map(p => (
        <LiquidityPositionCard
          key={p.pairAddress}
          pairAddress={p.pairAddress}
          token0Symbol={p.token0Symbol}
          token1Symbol={p.token1Symbol}
          lpBalance={`${Number(formatUnits(p.balance, 18)).toLocaleString(undefined, { maximumFractionDigits: 6 })} LP`}
          positionValue={``}
          token0Logo={p.token0Logo}
          token1Logo={p.token1Logo}
        />
      ))}
    </VStack>
  );
}