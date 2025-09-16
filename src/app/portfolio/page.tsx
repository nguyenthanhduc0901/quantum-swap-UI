"use client";

import { useMemo, useState } from "react";
import { formatAmountFromBigInt as fmtBI, shortAddress as shortAddr } from "@/lib/format";
import { Container, Heading, VStack, Box, Text, Skeleton, HStack, Input, Grid, GridItem } from "@chakra-ui/react";
import { TokenImage } from "@/components/ui/TokenImage";
import { useAccount, useChainId, useReadContract, useReadContracts } from "wagmi";
import type { Abi } from "viem";
import { useTokenList } from "@/hooks/useTokenList";
import { quantumSwapFactoryAbi as factoryAbi, quantumSwapPairAbi as pairAbi } from "@/constants/abi/minimal";
import { getContracts } from "@/constants/addresses";

const ERC20_BALANCE_OF = [
  { name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
] as const satisfies Abi;

export default function PortfolioPage() {
  const chainId = useChainId() ?? 31337;
  const { address } = useAccount();
  const { tokens, isLoading: loadingList } = useTokenList();
  const [query, setQuery] = useState("");
  const [hideZero, setHideZero] = useState(true);

  // Tokens balances
  const calls = useMemo(() => !address ? [] : tokens.map((t) => ({
    address: t.address as `0x${string}`,
    abi: ERC20_BALANCE_OF as Abi,
    functionName: "balanceOf" as const,
    args: [address!],
  })), [tokens, address]);

  const tokenReads = useReadContracts({ contracts: calls, query: { enabled: !!address && tokens.length > 0, refetchInterval: 15_000 } });

  const tokenItems = useMemo(() => tokens.map((t, i) => ({
    token: t,
    balance: (tokenReads.data?.[i]?.result as bigint) ?? 0n,
  })), [tokens, tokenReads.data]);

  const filteredTokens = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tokenItems.filter(({ token, balance }) => {
      if (hideZero && balance === 0n) return false;
      if (!q) return true;
      return token.symbol.toLowerCase().includes(q) || token.name.toLowerCase().includes(q) || token.address.toLowerCase() === q;
    });
  }, [tokenItems, query, hideZero]);

  // LP positions (basic)
  const factory = getContracts(chainId)?.QuantumSwapFactory as `0x${string}`;
  const lenRead = useReadContract({ address: factory, abi: factoryAbi as Abi, functionName: "allPairsLength", query: { refetchInterval: 60_000 } });
  const length = Number((lenRead.data as bigint) ?? 0n);
  const pairIndexCalls = useMemo(() => Array.from({ length }, (_, i) => ({ address: factory, abi: factoryAbi as Abi, functionName: "allPairs" as const, args: [BigInt(i)] })), [factory, length]);
  const pairsRes = useReadContracts({ contracts: pairIndexCalls, query: { enabled: length > 0, refetchInterval: 60_000 } });
  const pairAddresses = useMemo(() => (pairsRes.data?.map(r => r.result as `0x${string}`) ?? []) as `0x${string}`[], [pairsRes.data]);

  const lpReads = useReadContracts({
    contracts: !address ? [] : pairAddresses.flatMap((p) => ([
      { address: p, abi: pairAbi as Abi, functionName: "balanceOf" as const, args: [address!] },
      { address: p, abi: pairAbi as Abi, functionName: "token0" as const },
      { address: p, abi: pairAbi as Abi, functionName: "token1" as const },
      { address: p, abi: pairAbi as Abi, functionName: "totalSupply" as const },
      { address: p, abi: pairAbi as Abi, functionName: "getReserves" as const },
    ])),
    query: { enabled: !!address && pairAddresses.length > 0, refetchInterval: 15_000 },
  });

  const lpItems = useMemo(() => pairAddresses.map((p, i) => {
    const bal = (lpReads.data?.[i*5]?.result as bigint) ?? 0n;
    if (bal === 0n) return undefined;
    const t0 = lpReads.data?.[i*5+1]?.result as `0x${string}` | undefined;
    const t1 = lpReads.data?.[i*5+2]?.result as `0x${string}` | undefined;
    const total = (lpReads.data?.[i*5+3]?.result as bigint) ?? 0n;
    const reserves = lpReads.data?.[i*5+4]?.result as [bigint, bigint, number] | undefined;
    const token0 = tokens.find((t) => t.address.toLowerCase() === (t0 || "").toLowerCase());
    const token1 = tokens.find((t) => t.address.toLowerCase() === (t1 || "").toLowerCase());
    const share0 = total > 0n && reserves ? (Number(reserves[0]) * Number(bal)) / Number(total) : 0;
    const share1 = total > 0n && reserves ? (Number(reserves[1]) * Number(bal)) / Number(total) : 0;
    return {
      pair: p,
      balance: bal,
      token0,
      token1,
      amount0: token0 ? share0 / 10 ** token0.decimals : 0,
      amount1: token1 ? share1 / 10 ** token1.decimals : 0,
    };
  }).filter(Boolean) as Array<{ pair: `0x${string}`; balance: bigint; token0?: { address: `0x${string}`; symbol: string; decimals: number; logoURI?: string } | undefined; token1?: { address: `0x${string}`; symbol: string; decimals: number; logoURI?: string } | undefined; amount0: number; amount1: number }>, [pairAddresses, lpReads.data, tokens]);

  const isLoading = loadingList || tokenReads.isLoading || lenRead.isLoading || pairsRes.isLoading || lpReads.isLoading;

  // ===== USD PRICING =====
  // Find reference tokens
  const usdc = useMemo(() => tokens.find(t => t.symbol.toUpperCase() === "USDC"), [tokens]);
  const dai  = useMemo(() => tokens.find(t => t.symbol.toUpperCase() === "DAI"), [tokens]);
  const wethAddress = getContracts(chainId)?.WETH as `0x${string}` | undefined;
  const weth = useMemo(() => tokens.find(t => t.address.toLowerCase() === (wethAddress || "").toLowerCase()), [tokens, wethAddress]);

  // Pairs for WETH pricing in USD
  const wethPairReads = useReadContracts({
    contracts: [
      ...(weth && usdc ? [{ address: factory, abi: factoryAbi as Abi, functionName: "getPair" as const, args: [weth.address, usdc.address] }] : []),
      ...(weth && dai  ? [{ address: factory, abi: factoryAbi as Abi, functionName: "getPair" as const, args: [weth.address, dai.address]  }] : []),
    ],
  });
  const wethUsdPair = (wethPairReads.data?.[0]?.result as `0x${string}` | undefined) || (wethPairReads.data?.[1]?.result as `0x${string}` | undefined);
  const wethReservesRead = useReadContract({ address: wethUsdPair, abi: pairAbi as Abi, functionName: "getReserves", query: { enabled: Boolean(wethUsdPair), refetchInterval: 15_000 } });
  // const _wethUsdPrice = useMemo(() => {
  //   if (!weth || !(usdc || dai) || !wethReservesRead.data) return undefined;
  //   const [_r0, _r1] = wethReservesRead.data as unknown as [bigint, bigint, number];
  //   return undefined;
  // }, [wethReservesRead.data, weth, usdc, dai]);

  // For efficiency build pairs for all tokens vs USDC/DAI/WETH
  const pricePairCalls = useMemo(() => {
    const out: Array<{ address: `0x${string}`; abi: Abi; functionName: "getPair"; args: [`0x${string}`, `0x${string}`] }> = [];
    for (const t of tokens) {
      if (usdc) out.push({ address: factory, abi: factoryAbi as Abi, functionName: "getPair", args: [t.address, usdc.address] });
      if (dai)  out.push({ address: factory, abi: factoryAbi as Abi, functionName: "getPair", args: [t.address, dai.address]  });
      if (weth) out.push({ address: factory, abi: factoryAbi as Abi, functionName: "getPair", args: [t.address, weth.address] });
    }
    return out;
  }, [tokens, factory, usdc, dai, weth]);

  const pricePairsRes = useReadContracts({ contracts: pricePairCalls, query: { enabled: tokens.length > 0, refetchInterval: 30_000 } });

  // Build valid pair list and maps
  const validPairs = useMemo(() => {
    const arr = (pricePairsRes.data?.map(r => r.result as `0x${string}` | undefined) ?? [])
      .filter((a) => a && a !== "0x0000000000000000000000000000000000000000") as `0x${string}`[];
    return Array.from(new Set(arr));
  }, [pricePairsRes.data]);

  const t0t1Calls = useMemo(() => validPairs.flatMap((addr) => ([
    { address: addr, abi: pairAbi as Abi, functionName: "token0" as const },
    { address: addr, abi: pairAbi as Abi, functionName: "token1" as const },
  ])), [validPairs]);
  const t0t1Res = useReadContracts({ contracts: t0t1Calls, query: { enabled: validPairs.length > 0, refetchInterval: 60_000 } });

  const reservesCalls = useMemo(() => validPairs.map((addr) => ({ address: addr, abi: pairAbi as Abi, functionName: "getReserves" as const })), [validPairs]);
  const reservesRes = useReadContracts({ contracts: reservesCalls, query: { enabled: validPairs.length > 0, refetchInterval: 15_000 } });

  // Helper to compute USD price for token using available pairs
  const tokenToUsd: Record<string, number | undefined> = useMemo(() => {
    const map: Record<string, number | undefined> = {};
    if (!tokens.length) return map;

    // Precompute indices mapping: for each token we had 0-2 calls (USDC, DAI, WETH) in that order
    const hasUSDC = Boolean(usdc);
    const hasDAI  = Boolean(dai);
    const hasWETH = Boolean(weth);
    const callsPerToken = (hasUSDC ? 1 : 0) + (hasDAI ? 1 : 0) + (hasWETH ? 1 : 0);
    const pairAddrs = pricePairsRes.data?.map(r => r.result as `0x${string}` | undefined) ?? [];

    // Build map pairAddr -> {token0, token1, reserves}
    const pairInfo: Record<string, { token0?: `0x${string}`; token1?: `0x${string}`; reserves?: [bigint, bigint, number] }> = {};
    for (let i = 0; i < validPairs.length; i++) {
      const addr = validPairs[i];
      const t0 = t0t1Res.data?.[i*2]?.result as `0x${string}` | undefined;
      const t1 = t0t1Res.data?.[i*2+1]?.result as `0x${string}` | undefined;
      const res = reservesRes.data?.[i]?.result as [bigint, bigint, number] | undefined;
      pairInfo[addr.toLowerCase()] = { token0: t0, token1: t1, reserves: res };
    }

    function computePriceFromReserves(reserves: [bigint, bigint, number] | undefined, token: { address: string; decimals: number }, stable: { decimals: number }, tokenIsToken0: boolean | undefined) {
      if (!reserves) return undefined;
      const [r0, r1] = reserves;
      if (tokenIsToken0 === undefined) return undefined;
      if (tokenIsToken0) {
        const tokenQty = Number(r0) / 10 ** token.decimals;
        const stableQty = Number(r1) / 10 ** stable.decimals;
        return tokenQty > 0 ? stableQty / tokenQty : undefined;
      } else {
        const tokenQty = Number(r1) / 10 ** token.decimals;
        const stableQty = Number(r0) / 10 ** stable.decimals;
        return tokenQty > 0 ? stableQty / tokenQty : undefined;
      }
    }

    // Compute ETH USD price first if available
    let ethUsd: number | undefined;
    if (weth && (usdc || dai)) {
      const stableMeta = usdc ?? dai!;
      const idx = tokens.findIndex(t => t.address.toLowerCase() === weth.address.toLowerCase());
      const addr = (hasUSDC ? pairAddrs[idx * callsPerToken + 0] : undefined)
        || (hasDAI ? pairAddrs[idx * callsPerToken + (hasUSDC ? 1 : 0)] : undefined);
      if (addr) {
        const info = pairInfo[addr.toLowerCase()];
        const tokenIsToken0 = info?.token0?.toLowerCase() === weth.address.toLowerCase();
        ethUsd = computePriceFromReserves(info?.reserves, weth, { decimals: stableMeta.decimals }, tokenIsToken0);
      }
    }

    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (usdc && t.address.toLowerCase() === usdc.address.toLowerCase()) { map[t.address] = 1; continue; }
      if (dai && t.address.toLowerCase() === dai.address.toLowerCase()) { map[t.address] = 1; continue; }
      if (weth && t.address.toLowerCase() === weth.address.toLowerCase()) { map[t.address] = ethUsd; continue; }

      let pairIdx = i * callsPerToken;
      const addrUSDC = hasUSDC ? pairAddrs[pairIdx++] : undefined;
      const addrDAI  = hasDAI  ? pairAddrs[pairIdx++] : undefined;
      const addrWETH = hasWETH ? pairAddrs[pairIdx++] : undefined;
      // Try USDC then DAI then WETH using exact token0/token1 orientation
      let price: number | undefined;
      if (addrUSDC) {
        const info = pairInfo[addrUSDC.toLowerCase()];
        const tIs0 = info?.token0?.toLowerCase() === t.address.toLowerCase();
        price = computePriceFromReserves(info?.reserves, t, { decimals: usdc?.decimals || 6 }, tIs0);
      }
      if (!price && addrDAI) {
        const info = pairInfo[addrDAI.toLowerCase()];
        const tIs0 = info?.token0?.toLowerCase() === t.address.toLowerCase();
        price = computePriceFromReserves(info?.reserves, t, { decimals: dai?.decimals || 18 }, tIs0);
      }
      if (!price && addrWETH && ethUsd) {
        const info = pairInfo[addrWETH.toLowerCase()];
        const tIs0 = info?.token0?.toLowerCase() === t.address.toLowerCase();
        const pTW = computePriceFromReserves(info?.reserves, t, { decimals: weth?.decimals || 18 }, tIs0);
        if (pTW) price = pTW * ethUsd;
      }
      map[t.address] = price;
    }
    return map;
  }, [tokens, usdc, dai, weth, pricePairsRes.data, reservesRes.data, t0t1Res.data, validPairs]);

  const totalUsd = useMemo(() => {
    let sum = 0;
    for (const { token, balance } of tokenItems) {
      const px = tokenToUsd[token.address];
      if (px) {
        const human = Number(format(balance, token.decimals));
        sum += human * px;
      }
    }
    for (const it of lpItems) {
      const p0 = it.token0 ? tokenToUsd[it.token0.address] : undefined;
      const p1 = it.token1 ? tokenToUsd[it.token1.address] : undefined;
      if (p0) sum += it.amount0 * p0;
      if (p1) sum += it.amount1 * p1;
    }
    return sum;
  }, [tokenItems, lpItems, tokenToUsd]);

  const tokensUsdSum = useMemo(() => tokenItems.reduce((acc, { token, balance }) => {
    const px = tokenToUsd[token.address];
    if (!px) return acc;
    const human = Number(format(balance, token.decimals));
    return acc + human * px;
  }, 0), [tokenItems, tokenToUsd]);
  const lpUsdSum = useMemo(() => lpItems.reduce((acc, it) => {
    const p0 = it.token0 ? tokenToUsd[it.token0.address] : undefined;
    const p1 = it.token1 ? tokenToUsd[it.token1.address] : undefined;
    const sum = (p0 ? it.amount0 * p0 : 0) + (p1 ? it.amount1 * p1 : 0);
    return acc + sum;
  }, 0), [lpItems, tokenToUsd]);

  function Donut({ a, b }: { a: number; b: number }) {
    const total = a + b;
    if (!(total > 0)) return <Box h="120px" />;
    const r = 45, c = 2 * Math.PI * r;
    const aLen = (a / total) * c;
    const bLen = c - aLen;
    return (
      <svg width={120} height={120} viewBox="0 0 120 120">
        <circle cx={60} cy={60} r={r} stroke="rgba(255,255,255,0.15)" strokeWidth={10} fill="none" />
        <circle cx={60} cy={60} r={r} stroke="#00D1B2" strokeWidth={10} fill="none" strokeDasharray={`${aLen} ${c - aLen}`} transform="rotate(-90 60 60)" />
        <circle cx={60} cy={60} r={r} stroke="#0052FF" strokeWidth={10} fill="none" strokeDasharray={`${bLen} ${c - bLen}`} transform={`rotate(${(a/total)*360 - 90} 60 60)`} />
      </svg>
    );
  }

  return (
    <Container maxW="container.xl" py={{ base: 8, md: 12 }}>
      <VStack align="stretch" gap={6}>
        {/* Header summary */}
        <VStack align="stretch" gap={2}>
          <Heading size="lg" color="white">Portfolio</Heading>
          {Number.isFinite(totalUsd) && totalUsd > 0 ? (
            <Text color="whiteAlpha.800">Estimated total value: ${totalUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Text>
          ) : (
            <Text color="whiteAlpha.700">Estimated total value: -</Text>
          )}
          <HStack gap={4} align="center">
            <Donut a={tokensUsdSum} b={lpUsdSum} />
            <VStack align="flex-start" gap={1}>
              <HStack gap={2}><Box boxSize="10px" bg="#00D1B2" rounded="sm" /><Text color="whiteAlpha.800" fontSize="sm">Tokens: ${tokensUsdSum.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Text></HStack>
              <HStack gap={2}><Box boxSize="10px" bg="#0052FF" rounded="sm" /><Text color="whiteAlpha.800" fontSize="sm">LP: ${lpUsdSum.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Text></HStack>
            </VStack>
          </HStack>
          <HStack gap={4}>
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search token..." bg="blackAlpha.400" borderColor="rgba(255,255,255,0.08)" color="white" maxW={{ base: "100%", md: "320px" }} />
            <HStack gap={2}>
              <input type="checkbox" checked={hideZero} onChange={(e) => setHideZero(e.target.checked)} style={{ width: 18, height: 18, accentColor: "#00FFC2" }} />
              <Text color="whiteAlpha.800">Hide zero balances</Text>
            </HStack>
          </HStack>
        </VStack>

        {isLoading ? (
          <Skeleton h="260px" rounded="xl" />
        ) : (
          <>
            {/* Token balances */}
            <VStack align="stretch" gap={3}>
              <Text color="whiteAlpha.900" fontWeight="bold">Tokens</Text>
              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={3}>
                {filteredTokens.map(({ token, balance }) => (
                  <GridItem key={token.address}>
                    <Box bg="rgba(23,35,53,0.6)" backdropFilter="blur(12px)" border="1px solid" borderColor="rgba(255,255,255,0.08)" rounded="xl" p={4}>
                      <HStack justify="space-between" align="center">
                        <HStack gap={3} align="center">
                          <TokenLogo src={token.logoURI} />
                          <VStack align="flex-start" gap={0}>
                            <HStack gap={2}>
                              <Text color="white" fontWeight="bold">{token.symbol}</Text>
                              <Box as="span" px={2} py={0.5} rounded="md" bg="blackAlpha.300" border="1px solid" borderColor="whiteAlpha.200" color="whiteAlpha.800" fontSize="xs">
                                {token.decimals}
                              </Box>
                            </HStack>
                            <Text color="whiteAlpha.700" fontSize="xs">{shortAddr(token.address)}</Text>
                          </VStack>
                        </HStack>
                        <VStack align="flex-end" gap={0}>
                          <Text color="white" fontWeight="semibold">{fmtBI(balance, token.decimals)}</Text>
                          <Text color="whiteAlpha.700" fontSize="xs">{token.name}</Text>
                        </VStack>
                      </HStack>
                    </Box>
                  </GridItem>
                ))}
              </Grid>
            </VStack>

            {/* LP positions */}
            <VStack align="stretch" gap={3}>
              <Text color="whiteAlpha.900" fontWeight="bold" mt={4}>LP Positions</Text>
              {lpItems.length === 0 ? (
                <Text color="whiteAlpha.600">No LP positions found.</Text>
              ) : (
                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={3}>
                  {lpItems.map((it) => (
                    <GridItem key={it.pair}>
                      <Box bg="rgba(23,35,53,0.6)" backdropFilter="blur(12px)" border="1px solid" borderColor="rgba(255,255,255,0.08)" rounded="xl" p={4}>
                        <HStack justify="space-between" align="center">
                          <HStack gap={3} align="center">
                            <HStack gap={-2}>
                              <TokenLogo src={it.token0?.logoURI} />
                              <TokenLogo src={it.token1?.logoURI} />
                            </HStack>
                            <VStack align="flex-start" gap={0}>
                              <Text color="white" fontWeight="bold">{pairName(it)}</Text>
                              <Text color="whiteAlpha.700" fontSize="xs">{short(it.pair)}</Text>
                            </VStack>
                          </HStack>
                          <VStack align="flex-end" gap={0}>
                            <Text color="whiteAlpha.800" fontSize="sm">{fmt(it.amount0)} {it.token0?.symbol} • {fmt(it.amount1)} {it.token1?.symbol}</Text>
                          </VStack>
                        </HStack>
                      </Box>
                    </GridItem>
                  ))}
                </Grid>
              )}
            </VStack>
          </>
        )}
      </VStack>
    </Container>
  );
}

function format(v: bigint, decimals: number) {
  const d = BigInt(10) ** BigInt(decimals);
  const whole = v / d;
  const frac = v % d;
  const fracStr = frac.toString().padStart(decimals, '0').replace(/0+$/, '').slice(0, 6);
  return fracStr ? `${whole.toString()}.${fracStr}` : whole.toString();
}

function fmt(n?: number) {
  if (n == null || Number.isNaN(n)) return "-";
  if (n === 0) return "0";
  return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function short(addr?: string) {
  if (!addr) return "...";
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

function pairName(it: { token0?: { symbol: string } | undefined; token1?: { symbol: string } | undefined }) {
  const a = it.token0?.symbol ?? "TKN0";
  const b = it.token1?.symbol ?? "TKN1";
  return `${a} / ${b}`;
}

function TokenLogo({ src }: { src?: string }) { return <TokenImage src={src} alt="token" />; }


