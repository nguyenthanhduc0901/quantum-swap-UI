import { useMemo } from "react";
import { Box, HStack, VStack, Text, Skeleton, Image } from "@chakra-ui/react";
import { TokenImage } from "@/components/ui/TokenImage";
import { GradientButton } from "@/components/ui/GradientButton";
import { useChainId, useReadContract, useReadContracts } from "wagmi";
import type { Abi } from "viem";
import { quantumSwapFactoryAbi as factoryAbi, quantumSwapPairAbi as pairAbi } from "@/constants/abi/minimal";
import { getContracts } from "@/constants/addresses";
import { useTokenList } from "@/hooks/useTokenList";
import NextLink from "next/link";

export function PoolsTable() {
  const chainId = useChainId() ?? 31337;
  const factory = getContracts(chainId)?.QuantumSwapFactory as `0x${string}`;
  const { tokens } = useTokenList();

  const lenRead = useReadContract({ address: factory, abi: factoryAbi as Abi, functionName: "allPairsLength" });
  const length = Number((lenRead.data as bigint) ?? 0n);
  const indexCalls = useMemo(() => Array.from({ length }, (_, i) => ({ address: factory, abi: factoryAbi as Abi, functionName: "allPairs" as const, args: [BigInt(i)] })), [factory, length]);
  const pairsRes = useReadContracts({ contracts: indexCalls, query: { enabled: length > 0 } });
  const pairAddresses = (pairsRes.data?.map(r => r.result as `0x${string}`) ?? []) as `0x${string}`[];

  const reads = useReadContracts({
    contracts: pairAddresses.flatMap((p) => ([
      { address: p, abi: pairAbi as Abi, functionName: "token0" as const },
      { address: p, abi: pairAbi as Abi, functionName: "token1" as const },
      { address: p, abi: pairAbi as Abi, functionName: "getReserves" as const },
      { address: p, abi: pairAbi as Abi, functionName: "totalSupply" as const },
    ])),
    query: { enabled: pairAddresses.length > 0 }
  });

  const items = useMemo(() => pairAddresses.map((p, i) => {
    const t0 = reads.data?.[i*4]?.result as `0x${string}` | undefined;
    const t1 = reads.data?.[i*4+1]?.result as `0x${string}` | undefined;
    const reserves = reads.data?.[i*4+2]?.result as [bigint, bigint, number] | undefined;
    const total = reads.data?.[i*4+3]?.result as bigint | undefined;
    const token0 = tokens.find(t => t.address.toLowerCase() === (t0 || "").toLowerCase());
    const token1 = tokens.find(t => t.address.toLowerCase() === (t1 || "").toLowerCase());
    const r0 = token0 && reserves ? Number(reserves[0]) / 10 ** token0.decimals : undefined;
    const r1 = token1 && reserves ? Number(reserves[1]) / 10 ** token1.decimals : undefined;
    const tvl = (r0 ?? 0) + (r1 ?? 0); // placeholder without USD
    return { pair: p, token0, token1, r0, r1, tvl, totalSupply: total };
  }), [pairAddresses, reads.data, tokens]);

  const isLoading = lenRead.isLoading || pairsRes.isLoading || reads.isLoading;

  if (isLoading) return (
    <VStack align="stretch" gap={2}>
      {Array.from({ length: 5 }).map((_, i) => (<Skeleton key={i} h="64px" rounded="xl" />))}
    </VStack>
  );

  return (
    <VStack align="stretch" gap={2}>
      {items.map((it) => (
        <HStack key={it.pair} justify="space-between" bg="rgba(23,35,53,0.6)" border="1px solid" borderColor="rgba(255,255,255,0.08)" rounded="xl" p={3}>
          <HStack>
            <HStack gap={-2}>
              {it.token0?.logoURI ? <Image src={it.token0.logoURI} alt={it.token0.symbol} boxSize="28px" rounded="full" /> : <Box boxSize="28px" rounded="full" bg="whiteAlpha.300" />}
              {it.token1?.logoURI ? <Image src={it.token1.logoURI} alt={it.token1.symbol} boxSize="28px" rounded="full" border="2px solid rgba(0,0,0,0.2)" /> : <Box boxSize="28px" rounded="full" bg="whiteAlpha.300" />}
            </HStack>
            <VStack align="flex-start" gap={0}>
              <Text color="white" fontWeight="bold">{it.token0?.symbol ?? "TKN0"} / {it.token1?.symbol ?? "TKN1"}</Text>
              <Text color="whiteAlpha.600" fontSize="xs">{it.pair.slice(0,6)}…{it.pair.slice(-4)}</Text>
            </VStack>
          </HStack>
          <VStack align="flex-end" gap={0}>
            <Text color="whiteAlpha.800" fontSize="sm">TVL: {((it.tvl)||0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</Text>
            <Text color="whiteAlpha.600" fontSize="xs">Fees/APR: —</Text>
          </VStack>
          <HStack gap={2}>
            <GradientButton href={`/pool/remove/${it.pair}`} size="sm" hoverOnly>Remove</GradientButton>
            <GradientButton href={`/pool`} size="sm" hoverOnly>Add</GradientButton>
          </HStack>
        </HStack>
      ))}
    </VStack>
  );
}
