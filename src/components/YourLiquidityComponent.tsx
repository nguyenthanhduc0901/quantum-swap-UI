"use client";

import { useMemo } from "react";
import { Box, Flex, Spinner, Text } from "@chakra-ui/react";
import { useAccount, useChainId, useReadContract, useReadContracts } from "wagmi";
import type { Abi } from "viem";
import { LiquidityPositionCard } from "./LiquidityPositionCard";
import { useTokenList } from "@/hooks/useTokenList";
import factoryAbi from "@/constants/abi/QuantumSwapFactory.json";
import pairAbi from "@/constants/abi/QuantumSwapPair.json";
import { getContracts, type QuantumSwapAddresses } from "@/constants/addresses";
import { getDefaultTokens } from "@/constants/tokens";

type Position = { pairAddress: `0x${string}`; token0?: `0x${string}`; token1?: `0x${string}` };

export function YourLiquidityComponent() {
  const chainId = useChainId() ?? 31337;
  const account = useAccount();
  const contracts = getContracts(chainId) as QuantumSwapAddresses | undefined;
  const factory = (contracts?.QuantumSwapFactory ?? "0x0000000000000000000000000000000000000000") as `0x${string}`;

  // 1) Get pairs length
  const lengthRead = useReadContract({
    address: factory,
    abi: factoryAbi.abi as Abi,
    functionName: "allPairsLength",
    args: [],
    query: { enabled: Boolean(factory) },
  });
  const length = Number((lengthRead.data as bigint | undefined) ?? 0n);

  // 2) Fetch all pair addresses
  const pairIndexCalls = useMemo(() => {
    return Array.from({ length }, (_, i) => ({
      address: factory as `0x${string}`,
      abi: factoryAbi.abi as Abi,
      functionName: "allPairs" as const,
      args: [BigInt(i)],
    }));
  }, [factory, length]);

  const pairsRead = useReadContracts({
    contracts: pairIndexCalls,
    query: { enabled: length > 0 },
  });

  const pairAddresses = useMemo(() => {
    if (!pairsRead.data) return [] as `0x${string}`[];
    return pairsRead.data
      .map((r) => r.result as `0x${string}`)
      .filter((a) => a && a !== "0x0000000000000000000000000000000000000000");
  }, [pairsRead.data]);

  // 3) Fetch balanceOf for each pair for current user
  const balanceCalls = useMemo(() => {
    if (!account.address) return [] as any[];
    return pairAddresses.map((p) => ({
      address: p,
      abi: pairAbi.abi as Abi,
      functionName: "balanceOf" as const,
      args: [account.address],
    }));
  }, [pairAddresses, account.address]);

  const balancesRead = useReadContracts({
    contracts: balanceCalls,
    query: { enabled: pairAddresses.length > 0 && Boolean(account.address) },
  });

  const positionsPairs = useMemo(() => {
    if (!balancesRead.data) return [] as `0x${string}`[];
    return balancesRead.data
      .map((r, i) => ({ balance: (r.result as bigint) ?? 0n, pair: pairAddresses[i] }))
      .filter((x) => x.balance > 0n)
      .map((x) => x.pair);
  }, [balancesRead.data, pairAddresses]);

  // 4) Resolve token0/token1 for each kept pair
  const token0Calls = useMemo(() => positionsPairs.map((p) => ({
    address: p,
    abi: pairAbi.abi as Abi,
    functionName: "token0" as const,
    args: [],
  })), [positionsPairs]);

  const token1Calls = useMemo(() => positionsPairs.map((p) => ({
    address: p,
    abi: pairAbi.abi as Abi,
    functionName: "token1" as const,
    args: [],
  })), [positionsPairs]);

  const token0Read = useReadContracts({ contracts: token0Calls, query: { enabled: positionsPairs.length > 0 } });
  const token1Read = useReadContracts({ contracts: token1Calls, query: { enabled: positionsPairs.length > 0 } });

  const { tokens: listTokens } = useTokenList();

  const positions: Position[] = useMemo(() => {
    const defaults = getDefaultTokens(chainId ?? 31337);
    const addrToSymbol = new Map<string, string>([
      ...defaults.map((t) => [t.address.toLowerCase(), t.symbol] as const),
      ...listTokens.map((t) => [t.address.toLowerCase(), t.symbol] as const),
    ]);
    if (!token0Read.data || !token1Read.data) return positionsPairs.map((p) => ({ pairAddress: p }));
    return positionsPairs.map((p, i) => {
      const t0 = (token0Read.data?.[i]?.result as `0x${string}` | undefined)?.toLowerCase();
      const t1 = (token1Read.data?.[i]?.result as `0x${string}` | undefined)?.toLowerCase();
      return {
        pairAddress: p,
        token0: t0 as `0x${string}` | undefined,
        token1: t1 as `0x${string}` | undefined,
        token0Symbol: t0 ? (addrToSymbol.get(t0) ?? "Token0") : "Token0",
        token1Symbol: t1 ? (addrToSymbol.get(t1) ?? "Token1") : "Token1",
      } as any;
    });
  }, [positionsPairs, token0Read.data, token1Read.data, chainId, listTokens]);

  // Read user's LP balances for each shown pair
  const userBalancesCalls = useMemo(() => {
    if (!account.address) return [] as any[];
    return positionsPairs.map((p) => ({
      address: p,
      abi: pairAbi.abi as Abi,
      functionName: "balanceOf" as const,
      args: [account.address],
    }));
  }, [positionsPairs, account.address]);
  const userBalances = useReadContracts({ contracts: userBalancesCalls, query: { enabled: positionsPairs.length > 0 && Boolean(account.address) } });

  if (lengthRead.isLoading || pairsRead.isLoading || balancesRead.isLoading) {
    return (
      <Flex direction="column" align="center" justify="center" py={10} gap={2}>
        <Spinner color="teal.500" />
        <Text color="gray.600">Fetching your positions...</Text>
      </Flex>
    );
  }

  if (positions.length === 0) {
    return (
      <Box w={{ base: "100%", md: "520px" }} borderWidth="1px" borderColor="cardBorder" rounded="xl" p={6} bg="cardBg" boxShadow="card">
        <Text color="gray.500">You have no liquidity positions.</Text>
      </Box>
    );
  }

  return (
    <Flex direction="column" align="stretch" gap={3}>
      {positions.map((p, i) => {
        const bal = (userBalances.data?.[i]?.result as bigint | undefined)?.toString();
        return (
          <Box key={p.pairAddress}>
            <LiquidityPositionCard pairAddress={p.pairAddress} token0Symbol={(p as any).token0Symbol} token1Symbol={(p as any).token1Symbol} />
            {bal && (
              <Text mt={1} color="gray.500" fontSize="sm">Your LP: {bal}</Text>
            )}
          </Box>
        );
      })}
    </Flex>
  );
}



