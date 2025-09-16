"use client";

import { useMemo, useState, Suspense } from "react";
import { Container, Heading, VStack, Grid, GridItem, Text, Box, HStack, Skeleton, Input, Button, Image, Spinner } from "@chakra-ui/react";
import { useChainId, useReadContract, useReadContracts } from "wagmi";
import type { Abi } from "viem";
import { quantumSwapFactoryAbi as factoryAbi, quantumSwapPairAbi as pairAbi } from "@/constants/abi/minimal";
import { getContracts } from "@/constants/addresses";
// import NextLink from "next/link";
import { useTokenList } from "@/hooks/useTokenList";
import { GradientButton } from "@/components/ui/GradientButton";

const ERC20_META = [
  { name: "symbol", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { name: "decimals", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
] as const satisfies Abi;

export default function PairsPage() {
  const chainId = useChainId() ?? 31337;
  const factory = getContracts(chainId)?.QuantumSwapFactory as `0x${string}`;
  const { tokens } = useTokenList();
  const logoOf = useMemo(() => {
    const map = new Map<string, string | undefined>();
    for (const t of tokens) map.set(t.address.toLowerCase(), t.logoURI);
    return map;
  }, [tokens]);
  const [query, setQuery] = useState("");

  const lenRead = useReadContract({ address: factory, abi: factoryAbi as Abi, functionName: "allPairsLength" });
  const length = Number((lenRead.data as bigint) ?? 0n);

  const indexCalls = useMemo(() => Array.from({ length }, (_, i) => ({
    address: factory, abi: factoryAbi as Abi, functionName: "allPairs" as const, args: [BigInt(i)],
  })), [factory, length]);
  const pairsRes = useReadContracts({ contracts: indexCalls, query: { enabled: length > 0 } });
  const pairAddresses = useMemo(() => (pairsRes.data?.map(r => r.result as `0x${string}`) ?? []) as `0x${string}`[], [pairsRes.data]);

  const pairReads = useReadContracts({
    contracts: pairAddresses.flatMap((p) => ([
      { address: p, abi: pairAbi as Abi, functionName: "token0" as const },
      { address: p, abi: pairAbi as Abi, functionName: "token1" as const },
      { address: p, abi: pairAbi as Abi, functionName: "getReserves" as const },
    ])),
    query: { enabled: pairAddresses.length > 0 },
  });

  const tokenMetaReads = useReadContracts({
    contracts: pairAddresses.flatMap((_, i) => {
      const t0 = pairReads.data?.[i*3]?.result as `0x${string}` | undefined;
      const t1 = pairReads.data?.[i*3+1]?.result as `0x${string}` | undefined;
      if (!t0 || !t1) return [] as [];
      return [
        { address: t0, abi: ERC20_META as Abi, functionName: "symbol" as const },
        { address: t0, abi: ERC20_META as Abi, functionName: "decimals" as const },
        { address: t1, abi: ERC20_META as Abi, functionName: "symbol" as const },
        { address: t1, abi: ERC20_META as Abi, functionName: "decimals" as const },
      ];
    }),
    query: { enabled: pairReads.data != null },
  });

  const items = useMemo(() => pairAddresses.map((p, i) => {
    const t0 = pairReads.data?.[i*3]?.result as `0x${string}` | undefined;
    const t1 = pairReads.data?.[i*3+1]?.result as `0x${string}` | undefined;
    const reserves = pairReads.data?.[i*3+2]?.result as [bigint, bigint, number] | undefined;
    const sym0 = tokenMetaReads.data?.[i*4]?.result as string | undefined;
    const dec0 = Number(tokenMetaReads.data?.[i*4+1]?.result as number | undefined) || 18;
    const sym1 = tokenMetaReads.data?.[i*4+2]?.result as string | undefined;
    const dec1 = Number(tokenMetaReads.data?.[i*4+3]?.result as number | undefined) || 18;
    const r0 = reserves ? Number(reserves[0]) / 10 ** dec0 : undefined;
    const r1 = reserves ? Number(reserves[1]) / 10 ** dec1 : undefined;
    const price = r0 && r0 > 0 ? r1! / r0 : undefined;
    return {
      pair: p,
      token0: t0,
      token1: t1,
      symbol0: sym0,
      symbol1: sym1,
      decimals0: dec0,
      decimals1: dec1,
      reserve0: r0,
      reserve1: r1,
      price,
      logo0: t0 ? logoOf.get(t0.toLowerCase()) : undefined,
      logo1: t1 ? logoOf.get(t1.toLowerCase()) : undefined,
    };
  }), [pairAddresses, pairReads.data, tokenMetaReads.data, logoOf]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => (
      it.symbol0?.toLowerCase().includes(q) ||
      it.symbol1?.toLowerCase().includes(q) ||
      it.pair.toLowerCase() === q
    ));
  }, [items, query]);

  const isLoading = lenRead.isLoading || pairsRes.isLoading || pairReads.isLoading || tokenMetaReads.isLoading;

  return (
    <Suspense fallback={
      <Container maxW="container.xl" py={{ base: 8, md: 12 }}>
        <HStack gap={3} bg="rgba(23,35,53,0.6)" border="1px solid" borderColor="rgba(255,255,255,0.08)" rounded="xl" p={4} backdropFilter="blur(10px)">
          <Spinner color="#00D1B2" />
          <Text color="whiteAlpha.900" fontWeight="semibold">Loading…</Text>
        </HStack>
      </Container>
    }>
      <Container maxW="container.xl" py={{ base: 8, md: 12 }}>
        <VStack align="stretch" gap={6}>
          <Heading size="lg" color="white">Pairs</Heading>
          <HStack gap={3}>
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search symbol or pair address" bg="blackAlpha.400" borderColor="rgba(255,255,255,0.08)" color="white" />
            <Button onClick={() => setQuery("")}>Clear</Button>
          </HStack>
          <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={4}>
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <GridItem key={i}>
                <Skeleton h="120px" rounded="xl" />
              </GridItem>
            ))
          ) : (
            filtered.map((it) => (
              <GridItem key={it.pair}>
                <Box bg="rgba(23,35,53,0.6)" backdropFilter="blur(12px)" border="1px solid" borderColor="rgba(255,255,255,0.08)" rounded="xl" p={4}>
                  <HStack justify="space-between" align="center">
                    <HStack gap={2} align="center">
                      <TokenLogo src={it.logo0} />
                      <TokenLogo src={it.logo1} />
                      <VStack align="flex-start" gap={0}>
                        <Text color="white" fontWeight="bold" fontSize="md">{pairName(it)}</Text>
                        <Text color="whiteAlpha.600" fontSize="xs">{short(it.pair)}</Text>
                      </VStack>
                    </HStack>
                    <VStack align="flex-end" gap={0}>
                      <Text color="whiteAlpha.800" fontSize="sm">Reserves</Text>
                      <Text color="white" fontWeight="semibold" fontSize="sm">{fmt(it.reserve0)} {it.symbol0} • {fmt(it.reserve1)} {it.symbol1}</Text>
                      <Text color="whiteAlpha.700" fontSize="xs">Price: 1 {it.symbol0} ≈ {fmt(it.price)} {it.symbol1}</Text>
                    </VStack>
                  </HStack>
                  <HStack justify="flex-end" mt={3} gap={2}>
                    <GradientButton href={`/pair/${it.pair}`} size="sm" hoverOnly>View</GradientButton>
                    <GradientButton href={`/pool/remove/${it.pair}`} size="sm" hoverOnly>Manage</GradientButton>
                  </HStack>
                </Box>
              </GridItem>
            ))
          )}
        </Grid>
      </VStack>
    </Container>
    </Suspense>
  );
}

function short(addr?: string) {
  if (!addr) return "...";
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

function fmt(n?: number) {
  if (n == null || Number.isNaN(n)) return "-";
  if (n === 0) return "0";
  return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function pairName(it: { symbol0?: string; token0?: string; symbol1?: string; token1?: string }) {
  const a = it.symbol0 ?? short(it.token0);
  const b = it.symbol1 ?? short(it.token1);
  return `${a} / ${b}`;
}

function TokenLogo({ src }: { src?: string }) {
  if (!src) return <Box boxSize="22px" rounded="full" bg="whiteAlpha.300" />;
  return <Image src={src} alt="token" boxSize="22px" rounded="full" />;
}


