"use client";

import { useEffect, useMemo, useState } from "react";
import { Box, Button, HStack, Image, Input, Text, Flex, Skeleton } from "@chakra-ui/react";
import { useChainId, useReadContracts } from "wagmi";
import { isAddress } from "viem";
import { type TokenInfo } from "@/constants/tokens";
import { useTokenList, saveCustomToken } from "@/hooks/useTokenList";

// Minimal ERC20 ABI for metadata reads
const ERC20_ABI = [
  { name: "symbol",   type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { name: "name",     type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { name: "decimals", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
] as const;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onTokenSelect: (token: TokenInfo) => void;
};

export function TokenSelectModal({ isOpen, onClose, onTokenSelect }: Props) {
  const chainId = useChainId() ?? 31337;
  const { tokens, isLoading } = useTokenList();
  const [query, setQuery] = useState("");

  // Custom token discovery if search is an address
  const addr = useMemo(() => (isAddress(query.trim()) ? (query.trim() as `0x${string}`) : undefined), [query]);
  const erc20Calls = useMemo(() => {
    if (!addr) return [] as any[];
    return [
      { address: addr, abi: ERC20_ABI as any, functionName: "symbol" as const },
      { address: addr, abi: ERC20_ABI as any, functionName: "name" as const },
      { address: addr, abi: ERC20_ABI as any, functionName: "decimals" as const },
    ];
  }, [addr]);
  const customReads = useReadContracts({ contracts: erc20Calls, query: { enabled: Boolean(addr) } });
  const customToken: TokenInfo | undefined = useMemo(() => {
    if (!addr || !customReads.data || customReads.data.some((d) => d.status !== "success")) return undefined;
    const [sym, nm, dec] = customReads.data.map((d) => d.result) as [string, string, number];
    const exists = tokens.some((t) => t.address.toLowerCase() === addr.toLowerCase());
    if (exists) return undefined;
    return { address: addr, symbol: sym, name: nm, decimals: Number(dec) } as TokenInfo;
  }, [addr, customReads.data, tokens]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tokens;
    return tokens.filter((t) =>
      t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q) || t.address.toLowerCase() === q
    );
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
          <Input placeholder="Search name / symbol / address" value={query} onChange={(e) => setQuery(e.target.value)} />
          {isLoading ? (
            <>
              {[...Array(6)].map((_, i) => <Skeleton key={i} height="36px" />)}
            </>
          ) : (
            <Flex direction="column" align="stretch" gap={1} maxH="320px" overflowY="auto">
              {customToken && (
                <Button
                  key={`custom-${customToken.address}`}
                  onClick={() => { saveCustomToken(chainId, customToken); onTokenSelect(customToken); onClose(); }}
                  variant="outline"
                  colorScheme="yellow"
                  justifyContent="flex-start"
                >
                  <HStack gap={3}>
                    <Box boxSize="20px" bg="yellow.300" rounded="full" />
                    <Text fontWeight="semibold">Import {customToken.symbol}</Text>
                    <Text color="gray.500">{customToken.name}</Text>
                  </HStack>
                </Button>
              )}
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
          )}
        </Flex>
        <Button onClick={onClose} mt={2} w="full" variant="outline" colorScheme="brand">Close</Button>
      </Box>
    </Box>
  );
}


