import { getContracts } from "./addresses";

export type TokenInfo = {
  address: `0x${string}`;
  symbol: string;
  name: string;
  logoURI?: string;
  decimals: number;
};

export function getDefaultTokens(chainId: number): TokenInfo[] {
  const contracts = getContracts(chainId);
  const WETH = (contracts?.WETH ?? "0x0000000000000000000000000000000000000000") as `0x${string}`;
  // Placeholder addresses for demo; replace with real deployments per network
  const USDC = "0x0000000000000000000000000000000000000001" as `0x${string}`;
  const DAI = "0x0000000000000000000000000000000000000002" as `0x${string}`;

  return [
    {
      address: WETH,
      symbol: "WETH",
      name: "Wrapped Ether",
      logoURI: "/tokens/weth.png",
      decimals: 18,
    },
    {
      address: USDC,
      symbol: "USDC",
      name: "USD Coin",
      logoURI: "/tokens/usdc.png",
      decimals: 6,
    },
    {
      address: DAI,
      symbol: "DAI",
      name: "Dai Stablecoin",
      logoURI: "/tokens/dai.png",
      decimals: 18,
    },
  ];
}


