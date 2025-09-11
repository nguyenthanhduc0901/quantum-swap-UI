"use client";

import { useEffect, useState } from "react";
import { Box, Flex, Spinner, Text } from "@chakra-ui/react";
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
      <Flex direction="column" align="center" justify="center" py={10} gap={2}>
        <Spinner color="teal.500" />
        <Text color="gray.600">Fetching your positions...</Text>
      </Flex>
    );
  }

  if (positions.length === 0) {
    return (
      <Box w={{ base: "100%", md: "520px" }} borderWidth="1px" borderColor="cardBorder" rounded="xl" p={6} bg="cardBg" boxShadow="card">
        <Text color="gray.500">Your active liquidity positions will appear here.</Text>
      </Box>
    );
  }
  return (
    <Flex direction="column" align="stretch" gap={3}>
      {positions.map((p) => (
        <LiquidityPositionCard key={p.pairAddress} pairAddress={p.pairAddress} token0Symbol={p.token0Symbol} token1Symbol={p.token1Symbol} />
      ))}
    </Flex>
  );
}



