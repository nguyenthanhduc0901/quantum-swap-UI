"use client";

import { Box, Flex, Text, HStack, Button } from "@chakra-ui/react";
import { useState } from "react";
import { RemoveLiquidityComponent } from "./RemoveLiquidityComponent";

type Props = { pairAddress: `0x${string}`; token0Symbol?: string; token1Symbol?: string };

export function LiquidityPositionCard({ pairAddress, token0Symbol, token1Symbol }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <Box borderWidth="1px" borderColor="cardBorder" rounded="xl" p={4} bg="cardBg" boxShadow="card">
      <Flex direction="column" align="stretch" gap={3}>
        <Text fontWeight="semibold">{token0Symbol ?? "Token0"} / {token1Symbol ?? "Token1"}</Text>
        {!open ? (
          <HStack justify="flex-end">
            <Button size="sm" colorScheme="brand" variant="ghost" onClick={() => setOpen(true)}>Remove</Button>
          </HStack>
        ) : (
          <RemoveLiquidityComponent pairAddress={pairAddress} onClose={() => setOpen(false)} />
        )}
      </Flex>
    </Box>
  );
}


