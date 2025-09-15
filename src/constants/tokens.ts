import generatedJson from "./generated/addresses.local.json" assert { type: "json" };

export type TokenInfo = {
  address: `0x${string}`;
  symbol: string;
  name: string;
  logoURI?: string;
  decimals: number;
};

type GeneratedToken = { address: string; symbol: string; name: string; decimals: number; logoURI?: string };
type GeneratedRegistry = Record<number, { tokens: GeneratedToken[] }>;
const GENERATED_TOKENS = generatedJson as unknown as GeneratedRegistry;

export function getDefaultTokens(chainId: number): TokenInfo[] {
  const reg = GENERATED_TOKENS?.[chainId]?.tokens as Array<{
    address: string; symbol: string; name: string; decimals: number; logoURI?: string;
  }> | undefined;
  if (!reg || reg.length === 0) return [];
  const list: TokenInfo[] = reg.map((t) => ({
    address: t.address as `0x${string}`,
    symbol: t.symbol,
    name: t.name,
    decimals: t.decimals,
    logoURI: t.logoURI,
  }));
  // Prefer DAI first, USDC second if available
  const bySymbol = new Map(list.map((t) => [t.symbol.toUpperCase(), t] as const));
  const a = bySymbol.get("DAI") || list[0];
  const b = bySymbol.get("USDC") || list.find((x) => x.address !== a.address) || list[1] || a;
  const rest = list.filter((x) => x.address !== a.address && x.address !== b.address);
  return [a, b, ...rest];
}


