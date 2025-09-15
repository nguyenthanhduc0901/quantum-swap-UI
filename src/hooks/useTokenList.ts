"use client";

import { useEffect, useMemo, useState } from "react";
import { useChainId } from "wagmi";
import type { TokenInfo } from "@/constants/tokens";
import { getDefaultTokens } from "@/constants/tokens";
import generatedLocalJson from "@/constants/generated/addresses.local.json" assert { type: "json" };

type RawList = {
  name: string;
  tokens: Array<{
    chainId: number;
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    logoURI?: string;
  }>;
};

const UNISWAP_LIST_URL = "https://gateway.pinata.cloud/ipfs/QmaQMXs34s321d4c2g22e1a38122pyc42e423z42m1";

const cachedByChain: Record<number, TokenInfo[] | undefined> = {};
let fetchInFlight = false;
type GenTok = { address: string; symbol: string; name: string; decimals: number; logoURI?: string };
const generatedLocal: Record<number, { tokens: GenTok[] }> | undefined = generatedLocalJson as unknown as Record<number, { tokens: GenTok[] }>;

export function useTokenList() {
  const chainId = useChainId() ?? 31337;
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [list, setList] = useState<TokenInfo[] | undefined>(() => cachedByChain[chainId]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        if (cachedByChain[chainId]) {
          setList(cachedByChain[chainId]);
          return;
        }
        if (fetchInFlight) return; // another hook call will populate cache
        fetchInFlight = true;
        setIsLoading(true);
        const res = await fetch(UNISWAP_LIST_URL, { cache: "no-store" });
        const json = (await res.json()) as RawList;
        const remote: TokenInfo[] = (json.tokens || [])
          .filter((t) => t.chainId === chainId)
          .map((t) => ({
            address: t.address as `0x${string}`,
            symbol: t.symbol,
            name: t.name,
            decimals: t.decimals,
            logoURI: t.logoURI,
          }));
        // Fallback tokens and generated local tokens
        const fallback = getDefaultTokens(chainId);
        const genRaw = (generatedLocal?.[chainId]?.tokens || []) as Array<{ address: string; symbol: string; name: string; decimals: number; logoURI?: string }>;
        const genTokens: TokenInfo[] = genRaw.map((t) => ({ address: t.address as `0x${string}`, symbol: t.symbol, name: t.name, decimals: t.decimals, logoURI: t.logoURI }));
        // Merge with user custom tokens from localStorage
        const customKey = `qs.customTokens.${chainId}`;
        const customRaw = typeof window !== "undefined" ? window.localStorage.getItem(customKey) : null;
        const custom: TokenInfo[] = (customRaw ? JSON.parse(customRaw) : []).map((t: GenTok) => ({ ...t, address: t.address as `0x${string}` }));
        const merged = dedupeByAddress([...custom, ...fallback, ...genTokens, ...remote]);
        cachedByChain[chainId] = merged;
        if (mounted) setList(merged);
      } catch {
        // Network failed: use fallback + custom only
        const fallback = getDefaultTokens(chainId);
        const customKey = `qs.customTokens.${chainId}`;
        const customRaw = typeof window !== "undefined" ? window.localStorage.getItem(customKey) : null;
        const custom: TokenInfo[] = (customRaw ? JSON.parse(customRaw) : []).map((t: GenTok) => ({ ...t, address: t.address as `0x${string}` }));
        const genRaw = (generatedLocal?.[chainId]?.tokens || []) as Array<{ address: string; symbol: string; name: string; decimals: number; logoURI?: string }>;
        const genTokens: TokenInfo[] = genRaw.map((t) => ({ address: t.address as `0x${string}`, symbol: t.symbol, name: t.name, decimals: t.decimals, logoURI: t.logoURI }));
        const merged = dedupeByAddress([...custom, ...fallback, ...genTokens]);
        cachedByChain[chainId] = merged;
        if (mounted) setList(merged);
      } finally {
        fetchInFlight = false;
        setIsLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [chainId]);

  const tokens = useMemo(() => list ?? [], [list]);
  return { tokens, isLoading } as const;
}

export function saveCustomToken(chainId: number, token: TokenInfo) {
  const key = `qs.customTokens.${chainId}`;
  const arr: TokenInfo[] = JSON.parse(window.localStorage.getItem(key) || "[]");
  const merged = dedupeByAddress([token, ...arr]);
  window.localStorage.setItem(key, JSON.stringify(merged));
  // update cache
  cachedByChain[chainId] = dedupeByAddress([token, ...(cachedByChain[chainId] || [])]);
}

function dedupeByAddress(tokens: TokenInfo[]): TokenInfo[] {
  const seen = new Set<string>();
  const out: TokenInfo[] = [];
  for (const t of tokens) {
    const a = t.address.toLowerCase();
    if (seen.has(a)) continue;
    seen.add(a);
    out.push(t);
  }
  return out;
}


