"use client";

import { useMemo } from "react";
import { useChainId, useReadContract } from "wagmi";
import type { Abi } from "viem";
import { quantumSwapFactoryAbi as factoryAbi, quantumSwapRouterAbi as routerAbi, quantumSwapPairAbi as pairAbi } from "@/constants/abi/minimal";
import { getContracts, type QuantumSwapAddresses } from "@/constants/addresses";
import type { TokenInfo } from "@/constants/tokens";

type Inputs = {
  tokenA: TokenInfo | null;
  tokenB: TokenInfo | null;
  amountA: string;
  amountB: string;
};

type Output = {
  pairAddress?: `0x${string}`;
  pairExists: boolean;
  reserves: { reserveA: bigint; reserveB: bigint } | null;
  pairMissing: boolean;
  totalSupply?: bigint;
  estimatedAmountA?: string;
  estimatedAmountB?: string;
  priceAB?: number; // tokenB per tokenA
  priceBA?: number; // tokenA per tokenB
  shareOfPool?: number; // percentage [0-100]
};

export function useLiquidityCalculations({ tokenA, tokenB, amountA, amountB }: Inputs): Output {
  const chainId = useChainId() ?? 31337;
  const contracts = getContracts(chainId) as QuantumSwapAddresses | undefined;
  const factory = (contracts?.QuantumSwapFactory ?? "0x0000000000000000000000000000000000000000") as `0x${string}`;
  const router = (contracts?.QuantumSwapRouter ?? "0x0000000000000000000000000000000000000000") as `0x${string}`;

  const addressesReady = Boolean(factory && tokenA?.address && tokenB?.address);

  // 1) Get pair address
  const pairRead = useReadContract({
    address: factory,
    abi: factoryAbi as Abi,
    functionName: "getPair",
    args: addressesReady ? [tokenA!.address, tokenB!.address] : undefined,
    query: { enabled: addressesReady },
  });

  const pairAddress = (pairRead.data as `0x${string}` | undefined) ?? undefined;
  const pairExists = Boolean(pairAddress && pairAddress !== "0x0000000000000000000000000000000000000000");
  const pairMissing = Boolean(tokenA && tokenB && !pairExists);

  // 2) Get reserves if pair exists
  const reservesRead = useReadContract({
    address: pairExists ? pairAddress : undefined,
    abi: pairAbi as Abi,
    functionName: "getReserves",
    args: pairExists ? [] : undefined,
    query: { enabled: pairExists },
  });

  const totalSupplyRead = useReadContract({
    address: pairExists ? pairAddress : undefined,
    abi: pairAbi as Abi,
    functionName: "totalSupply",
    args: pairExists ? [] : undefined,
    query: { enabled: pairExists },
  });

  const tokenOrder = useMemo(() => {
    if (!tokenA || !tokenB) return null;
    return tokenA.address.toLowerCase() < tokenB.address.toLowerCase() ? "A-first" : "B-first";
  }, [tokenA, tokenB]);

  const reserves = useMemo(() => {
    if (!pairExists || !reservesRead.data || !tokenOrder || !tokenA || !tokenB) return null;
    const [r0, r1] = reservesRead.data as unknown as [bigint, bigint, number];
    const reserve0 = r0;
    const reserve1 = r1;
    const [reserveA, reserveB] = tokenOrder === "A-first" ? [reserve0, reserve1] : [reserve1, reserve0];
    return { reserveA, reserveB };
  }, [pairExists, reservesRead.data, tokenOrder, tokenA, tokenB]);

  // 3) Price ratio using reserves (normalized by decimals)
  const priceAB = useMemo(() => {
    if (!reserves || reserves.reserveA === 0n || !tokenA || !tokenB) return undefined;
    const a = Number(reserves.reserveA) / 10 ** (tokenA.decimals || 18);
    const b = Number(reserves.reserveB) / 10 ** (tokenB.decimals || 18);
    if (a === 0) return undefined;
    return b / a;
  }, [reserves, tokenA, tokenB]);
  const priceBA = useMemo(() => (priceAB ? 1 / priceAB : undefined), [priceAB]);

  // 4) Estimated amounts using router.quote when reserves > 0
  const quoteAtoB = useReadContract({
    address: router,
    abi: routerAbi as Abi,
    functionName: "quote",
    args:
      tokenA && tokenB && reserves && Number(amountA) > 0
        ? [
            BigInt(Math.floor(Number(amountA) * 10 ** (tokenA.decimals || 18))),
            reserves.reserveA,
            reserves.reserveB,
          ]
        : undefined,
    query: { enabled: Boolean(tokenA && tokenB && reserves && Number(amountA) > 0) },
  });

  const quoteBtoA = useReadContract({
    address: router,
    abi: routerAbi as Abi,
    functionName: "quote",
    args:
      tokenA && tokenB && reserves && Number(amountB) > 0
        ? [
            BigInt(Math.floor(Number(amountB) * 10 ** (tokenB.decimals || 18))),
            reserves.reserveB,
            reserves.reserveA,
          ]
        : undefined,
    query: { enabled: Boolean(tokenA && tokenB && reserves && Number(amountB) > 0) },
  });

  const estimatedAmountB = useMemo(() => {
    if (!tokenA || !tokenB) return undefined;
    if (reserves && quoteAtoB.data) {
      const q = quoteAtoB.data as unknown as bigint;
      return (Number(q) / 10 ** (tokenB.decimals || 18)).toString();
    }
    // If no reserves, suggest proportional using priceAB if available (or echo)
    if (!reserves && Number(amountA) > 0 && priceAB) {
      return (Number(amountA) * priceAB).toString();
    }
    return undefined;
  }, [tokenA, tokenB, reserves, quoteAtoB.data, amountA, priceAB]);

  const estimatedAmountA = useMemo(() => {
    if (!tokenA || !tokenB) return undefined;
    if (reserves && quoteBtoA.data) {
      const q = quoteBtoA.data as unknown as bigint;
      return (Number(q) / 10 ** (tokenA.decimals || 18)).toString();
    }
    if (!reserves && Number(amountB) > 0 && priceBA) {
      return (Number(amountB) * priceBA).toString();
    }
    return undefined;
  }, [tokenA, tokenB, reserves, quoteBtoA.data, amountB, priceBA]);

  // 5) Share of pool: newLiquidity / (totalLiquidity + newLiquidity)
  // Use normalized floats to avoid overflow
  const shareOfPool = useMemo(() => {
    if (!reserves || !tokenA || !tokenB) return undefined;
    const a = Number(amountA || "0");
    const b = Number(amountB || "0");
    if (!a || !b) return undefined;
    const aNorm = a; // already human input
    const bNorm = b;
    const resANorm = Number(reserves.reserveA) / 10 ** (tokenA.decimals || 18);
    const resBNorm = Number(reserves.reserveB) / 10 ** (tokenB.decimals || 18);
    const totalL = Math.sqrt(Math.max(resANorm, 0) * Math.max(resBNorm, 0));
    const newL = Math.sqrt(aNorm * bNorm);
    if (totalL === 0) return 100;
    return (newL / (totalL + newL)) * 100;
  }, [reserves, tokenA, tokenB, amountA, amountB]);

  return {
    pairAddress: pairExists ? (pairAddress as `0x${string}`) : undefined,
    pairExists,
    pairMissing,
    reserves,
    totalSupply: (totalSupplyRead.data as bigint | undefined),
    estimatedAmountA,
    estimatedAmountB,
    priceAB,
    priceBA,
    shareOfPool,
  };
}


