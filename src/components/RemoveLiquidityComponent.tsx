"use client";

import { useEffect, useMemo, useState } from "react";
import { Box, VStack, Heading, Text, HStack, Button, Link as ChakraLink } from "@chakra-ui/react";
import type { Abi } from "viem";
import { useAccount, useChainId, useReadContract, useWriteContract } from "wagmi";
import pairAbi from "../constants/abi/QuantumSwapPair.json";
import routerAbi from "../constants/abi/QuantumSwapRouter.json";
import { getContracts, type QuantumSwapAddresses } from "../constants/addresses";
import NextLink from "next/link";

type Props = { pairAddress: `0x${string}` };

export function RemoveLiquidityComponent({ pairAddress }: Props) {
  const chainId = useChainId() ?? 31337;
  const { address: user } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const contracts = getContracts(chainId) as QuantumSwapAddresses | undefined;
  const router = (contracts?.QuantumSwapRouter ?? "0x0000000000000000000000000000000000000000") as `0x${string}`;

  const [percentageToRemove, setPercentageToRemove] = useState<number>(0);
  const [lpTokenBalance, setLpTokenBalance] = useState<bigint>(0n);
  const [totalSupply, setTotalSupply] = useState<bigint>(0n);
  const [reserve0, setReserve0] = useState<bigint>(0n);
  const [reserve1, setReserve1] = useState<bigint>(0n);
  const [token0, setToken0] = useState<`0x${string}` | null>(null);
  const [token1, setToken1] = useState<`0x${string}` | null>(null);
  const [status, setStatus] = useState<"idle" | "approving" | "removing" | "success" | "error">("idle");

  // Reads
  const balRead = useReadContract({ address: pairAddress, abi: pairAbi.abi as Abi, functionName: "balanceOf", args: user ? [user] : undefined, query: { enabled: Boolean(user) } });
  const tsRead = useReadContract({ address: pairAddress, abi: pairAbi.abi as Abi, functionName: "totalSupply" });
  const resRead = useReadContract({ address: pairAddress, abi: pairAbi.abi as Abi, functionName: "getReserves" });
  const t0Read = useReadContract({ address: pairAddress, abi: pairAbi.abi as Abi, functionName: "token0" });
  const t1Read = useReadContract({ address: pairAddress, abi: pairAbi.abi as Abi, functionName: "token1" });

  const allowanceRead = useReadContract({ address: pairAddress, abi: pairAbi.abi as Abi, functionName: "allowance", args: user ? [user, router] : undefined, query: { enabled: Boolean(user) } });

  useEffect(() => { if (balRead.data) setLpTokenBalance(balRead.data as unknown as bigint); }, [balRead.data]);
  useEffect(() => { if (tsRead.data) setTotalSupply(tsRead.data as unknown as bigint); }, [tsRead.data]);
  useEffect(() => {
    if (resRead.data) {
      const [r0, r1] = resRead.data as unknown as [bigint, bigint, number];
      setReserve0(r0); setReserve1(r1);
    }
  }, [resRead.data]);
  useEffect(() => { if (t0Read.data) setToken0(t0Read.data as unknown as `0x${string}`); }, [t0Read.data]);
  useEffect(() => { if (t1Read.data) setToken1(t1Read.data as unknown as `0x${string}`); }, [t1Read.data]);

  const amountLpToBurn = useMemo(() => (lpTokenBalance * BigInt(Math.floor(percentageToRemove))) / 100n, [lpTokenBalance, percentageToRemove]);
  const amount0ToReceive = useMemo(() => (totalSupply > 0n ? (reserve0 * amountLpToBurn) / totalSupply : 0n), [reserve0, amountLpToBurn, totalSupply]);
  const amount1ToReceive = useMemo(() => (totalSupply > 0n ? (reserve1 * amountLpToBurn) / totalSupply : 0n), [reserve1, amountLpToBurn, totalSupply]);

  const allowance = (allowanceRead.data as unknown as bigint) || 0n;
  const needsApproval = amountLpToBurn > 0n && allowance < amountLpToBurn;

  async function onApprove() {
    if (!user) return;
    setStatus("approving");
    try {
      await writeContractAsync({ address: pairAddress, abi: pairAbi.abi as Abi, functionName: "approve", args: [router, BigInt(2) ** BigInt(256) - 1n] });
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  async function onRemove() {
    if (!user || !token0 || !token1) return;
    setStatus("removing");
    try {
      await writeContractAsync({
        address: router,
        abi: routerAbi.abi as Abi,
        functionName: "removeLiquidity",
        args: [token0, token1, amountLpToBurn, 0n, 0n, user, BigInt(Math.floor(Date.now() / 1000) + 1800)],
      });
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <Box maxW="560px" w="100%" borderWidth="1px" borderColor="gray.200" rounded="lg" p={5} bg="white">
      <VStack align="stretch" spacing={4}>
        <Heading size="md">Remove Liquidity</Heading>
        <Text color="gray.600">Pair: {pairAddress}</Text>
        <Box borderTopWidth="1px" borderColor="gray.200" />

        <Text fontSize="sm" color="gray.600">Select percentage</Text>
        <Box as="input" type="range" min={0} max={100} step={1} value={percentageToRemove}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPercentageToRemove(Number(e.target.value))} w="100%" />
        <HStack justify="space-between">
          <HStack>
            <Button size="sm" onClick={() => setPercentageToRemove(25)}>25%</Button>
            <Button size="sm" onClick={() => setPercentageToRemove(50)}>50%</Button>
            <Button size="sm" onClick={() => setPercentageToRemove(75)}>75%</Button>
            <Button size="sm" onClick={() => setPercentageToRemove(100)}>Max</Button>
          </HStack>
          <Text>{percentageToRemove}%</Text>
        </HStack>

        <Box borderTopWidth="1px" borderColor="gray.200" />
        <VStack align="stretch" spacing={1}>
          <Text fontWeight="semibold">You will receive:</Text>
          <Text>Token0: {amount0ToReceive.toString()}</Text>
          <Text>Token1: {amount1ToReceive.toString()}</Text>
        </VStack>

        <Text color="gray.600" fontSize="sm">Price: 1 token0 = {(reserve1 && reserve0) ? (Number(reserve1) / Math.max(Number(reserve0), 1)).toFixed(6) : "-"} token1</Text>

        <HStack justify="space-between" pt={2}>
          <ChakraLink as={NextLink} href="/pool" color="teal.600">Back to Pool</ChakraLink>
          {needsApproval ? (
            <Button colorScheme="teal" onClick={onApprove} isLoading={status === "approving"} isDisabled={amountLpToBurn === 0n}>Approve</Button>
          ) : (
            <Button colorScheme="teal" onClick={onRemove} isLoading={status === "removing"} isDisabled={amountLpToBurn === 0n}>Remove</Button>
          )}
        </HStack>
      </VStack>
    </Box>
  );
}


