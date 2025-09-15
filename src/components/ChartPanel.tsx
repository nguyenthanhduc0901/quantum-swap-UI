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
  Spinner, // Thêm Spinner cho trạng thái loading
} from "@chakra-ui/react";
import { FiTrendingUp, FiTrendingDown, FiInfo, FiClock } from "react-icons/fi";
import { generateMockLineData } from "@/lib/mockChartData";
import type { TokenInfo } from "../constants/tokens";

// Dynamic import với trạng thái loading được thiết kế lại
const TokenChart = dynamic(() => import("./ui/TokenChart").then((m) => m.TokenChart), {
  ssr: false,
  loading: () => (
    <Flex
      height="384px" // Tăng chiều cao để khớp
      align="center"
      justify="center"
      rounded="2xl"
      bg="rgba(23, 35, 53, 0.5)"
      backdropFilter="blur(10px)"
      border="1px solid"
      borderColor="rgba(255, 255, 255, 0.05)"
    >
      <VStack>
        <Spinner color="brand.400" />
        <Text color="whiteAlpha.600">Loading Chart...</Text>
      </VStack>
    </Flex>
  ),
});

// Component cục bộ cho mỗi thẻ thống kê
function StatCard({ label, value, info }: { label: string; value: string; info: string }) {
  return (
    <VStack
      p={4}
      align="flex-start"
      rounded="2xl"
      bg="rgba(23, 35, 53, 0.5)"
      backdropFilter="blur(10px)"
      border="1px solid"
      borderColor="rgba(255, 255, 255, 0.05)"
      transition="border-color 0.2s ease"
      _hover={{
        borderColor: "rgba(0, 255, 194, 0.3)",
      }}
      gap={1}
    >
      <HStack w="full" justify="space-between" color="whiteAlpha.600">
        <Text fontSize="sm">{label}</Text>
        <Box cursor="help" title={info}>
          <Icon as={FiInfo} />
        </Box>
      </HStack>
      <Heading size="lg" color="whiteAlpha.900">{value}</Heading>
    </VStack>
  );
}

interface ChartPanelProps {
  inputToken?: TokenInfo | null;
  outputToken?: TokenInfo | null;
}

export function ChartPanel({ inputToken, outputToken }: ChartPanelProps) {
  // --- LOGIC (Không thay đổi) ---
  const [data, setData] = useState(generateMockLineData(240, 2000));
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const tokenPair = inputToken && outputToken ? `${inputToken.symbol} / ${outputToken.symbol}` : "WETH / USDC";

  useEffect(() => {
    if (inputToken && outputToken) {
      const baseValue = Math.random() * 5000 + 500;
      setData(generateMockLineData(240, baseValue));
      setLastUpdated(new Date());
    }
  }, [inputToken?.address, outputToken?.address]);

  const lastPrice = data[data.length - 1]?.value ?? 0;
  const firstPrice = data[0]?.value ?? 0;
  const priceChange = lastPrice - firstPrice;
  const percentChange = firstPrice === 0 ? 0 : (priceChange / firstPrice) * 100;
  const isPositive = percentChange >= 0;

  const price = `$${lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const change = `${isPositive ? "+" : ""}${percentChange.toFixed(2)}%`;
  
  const stats = [
    { label: "Total Liquidity", value: "$8.4M", info: "Total value locked in this token pair's liquidity pool" },
    { label: "24h Volume", value: "$540k", info: "Total trading volume in the last 24 hours" },
    { label: "24h Fees", value: "$12.4k", info: "Total fees generated in the last 24 hours" },
    { label: "Market Cap", value: "$47.2M", info: "Total market capitalization" },
  ];

  return (
    <VStack align="stretch" gap={6}>
      {/* Header */}
      <Flex direction={{ base: "column", md: "row" }} justify="space-between" align="flex-start" gap={2}>
        <VStack align="flex-start" gap={0}>
          <Heading size="2xl" color="whiteAlpha.900">{tokenPair}</Heading>
          <HStack fontSize="sm" color="whiteAlpha.600">
            <Icon as={FiClock} />
            <Text>Last updated: {lastUpdated.toLocaleTimeString()}</Text>
          </HStack>
        </VStack>

        <VStack align={{ base: "flex-start", md: "flex-end" }} gap={1}>
          <Heading size="xl" color="whiteAlpha.900">{price}</Heading>
          <Flex
            bg={isPositive ? "green.900" : "red.900"}
            color={isPositive ? "green.300" : "red.300"}
            px={2.5} py={1} rounded="md"
            align="center"
          >
            <Icon as={isPositive ? FiTrendingUp : FiTrendingDown} mr={1.5} />
            <Text fontWeight="bold" fontSize="sm">{change}</Text>
          </Flex>
        </VStack>
      </Flex>
      
      {/* Chart */}
      {/* TokenChart đã được thiết kế lại, nó sẽ tự có nền glassmorphism */}
      <TokenChart data={data} height={384} tokenPair={tokenPair} />

      {/* Stats Grid */}
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </SimpleGrid>
    </VStack>
  );
}