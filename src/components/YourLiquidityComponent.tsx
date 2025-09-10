"use client";

import { useEffect, useState } from "react";
import { Box, Center, Spinner, Text, VStack } from "@chakra-ui/react";
import { LiquidityPositionCard } from "./LiquidityPositionCard";

type Position = { pairAddress: `0x${string}`; token0Symbol?: string; token1Symbol?: string };

export function YourLiquidityComponent() {
  const [isLoading, setIsLoading] = useState(true);
  const [positions, setPositions] = useState<Position[]>([]);

  useEffect(() => {
    // Placeholder fetch; integrate on-chain fetch later
    const id = setTimeout(() => {
      setPositions([]);
      setIsLoading(false);
    }, 700);
    return () => clearTimeout(id);
  }, []);

  if (isLoading) {
    return (
      <Center py={10}>
        <VStack>
          <Spinner color="teal.500" />
          <Text color="gray.600">Fetching your positions...</Text>
        </VStack>
      </Center>
    );
  }

  if (positions.length === 0) {
    return (
      <Box borderWidth="1px" borderColor="gray.200" rounded="lg" p={6} bg="white">
        <Text color="gray.600">Your active liquidity positions will appear here.</Text>
      </Box>
    );
  }
  return (
    <VStack align="stretch" gap={3}>
      {positions.map((p) => (
        <LiquidityPositionCard key={p.pairAddress} pairAddress={p.pairAddress} token0Symbol={p.token0Symbol} token1Symbol={p.token1Symbol} />
      ))}
    </VStack>
  );
}


