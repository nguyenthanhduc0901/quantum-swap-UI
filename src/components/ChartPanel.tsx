"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { 
  Box, 
  Heading, 
  HStack, 
  Text, 
  VStack, 
  SimpleGrid, 
  Icon, 
  Flex,
  Badge,
  Divider
} from "@chakra-ui/react";
import { FiTrendingUp, FiTrendingDown, FiInfo, FiClock } from "react-icons/fi";
import { generateMockLineData } from "@/lib/mockChartData";
import type { TokenInfo } from "../constants/tokens";

const TokenChart = dynamic(() => import("./ui/TokenChart").then((m) => m.TokenChart), {
  ssr: false,
  loading: () => (
    <Box 
      height="300px" 
      display="flex" 
      alignItems="center" 
      justifyContent="center" 
      bg="cardBg" 
      borderWidth="1px" 
      borderColor="cardBorder" 
      rounded="xl"
    >
      <Text>Loading chart...</Text>
    </Box>
  ),
});

interface ChartPanelProps {
  inputToken?: TokenInfo | null;
  outputToken?: TokenInfo | null;
}

export function ChartPanel({ inputToken, outputToken }: ChartPanelProps) {
  const [data, setData] = useState(generateMockLineData(240, 2000));
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Create a token pair display string
  const tokenPair = inputToken && outputToken 
    ? `${inputToken.symbol} / ${outputToken.symbol}`
    : "WETH / USDC";

  // Regenerate chart data when tokens change
  useEffect(() => {
    if (inputToken && outputToken) {
      const baseValue = Math.random() * 5000 + 500;
      setData(generateMockLineData(240, baseValue));
      setLastUpdated(new Date());
    }
  }, [inputToken?.address, outputToken?.address]);

  // Derived values
  const lastPrice = data[data.length - 1]?.value ?? 0;
  const firstPrice = data[0]?.value ?? 0;
  const priceChange = lastPrice - firstPrice;
  const percentChange = (priceChange / firstPrice) * 100;
  const isPositive = percentChange >= 0;
  
  // Format for display
  const price = `$${lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const change = `${isPositive ? "+" : ""}${percentChange.toFixed(2)}%`;
  
  // Key stats
  const stats = [
    { 
      label: "Total Liquidity", 
      value: "$8.4M", 
      info: "Total value locked in this token pair's liquidity pool"
    },
    { 
      label: "24h Volume", 
      value: "$540k",
      info: "Total trading volume in the last 24 hours" 
    },
    { 
      label: "24h Fees", 
      value: "$12.4k",
      info: "Total fees generated in the last 24 hours" 
    },
    { 
      label: "Market Cap", 
      value: "$47.2M",
      info: "Total market capitalization" 
    },
  ];

  return (
    <VStack align="stretch" gap={4}>
      <Flex direction={{ base: "column", md: "row" }} justify="space-between" align={{ base: "flex-start", md: "center" }} mb={1}>
        <HStack mb={{ base: 2, md: 0 }}>
          <Heading size="lg" fontWeight="bold">{tokenPair}</Heading>
          <Badge colorScheme="blue" fontSize="sm">DEX</Badge>
        </HStack>
        <HStack gap={4} align="center">
          <Text fontSize="xl" fontWeight="bold">{price}</Text>
          <Badge
            colorScheme={isPositive ? "green" : "red"} 
            variant="solid"
            rounded="md"
            px={2}
            py={1}
            display="flex"
            alignItems="center"
          >
            <Icon as={isPositive ? FiTrendingUp : FiTrendingDown} mr={1} boxSize="12px" />
            {change}
          </Badge>
        </HStack>
      </Flex>
      
      <Box 
        bg="cardBg" 
        borderWidth="1px" 
        borderColor="cardBorder" 
        rounded="xl" 
        boxShadow="lg" 
        p={4}
        position="relative"
        overflow="hidden"
      >
        <TokenChart data={data} height={320} tokenPair={tokenPair} />
        
        <HStack fontSize="xs" color="gray.500" mt={2} justify="flex-end">
          <Icon as={FiClock} />
          <Text>Last updated: {lastUpdated.toLocaleTimeString()}</Text>
        </HStack>
      </Box>

      <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
        {stats.map((stat) => (
          <VStack 
            key={stat.label}
            bg="cardBg" 
            borderWidth="1px" 
            borderColor="cardBorder" 
            rounded="xl" 
            boxShadow="md" 
            p={4} 
            align="flex-start"
            transition="all 0.2s"
            _hover={{
              transform: "translateY(-2px)",
              boxShadow: "xl",
            }}
            title={stat.info}
          >
            <Flex w="100%" justify="space-between">
              <Text fontSize="sm" color="gray.500">{stat.label}</Text>
              <Icon as={FiInfo} boxSize="12px" color="gray.500" />
            </Flex>
            <Heading size="md">{stat.value}</Heading>
          </VStack>
        ))}
      </SimpleGrid>
    </VStack>
  );
}

