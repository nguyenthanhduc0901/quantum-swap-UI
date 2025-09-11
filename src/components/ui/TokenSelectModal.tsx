"use client";

import { useMemo, useState } from "react";
import { Box, Button, HStack, Image, Input, Text, Flex } from "@chakra-ui/react";
import { useChainId } from "wagmi";
import { TokenInfo, getDefaultTokens } from "../../constants/tokens";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onTokenSelect: (token: TokenInfo) => void;
};

export function TokenSelectModal({ isOpen, onClose, onTokenSelect }: Props) {
  const chainId = useChainId();
  const tokens = useMemo(() => getDefaultTokens(chainId ?? 31337), [chainId]);
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tokens;
    return tokens.filter((t) => t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q));
  }, [query, tokens]);

  if (!isOpen) return null;

  return (
    <Box position="fixed" inset={0} bg="blackAlpha.600" zIndex={1000} onClick={onClose}>
      <Box
        onClick={(e) => e.stopPropagation()}
        bg="cardBg"
        borderWidth="1px"
        borderColor="cardBorder"
        rounded="xl"
        boxShadow="card"
        w="full"
        maxW="420px"
        mx="auto"
        mt="15vh"
        p={4}
      >
        <Text fontWeight="bold" mb={3} fontSize="lg">
          Select a token
        </Text>
        <Flex direction="column" align="stretch" gap={3} pb={2}>
          <Input placeholder="Search name or symbol" value={query} onChange={(e) => setQuery(e.target.value)} />
          <Flex direction="column" align="stretch" gap={1} maxH="320px" overflowY="auto">
            {filtered.map((t) => (
              <Button key={t.address} onClick={() => { onTokenSelect(t); onClose(); }} variant="ghost" justifyContent="flex-start" _hover={{ bg: "whiteAlpha.200" }}>
                <HStack gap={3}>
                  {t.logoURI ? <Image src={t.logoURI} alt={t.symbol} boxSize="20px" /> : <Box boxSize="20px" bg="gray.200" rounded="full" />}
                  <Text fontWeight="semibold">{t.symbol}</Text>
                  <Text color="gray.500">{t.name}</Text>
                </HStack>
              </Button>
            ))}
          </Flex>
        </Flex>
        <Button onClick={onClose} mt={2} w="full" variant="outline" colorScheme="brand">Close</Button>
      </Box>
    </Box>
  );
}


