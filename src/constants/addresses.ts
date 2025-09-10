export const CONTRACTS_BY_CHAIN = {
  31337: {
    QuantumSwapFactory: "0xYourFactoryAddress",
    QuantumSwapRouter: "0xYourRouterAddress",
    WETH: "0xYourWethAddress",
  },
  11155111: {
    QuantumSwapFactory: "0x0000000000000000000000000000000000000000",
    QuantumSwapRouter: "0x0000000000000000000000000000000000000000",
    WETH: "0x0000000000000000000000000000000000000000",
  },
  1: {
    QuantumSwapFactory: "0x0000000000000000000000000000000000000000",
    QuantumSwapRouter: "0x0000000000000000000000000000000000000000",
    WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  },
} as const;

export type QuantumSwapAddresses = (typeof CONTRACTS_BY_CHAIN)[keyof typeof CONTRACTS_BY_CHAIN];

export function getContracts(chainId: number) {
  return CONTRACTS_BY_CHAIN[chainId as keyof typeof CONTRACTS_BY_CHAIN];
}
