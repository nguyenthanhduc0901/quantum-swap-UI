"use client";

import { useParams } from "next/navigation";
import { Container, Heading, VStack, Box, Text, HStack, Button, Image, IconButton } from "@chakra-ui/react";
import { useChainId, usePublicClient, useReadContract, useReadContracts, useWatchContractEvent } from "wagmi";
import type { Abi, Log } from "viem";
import { decodeEventLog, parseAbiItem } from "viem";
import { useEffect, useMemo, useState, useCallback } from "react";
import { quantumSwapPairAbi as pairAbi } from "@/constants/abi/minimal";
import NextLink from "next/link";
import { FiCopy } from "react-icons/fi";
import { useTokenList } from "@/hooks/useTokenList";
import { GradientButton } from "@/components/ui/GradientButton";

export default function PairDetailPage() {
  const params = useParams<{ address: `0x${string}` }>();
  const pair = params?.address as `0x${string}` | undefined;
  const _chainId = useChainId() ?? 31337;
  const publicClient = usePublicClient();

  const reserves = useReadContract({ address: pair, abi: pairAbi as Abi, functionName: "getReserves", query: { enabled: Boolean(pair) } });
  const token0 = useReadContract({ address: pair, abi: pairAbi as Abi, functionName: "token0", query: { enabled: Boolean(pair) } });
  const token1 = useReadContract({ address: pair, abi: pairAbi as Abi, functionName: "token1", query: { enabled: Boolean(pair) } });
  const { tokens } = useTokenList();

  // Token metadata
  const ERC20_META = [
    { name: "symbol", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
    { name: "decimals", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  ] as const satisfies Abi;
  const metaReads = useReadContracts({
    contracts: token0.data && token1.data ? [
      { address: token0.data as `0x${string}`, abi: ERC20_META as Abi, functionName: "symbol" as const },
      { address: token0.data as `0x${string}`, abi: ERC20_META as Abi, functionName: "decimals" as const },
      { address: token1.data as `0x${string}`, abi: ERC20_META as Abi, functionName: "symbol" as const },
      { address: token1.data as `0x${string}`, abi: ERC20_META as Abi, functionName: "decimals" as const },
    ] : [],
    query: { enabled: Boolean(token0.data && token1.data) }
  });
  const sym0 = (metaReads.data?.[0]?.result as string) ?? "TKN0";
  const dec0 = Number((metaReads.data?.[1]?.result as number) ?? 18);
  const sym1 = (metaReads.data?.[2]?.result as string) ?? "TKN1";
  const dec1 = Number((metaReads.data?.[3]?.result as number) ?? 18);
  const logo0 = useMemo(() => tokens.find(t => t.address.toLowerCase() === String(token0.data || "").toLowerCase())?.logoURI, [tokens, token0.data]);
  const logo1 = useMemo(() => tokens.find(t => t.address.toLowerCase() === String(token1.data || "").toLowerCase())?.logoURI, [tokens, token1.data]);

  // Realtime updates for reserves via Swap event
  useWatchContractEvent({
    address: pair,
    abi: pairAbi as Abi,
    eventName: "Swap",
    onLogs: () => { reserves.refetch?.(); },
    enabled: Boolean(pair),
  });

  // Recent swap logs
  const [logs, setLogs] = useState<Log[]>([]);

  // Decode swap event safely
  const decodeSwap = useCallback((l: Log) => {
    try {
      const ev = decodeEventLog({ abi: pairAbi as Abi, data: l.data!, topics: l.topics as unknown as [`0x${string}`, ...`0x${string}`[]] });
      if (ev.eventName !== "Swap") return undefined;
      const args = ev.args as unknown as { amount0In: bigint; amount1In: bigint; amount0Out: bigint; amount1Out: bigint };
      const a0In = Number(args.amount0In);
      const a1In = Number(args.amount1In);
      const a0Out = Number(args.amount0Out);
      const a1Out = Number(args.amount1Out);
      let dir = "";
      let price: number | undefined = undefined; // token0 in token1
      if (a1Out > 0 && a0In > 0) { // 0 -> 1
        dir = `${sym0}→${sym1}`;
        price = (a1Out / 10 ** dec1) / (a0In / 10 ** dec0);
      } else if (a0Out > 0 && a1In > 0) { // 1 -> 0
        dir = `${sym1}→${sym0}`;
        const p10 = (a0Out / 10 ** dec0) / (a1In / 10 ** dec1);
        price = p10 > 0 ? 1 / p10 : undefined;
      }
      const out = a0Out > 0 ? a0Out / 10 ** dec0 : a1Out / 10 ** dec1;
      return { block: l.blockNumber?.toString(), tx: l.transactionHash, dir, out, price };
    } catch { return undefined; }
  }, [dec0, dec1, sym0, sym1]);

  const swapEvent = parseAbiItem('event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)');

  // Recent swap logs – initial fetch
  useEffect(() => {
    if (!pair || !publicClient) return;
    let stale = false;
    (async () => {
      try {
        const latest = await publicClient.getBlockNumber();
        const fromBlock = latest > 5000n ? latest - 5000n : 0n;
        const fetched = await publicClient.getLogs({ address: pair, fromBlock, toBlock: latest, event: swapEvent });
        if (!stale) setLogs(fetched.slice(-20).reverse());
      } catch {}
    })();
    return () => { stale = true; };
  }, [pair, publicClient, swapEvent]);

  useWatchContractEvent({
    address: pair,
    abi: pairAbi as Abi,
    eventName: "Swap",
    onLogs: async () => {
      try {
        if (!publicClient || !pair) return;
        const latest = await publicClient.getBlockNumber();
        const fromBlock = latest > 1000n ? latest - 1000n : 0n;
        const fetched = await publicClient.getLogs({ address: pair, fromBlock, toBlock: latest, event: swapEvent });
        setLogs(fetched.slice(-20).reverse());
      } catch {}
    },
    enabled: Boolean(pair),
  });

  const [r0, r1] = (reserves.data as unknown as [bigint, bigint, number]) ?? [0n, 0n, 0];
  const res0 = Number(r0) / 10 ** dec0;
  const res1 = Number(r1) / 10 ** dec1;
  const price0 = res0 > 0 ? res1 / res0 : undefined;
  const price1 = res1 > 0 ? res0 / res1 : undefined;

  function copy(text?: string) { if (!text) return; try { void navigator.clipboard.writeText(text); } catch {} }

  const priceSeries = useMemo(() => {
    const pts: number[] = [];
    for (const l of logs) {
      const d = decodeSwap(l);
      if (d?.price && isFinite(d.price)) pts.push(d.price);
    }
    return pts.slice(-40);
  }, [logs, decodeSwap]);

  function Sparkline({ data }: { data: number[] }) {
    if (!data || data.length < 2) return <Box h="40px" />;
    const w = 160, h = 40, p = 2;
    const min = Math.min(...data), max = Math.max(...data);
    const norm = (v: number) => max === min ? 0.5 : (v - min) / (max - min);
    const pts = data.map((v, i) => {
      const x = p + (i * (w - 2 * p)) / (data.length - 1);
      const y = h - p - norm(v) * (h - 2 * p);
      return `${x},${y}`;
    }).join(" ");
    return (
      <svg width={w} height={h} style={{ display: 'block' }}>
        <polyline points={pts} fill="none" stroke="#00D1B2" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <Container maxW="container.lg" py={{ base: 8, md: 12 }}>
      <VStack align="stretch" gap={6}>
        <Heading size="lg" color="white">Pair Detail</Heading>
        <Box bg="rgba(23,35,53,0.6)" border="1px solid" borderColor="rgba(255,255,255,0.08)" rounded="xl" p={5}>
          <VStack align="stretch" gap={2}>
            <HStack justify="space-between" align="center">
              <Text color="whiteAlpha.800">Address: {pair}</Text>
              <IconButton aria-label="Copy pair" size="sm" variant="ghost" color="whiteAlpha.700" _hover={{ bg: 'whiteAlpha.200' }} onClick={() => copy(pair)}>
                <FiCopy />
              </IconButton>
            </HStack>
            <HStack justify="space-between">
              <Box>
                <Text color="whiteAlpha.700" fontSize="sm">Token0</Text>
                <HStack>
                  <Image src={logo0} alt={sym0} boxSize="20px" rounded="full" />
                  <NextLink href={`/token/${token0.data as string}`}><Button as="span" size="xs" variant="ghost" color="white" _hover={{ bg: 'whiteAlpha.200' }}>{sym0}</Button></NextLink>
                  <IconButton aria-label="Copy token0" size="xs" variant="ghost" color="whiteAlpha.700" _hover={{ bg: 'whiteAlpha.200' }} onClick={() => copy(token0.data as string)}>
                    <FiCopy />
                  </IconButton>
                </HStack>
              </Box>
              <Box>
                <Text color="whiteAlpha.700" fontSize="sm">Token1</Text>
                <HStack>
                  <Image src={logo1} alt={sym1} boxSize="20px" rounded="full" />
                  <NextLink href={`/token/${token1.data as string}`}><Button as="span" size="xs" variant="ghost" color="white" _hover={{ bg: 'whiteAlpha.200' }}>{sym1}</Button></NextLink>
                  <IconButton aria-label="Copy token1" size="xs" variant="ghost" color="whiteAlpha.700" _hover={{ bg: 'whiteAlpha.200' }} onClick={() => copy(token1.data as string)}>
                    <FiCopy />
                  </IconButton>
                </HStack>
              </Box>
            </HStack>
            <HStack justify="space-between">
              <Box>
                <Text color="whiteAlpha.700" fontSize="sm">Reserve0</Text>
                <Text color="white" fontWeight="bold">{res0.toLocaleString(undefined, { maximumFractionDigits: 6 })} {sym0}</Text>
              </Box>
              <Box>
                <Text color="whiteAlpha.700" fontSize="sm">Reserve1</Text>
                <Text color="white" fontWeight="bold">{res1.toLocaleString(undefined, { maximumFractionDigits: 6 })} {sym1}</Text>
              </Box>
            </HStack>
            <HStack justify="space-between">
              <Text color="whiteAlpha.800">Price: 1 {sym0} ≈ {price0 ? price0.toLocaleString(undefined, { maximumFractionDigits: 6 }) : "-"} {sym1}</Text>
              <Text color="whiteAlpha.800">1 {sym1} ≈ {price1 ? price1.toLocaleString(undefined, { maximumFractionDigits: 6 }) : "-"} {sym0}</Text>
            </HStack>
            <HStack gap={2} pt={2}>
              <GradientButton href="/swap" size="sm" hoverOnly>Swap</GradientButton>
              <GradientButton href="/pool" size="sm" hoverOnly>Add Liquidity</GradientButton>
              <GradientButton href={`/pool/remove/${pair}`} size="sm" hoverOnly>Remove</GradientButton>
            </HStack>
            <Box pt={2}>
              <Sparkline data={priceSeries} />
            </Box>
          </VStack>
        </Box>

        <Box bg="rgba(23,35,53,0.6)" border="1px solid" borderColor="rgba(255,255,255,0.08)" rounded="xl" p={5}>
          <Heading size="sm" color="white" mb={3}>Recent Swaps</Heading>
          {logs.length === 0 ? (
            <Text color="whiteAlpha.600">No recent swaps.</Text>
          ) : (
            <VStack align="stretch" gap={2}>
              {logs.map((l, i) => {
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
        </Box>
      </VStack>
    </Container>
  );
}


