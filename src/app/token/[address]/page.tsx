"use client";

import { notFound, useParams } from "next/navigation";
import { Container, Heading, Text, VStack, Box, Skeleton } from "@chakra-ui/react";
import { useMemo } from "react";
import { useChainId, useReadContract, useReadContracts } from "wagmi";
import type { Abi } from "viem";
import { quantumSwapFactoryAbi as factoryAbi, quantumSwapPairAbi as pairAbi } from "@/constants/abi/minimal";
import { getContracts } from "@/constants/addresses";

export default function TokenDetailPage() {
  const params = useParams<{ address: `0x${string}` }>();
  const token = params?.address as `0x${string}` | undefined;
  if (!token) notFound();
  const chainId = useChainId() ?? 31337;
  const factory = getContracts(chainId)?.QuantumSwapFactory as `0x${string}`;

  const lenRead = useReadContract({ address: factory, abi: factoryAbi as Abi, functionName: "allPairsLength" });
  const length = Number((lenRead.data as bigint) ?? 0n);
  const indexCalls = useMemo(() => Array.from({ length }, (_, i) => ({
    address: factory, abi: factoryAbi as Abi, functionName: "allPairs" as const, args: [BigInt(i)],
  })), [factory, length]);
  const pairsRes = useReadContracts({ contracts: indexCalls, query: { enabled: length > 0 } });
  const pairAddresses = useMemo(() => (pairsRes.data?.map(r => r.result as `0x${string}`) ?? []) as `0x${string}`[], [pairsRes.data]);

  const tokenCalls = useMemo(() => pairAddresses.flatMap((p) => ([
    { address: p, abi: pairAbi as Abi, functionName: "token0" as const },
    { address: p, abi: pairAbi as Abi, functionName: "token1" as const },
  ])), [pairAddresses]);
  const tokensRes = useReadContracts({ contracts: tokenCalls, query: { enabled: pairAddresses.length > 0 } });

  const pools = useMemo(() => pairAddresses.filter((_, i) => {
    const t0 = tokensRes.data?.[i*2]?.result as `0x${string}` | undefined;
    const t1 = tokensRes.data?.[i*2+1]?.result as `0x${string}` | undefined;
    return t0?.toLowerCase() === token?.toLowerCase() || t1?.toLowerCase() === token?.toLowerCase();
  }), [pairAddresses, tokensRes.data, token]);

  const isLoading = lenRead.isLoading || pairsRes.isLoading || tokensRes.isLoading;

  return (
    <Container maxW="container.lg" py={{ base: 8, md: 12 }}>
      <VStack align="stretch" gap={6}>
        <Heading size="lg" color="white">Token</Heading>
        <Box bg="rgba(23,35,53,0.6)" backdropFilter="blur(12px)" border="1px solid" borderColor="rgba(255,255,255,0.08)" rounded="xl" p={4}>
          <Text color="whiteAlpha.800">Address: {token}</Text>
        </Box>
        <Heading size="md" color="white">Related Pools</Heading>
        {isLoading ? (
          <Skeleton h="80px" rounded="xl" />
        ) : (
          <VStack align="stretch" gap={3}>
            {pools.map((p) => (
              <Box key={p} bg="blackAlpha.300" rounded="xl" border="1px solid" borderColor="rgba(255,255,255,0.08)" p={4}>
                <Text color="whiteAlpha.800">{p}</Text>
              </Box>
            ))}
            {pools.length === 0 && <Text color="whiteAlpha.600">No pools found.</Text>}
          </VStack>
        )}
      </VStack>
    </Container>
  );
}


