"use client";

import { Box, Flex, Text, HStack } from "@chakra-ui/react";
import NextLink from "next/link";

type Props = { pairAddress: `0x${string}`; token0Symbol?: string; token1Symbol?: string };

export function LiquidityPositionCard({ pairAddress, token0Symbol, token1Symbol }: Props) {
  return (
    <Box borderWidth="1px" borderColor="gray.200" rounded="lg" p={4}>
      <Flex direction="column" align="stretch" gap={2}>
        <Text fontWeight="semibold">{token0Symbol ?? "Token0"} / {token1Symbol ?? "Token1"}</Text>
        <HStack justify="flex-end">
          <NextLink href={`/pool/remove/${pairAddress}`} style={{ color: "#319795", fontWeight: 600 }}>
            Remove
          </NextLink>
        </HStack>
      </Flex>
    </Box>
  );
}


