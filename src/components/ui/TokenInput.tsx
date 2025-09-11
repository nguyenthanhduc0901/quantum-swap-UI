"use client";

import { Box, Button, Flex, Image, Input, Text } from "@chakra-ui/react";
import { Balance } from "./Balance";
import type { TokenInfo } from "@/constants/tokens";

type Props = {
  label: string;
  token: TokenInfo | null;
  amount: string;
  onAmountChange: (value: string) => void;
  onTokenSelect: () => void;
};

export function TokenInput({ label, token, amount, onAmountChange, onTokenSelect }: Props) {
  return (
    <Flex direction="column" gap={2}>
      <Flex justify="space-between" align="center">
        <Text fontSize="sm" color="gray.400" fontWeight="medium">{label}</Text>
        {token && (
          <Balance tokenAddress={token.address} />
        )}
      </Flex>

      <Box borderWidth="1px" borderColor="panelBorder" bg="transparent" rounded="lg" px={3} py={2}>
        <Flex align="center" gap={3}>
          <Button onClick={onTokenSelect} variant="outline" colorScheme="brand" _hover={{ bg: "whiteAlpha.200" }}>
            <Flex align="center" gap={2}>
              {token?.logoURI ? (
                <Image src={token.logoURI} alt={token.symbol} boxSize="20px" rounded="full" />
              ) : (
                <Box boxSize="20px" bg="whiteAlpha.300" rounded="full" />
              )}
              <Text fontWeight="semibold">{token?.symbol ?? "Select Token"}</Text>
            </Flex>
          </Button>
          <Flex flex="1" justify="flex-end">
            <Input
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
              placeholder="0.0"
              inputMode="decimal"
              type="number"
              variant="outline"
              fontSize="2xl"
              textAlign="right"
            />
          </Flex>
        </Flex>
      </Box>
    </Flex>
  );
}


