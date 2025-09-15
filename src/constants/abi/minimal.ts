import type { Abi } from "viem";

// Minimal ABIs to avoid bundling Hardhat artifacts (which include large bytecode strings)

export const quantumSwapFactoryAbi = [
  { name: "allPairsLength", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "allPairs", type: "function", stateMutability: "view", inputs: [{ type: "uint256" }], outputs: [{ type: "address" }] },
  { name: "getPair", type: "function", stateMutability: "view", inputs: [{ type: "address" }, { type: "address" }], outputs: [{ type: "address" }] },
] as const satisfies Abi;

export const quantumSwapPairAbi = [
  { name: "allowance", type: "function", stateMutability: "view", inputs: [{ type: "address" }, { type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "approve", type: "function", stateMutability: "nonpayable", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [{ type: "bool" }] },
  { name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "totalSupply", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "getReserves", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint112" }, { type: "uint112" }, { type: "uint32" }] },
  { name: "token0", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { name: "token1", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  // Minimal event for log decoding
  {
    type: "event",
    name: "Swap",
    inputs: [
      { indexed: true, type: "address", name: "sender" },
      { indexed: false, type: "uint256", name: "amount0In" },
      { indexed: false, type: "uint256", name: "amount1In" },
      { indexed: false, type: "uint256", name: "amount0Out" },
      { indexed: false, type: "uint256", name: "amount1Out" },
      { indexed: true, type: "address", name: "to" },
    ],
  },
] as const satisfies Abi;

export const quantumSwapRouterAbi = [
  // Views/quotes
  { name: "quote", type: "function", stateMutability: "pure", inputs: [{ type: "uint256" }, { type: "uint256" }, { type: "uint256" }], outputs: [{ type: "uint256" }] },
  { name: "getAmountsOut", type: "function", stateMutability: "view", inputs: [{ type: "uint256" }, { type: "address[]" }], outputs: [{ type: "uint256[]" }] },
  { name: "getAmountsIn", type: "function", stateMutability: "view", inputs: [{ type: "uint256" }, { type: "address[]" }], outputs: [{ type: "uint256[]" }] },
  // Writes
  {
    name: "swapExactTokensForTokens",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { type: "uint256" },
      { type: "uint256" },
      { type: "address[]" },
      { type: "address" },
      { type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "addLiquidity",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { type: "address" },
      { type: "address" },
      { type: "uint256" },
      { type: "uint256" },
      { type: "uint256" },
      { type: "uint256" },
      { type: "address" },
      { type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "removeLiquidity",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { type: "address" },
      { type: "address" },
      { type: "uint256" },
      { type: "uint256" },
      { type: "uint256" },
      { type: "address" },
      { type: "uint256" },
    ],
    outputs: [],
  },
] as const satisfies Abi;


