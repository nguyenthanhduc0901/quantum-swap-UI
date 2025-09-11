"use client";

import dynamic from "next/dynamic";
import { Box, Heading, HStack, Text, VStack, SimpleGrid } from "@chakra-ui/react";
import { generateMockLineData } from "@/src/lib/mockChartData";

const TokenChart = dynamic(() => import("./ui/TokenChart").then((m) => m.TokenChart), {
  ssr: false,
  loading: () => <Text>Loading chart...</Text>,
});

export function ChartPanel() {
  const data = generateMockLineData(240, 2000);

  // Placeholder stats
  const price = "$2,001.24";
  const change = "+1.84%";
  const stats = [
    { label: "Total Liquidity", value: "$8.4M" },
    { label: "24h Volume", value: "$540k" },
    { label: "24h Fees", value: "$12.4k" },
    { label: "Holders", value: "12,430" },
  ];

  return (
    <VStack align="stretch" gap={4}>
      <HStack justify="space-between">
        <Heading size="md">WETH / USDC</Heading>
        <HStack gap={4}>
          <Text fontSize="xl" fontWeight="semibold">{price}</Text>
          <Text color="green.500" fontWeight="medium">{change}</Text>
        </HStack>
      </HStack>

      <Box bg="cardBg" borderWidth="1px" borderColor="cardBorder" rounded="xl" boxShadow="card" p={3}>
        <TokenChart data={data} height={300} />
      </Box>

      <SimpleGrid columns={{ base: 2, md: 4 }} gap={3}>
        {stats.map((s) => (
          <VStack key={s.label} bg="cardBg" borderWidth="1px" borderColor="cardBorder" rounded="xl" boxShadow="card" p={4} align="flex-start">
            <Text fontSize="sm" color="gray.500">{s.label}</Text>
            <Heading size="md">{s.value}</Heading>
          </VStack>
        ))}
      </SimpleGrid>
    </VStack>
  );
}


