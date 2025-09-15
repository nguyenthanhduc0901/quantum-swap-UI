"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box, Flex, Heading, Text, HStack, Button, Spinner, Skeleton,
  VStack,
} from "@chakra-ui/react";
import { Global, css } from "@emotion/react";
import { GradientButton } from "./ui/GradientButton";
import type { Abi } from "viem";
import { formatUnits } from "viem";
import { useAccount, useChainId, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useTransactionStatus } from "../hooks/useTransactionStatus";
import { quantumSwapPairAbi as pairAbi, quantumSwapRouterAbi as routerAbi } from "../constants/abi/minimal";
import { getContracts, type QuantumSwapAddresses } from "../constants/addresses";
import { useSettings } from "@/contexts/SettingsContext";

// Component con để hiển thị thông tin
function InfoRow({ label, value }: { label: string, value: React.ReactNode }) {
  return (
    <Flex justify="space-between" align="center">
      <Text fontSize="sm" color="whiteAlpha.600">{label}</Text>
      <Box fontSize="sm" fontWeight="medium" color="whiteAlpha.800">{value}</Box>
    </Flex>
  );
}

// Component con để hiển thị số lượng token nhận được
function TokenAmountDisplay({ symbol, amount, isLoading }: { symbol: string, amount: string, isLoading: boolean }) {
  return (
    <Flex justify="space-between" align="center" w="full">
      {isLoading ? (
        <Skeleton rounded="md"><Box h="24px" w="80px" /></Skeleton>
      ) : (
        <Text fontSize="lg" fontWeight="medium" color="whiteAlpha.800">{amount}</Text>
      )}
      {isLoading ? (
        <Skeleton rounded="md"><Box h="24px" w="80px" /></Skeleton>
      ) : (
        <Text fontSize="lg" fontWeight="bold" color="white">{symbol}</Text>
      )}
    </Flex>
  );
}

type Props = { pairAddress: `0x${string}`; onClose?: () => void };

export function RemoveLiquidityComponent({ pairAddress, onClose }: Props) {
  // --- TOÀN BỘ LOGIC HOOKS VÀ STATE (Không thay đổi) ---
  const chainId = useChainId() ?? 31337;
  const { address: user } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const contracts = getContracts(chainId);
  const router = contracts?.QuantumSwapRouter as `0x${string}`;
  const [percentageToRemove, setPercentageToRemove] = useState<number>(25);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const receipt = useWaitForTransactionReceipt({ hash: txHash });
  useTransactionStatus({ isPending: receipt.isLoading, isSuccess: receipt.isSuccess, isError: receipt.isError, error: receipt.error, hash: txHash });
  const { slippageTolerance, deadlineMinutes } = useSettings();
  
  // Read pair data using batched reads (pair does not implement multicall)
  const pairReads = useReadContracts({
    contracts: !user ? [] : [
      { address: pairAddress, abi: pairAbi as Abi, functionName: 'balanceOf', args: [user] },
      { address: pairAddress, abi: pairAbi as Abi, functionName: 'allowance', args: [user, router] },
      { address: pairAddress, abi: pairAbi as Abi, functionName: 'totalSupply' },
      { address: pairAddress, abi: pairAbi as Abi, functionName: 'getReserves' },
      { address: pairAddress, abi: pairAbi as Abi, functionName: 'token0' },
      { address: pairAddress, abi: pairAbi as Abi, functionName: 'token1' },
    ],
    query: { enabled: !!user, refetchInterval: 4000 },
  });

  const [lpTokenBalance, allowance, totalSupply, reserves, token0, token1] = useMemo(() => {
    const results = pairReads.data?.map((r) => r.result) ?? [];
    const bal = (results[0] as bigint) ?? 0n;
    const allow = (results[1] as bigint) ?? 0n;
    const ts = (results[2] as bigint) ?? 0n;
    const res = (results[3] as [bigint, bigint, number]) ?? [0n, 0n, 0];
    const t0 = results[4] as `0x${string}` | undefined;
    const t1 = results[5] as `0x${string}` | undefined;
    return [bal, allow, ts, res, t0, t1] as const;
  }, [pairReads.data]);

  // Minimal ERC20 ABI for symbol/decimals
  const ERC20_META = [
    { name: 'symbol', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
    { name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
  ] as const;

  const tokenMetaReads = useReadContracts({
    contracts: token0 && token1 ? [
      { address: token0, abi: ERC20_META as unknown as Abi, functionName: 'symbol' },
      { address: token0, abi: ERC20_META as unknown as Abi, functionName: 'decimals' },
      { address: token1, abi: ERC20_META as unknown as Abi, functionName: 'symbol' },
      { address: token1, abi: ERC20_META as unknown as Abi, functionName: 'decimals' },
    ] : [],
    query: { enabled: !!token0 && !!token1 },
  });

  const [symbol0, decimals0, symbol1, decimals1] = useMemo(() => {
    const r = tokenMetaReads.data?.map((x) => x.result) ?? [];
    return [
      (r[0] as string) ?? 'TKN0',
      Number((r[1] as number) ?? 18),
      (r[2] as string) ?? 'TKN1',
      Number((r[3] as number) ?? 18),
    ] as const;
  }, [tokenMetaReads.data]);
  
  const [reserve0, reserve1] = ((reserves as unknown as [bigint, bigint, number])?.slice?.(0, 2) as [bigint, bigint]) ?? [0n, 0n];

  const amountLpToBurn = (lpTokenBalance * BigInt(percentageToRemove)) / 100n;
  const amount0ToReceive = totalSupply > 0n ? (reserve0 * amountLpToBurn) / totalSupply : 0n;
  const amount1ToReceive = totalSupply > 0n ? (reserve1 * amountLpToBurn) / totalSupply : 0n;
  const showEstimates = amountLpToBurn > 0n && (reserve0 > 0n || reserve1 > 0n);

  const needsApproval = amountLpToBurn > 0n && allowance < amountLpToBurn;

  async function onApprove() { const hash = await writeContractAsync({ address: pairAddress, abi: pairAbi as Abi, functionName: "approve", args: [router, amountLpToBurn] }); setTxHash(hash); }
  async function onRemove() {
    if (!token0 || !token1) return;
    const bps = BigInt(Math.floor(slippageTolerance * 100));
    const denom = 10000n;
    const min0 = (amount0ToReceive * (denom - bps)) / denom;
    const min1 = (amount1ToReceive * (denom - bps)) / denom;
    const deadline = BigInt(Math.floor(Date.now() / 1000)) + BigInt(deadlineMinutes) * 60n;
    const hash = await writeContractAsync({ address: router, abi: routerAbi as Abi, functionName: "removeLiquidity", args: [token0, token1, amountLpToBurn, min0, min1, user!, deadline] });
    setTxHash(hash);
  }

  const isLoadingData = pairReads.isLoading || tokenMetaReads.isLoading;
  const isLoadingPairOnly = pairReads.isLoading;

  // --- GIAO DIỆN ĐÃ ĐƯỢC THIẾT KẾ LẠI ---
  return (
    <VStack align="stretch" gap={5}>
      <VStack gap={3}>
        <Heading size="2xl" color="white">{percentageToRemove}%</Heading>
        
        <Box position="relative" px={1}>
          <Global styles={css`
            .qs-range { -webkit-appearance: none; appearance: none; width: 100%; height: 6px; border-radius: 9999px; background: linear-gradient(90deg, #0052FF 0%, #00D1B2 100%); outline: none; opacity: 0.9; transition: opacity 0.2s; }
            .qs-range:hover { opacity: 1; }
            .qs-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #0f1928; border: 2px solid #00FFC2; box-shadow: 0 0 12px rgba(0,255,194,0.5); cursor: pointer; margin-top: -6px; }
            .qs-range::-moz-range-thumb { width: 18px; height: 18px; border-radius: 50%; background: #0f1928; border: 2px solid #00FFC2; box-shadow: 0 0 12px rgba(0,255,194,0.5); cursor: pointer; }
          `} />
          <input
            className="qs-range"
            type="range"
            min={0}
            max={100}
            step={1}
            value={percentageToRemove}
            onChange={(e) => setPercentageToRemove(Number(e.target.value))}
          />
        </Box>
        
        <HStack w="full" justify="space-between">
          {[25, 50, 75, 100].map(val => (
            <Button key={val} size="sm" variant="ghost" color="whiteAlpha.600" _hover={{ bg: 'whiteAlpha.100', color: 'white' }} onClick={() => setPercentageToRemove(val)}>{val}%</Button>
          ))}
        </HStack>
      </VStack>

      <VStack
        p={4}
        bg="blackAlpha.300"
        rounded="xl"
        border="1px solid"
        borderColor="rgba(255, 255, 255, 0.05)"
        gap={3}
        align="stretch"
      >
        <Text fontWeight="semibold" color="whiteAlpha.800">You will receive (estimated)</Text>
        <TokenAmountDisplay symbol={symbol0} amount={showEstimates ? formatUnits(amount0ToReceive, decimals0) : "0"} isLoading={isLoadingData} />
        <TokenAmountDisplay symbol={symbol1} amount={showEstimates ? formatUnits(amount1ToReceive, decimals1) : "0"} isLoading={isLoadingData} />
      </VStack>
      
      <VStack gap={2} align="stretch">
        <InfoRow label="Your LP token balance" value={
          isLoadingPairOnly ? <Skeleton rounded="md"><Box h="20px" w="100px" /></Skeleton> : formatUnits(lpTokenBalance, 18)
        }/>
        <InfoRow label="LP tokens to remove" value={
          isLoadingPairOnly ? <Skeleton rounded="md"><Box h="20px" w="100px" /></Skeleton> : formatUnits(amountLpToBurn, 18)
        }/>
      </VStack>

      <HStack pt={2}>
        {onClose && <Button variant="outline" borderColor="whiteAlpha.300" color="whiteAlpha.800" _hover={{ bg: 'whiteAlpha.100' }} onClick={onClose} flex={1}>Cancel</Button>}
        <GradientButton
          onClick={needsApproval ? onApprove : onRemove}
          loading={receipt.isLoading}
          disabled={amountLpToBurn === 0n}
          flex={2}
        >
          {needsApproval ? "Approve" : "Remove"}
        </GradientButton>
      </HStack>
    </VStack>
  );
}