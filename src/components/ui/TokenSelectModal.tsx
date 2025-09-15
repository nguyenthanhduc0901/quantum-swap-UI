"use client";

import { useEffect, useMemo, useState } from "react";
import { Global, css } from "@emotion/react";
import {
  Box,
  Button,
  Flex,
  HStack,
  Image,
  Input,
  Text,
  Skeleton,
  IconButton,
  VStack, // Using VStack for better vertical alignment
} from "@chakra-ui/react";
import { FiSearch, FiX } from "react-icons/fi"; // Using react-icons to avoid chakra icons package
import { useChainId, useReadContracts } from "wagmi";
import { isAddress } from "viem";
import { type TokenInfo } from "@/constants/tokens";
import { useTokenList, saveCustomToken } from "@/hooks/useTokenList";

// ABI remains the same
const ERC20_ABI = [
  { name: "symbol", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { name: "name", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
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

  // Logic for custom token discovery remains the same
  const addr = useMemo(() => (isAddress(query.trim()) ? (query.trim() as `0x${string}`) : undefined), [query]);
  const erc20Calls = useMemo(() => !addr ? [] : [
    { address: addr, abi: ERC20_ABI, functionName: "symbol" },
    { address: addr, abi: ERC20_ABI, functionName: "name" },
    { address: addr, abi: ERC20_ABI, functionName: "decimals" },
  ], [addr]);
  const customReads = useReadContracts({ contracts: erc20Calls, query: { enabled: Boolean(addr) } });
  const customToken: TokenInfo | undefined = useMemo(() => {
    if (!addr || !customReads.data || customReads.data.some((d) => d.status !== "success")) return undefined;
    const [sym, nm, dec] = customReads.data.map((d) => d.result) as [string, string, number];
    if (tokens.some((t) => t.address.toLowerCase() === addr.toLowerCase())) return undefined;
    return { address: addr, symbol: sym, name: nm, decimals: Number(dec) };
  }, [addr, customReads.data, tokens]);

  // Filtering logic remains the same
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tokens;
    return tokens.filter((t) =>
      t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q) || t.address.toLowerCase() === q
    );
  }, [query, tokens]);
  
  // Clear search on close
  useEffect(() => {
    if (isOpen) {
      setQuery("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <Global styles={css`
        /* Scoped nice scrollbar for token list */
        .qs-scrollbar {
          scrollbar-width: thin; /* Firefox */
          scrollbar-color: #00d1b2 rgba(255, 255, 255, 0.08);
        }
        .qs-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .qs-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.06);
          border-radius: 9999px;
        }
        .qs-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #0052FF, #00D1B2);
          border-radius: 9999px;
          border: 2px solid rgba(15, 25, 40, 0.9);
        }
        .qs-scrollbar::-webkit-scrollbar-thumb:hover {
          filter: brightness(1.1);
        }
      `} />
      <Flex
      position="fixed"
      inset={0}
      bg="blackAlpha.700"
      backdropFilter="blur(8px)" // Blur the background page
      zIndex={1000}
      justify="center"
      align="center"
      onClick={onClose}
    >
      <VStack
        onClick={(e) => e.stopPropagation()}
        // Glassmorphism style for the modal
        bg="rgba(23, 35, 53, 0.75)"
        backdropFilter="blur(15px)"
        border="1px solid"
        borderColor="rgba(255, 255, 255, 0.05)"
        rounded="2xl" // Softer corners
        boxShadow="0 10px 30px rgba(0,0,0,0.3)"
        w="full"
        maxW="420px"
        p={6} // More padding
        gap={4}
        align="stretch"
      >
        {/* Header with Title and Close Button */}
        <Flex justify="space-between" align="center">
          <Text fontWeight="bold" fontSize="xl" color="whiteAlpha.900">
            Select a token
          </Text>
          <IconButton
            aria-label="Close modal"
            onClick={onClose}
            size="sm"
            variant="ghost"
            color="whiteAlpha.600"
            _hover={{ bg: "whiteAlpha.100", color: "white" }}
          >
            <Box as={FiX} />
          </IconButton>
        </Flex>

        {/* Search Input */}
        <Box position="relative">
          <Box as={FiSearch} color="whiteAlpha.400" boxSize={4} position="absolute" left={3} top="50%" transform="translateY(-50%)" pointerEvents="none" />
          <Input
            placeholder="Search name or paste address"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            bg="blackAlpha.400"
            border="1px solid"
            borderColor="rgba(255, 255, 255, 0.08)"
            _hover={{ borderColor: "rgba(255, 255, 255, 0.15)" }}
            _focus={{
              borderColor: "#00FFC2", // Brand color focus
              boxShadow: "none",
            }}
            pl={10}
            rounded="lg"
            color="white"
          />
        </Box>

        {/* Token List */}
        {isLoading ? (
          <VStack gap={2}>
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} height="56px" rounded="lg" />
            ))}
          </VStack>
        ) : (
          <VStack
            gap={2}
            maxH="40vh" // Increased height
            overflowY="auto"
            className="qs-scrollbar"
            align="stretch"
          >
            {customToken && (
              <Button
                onClick={() => { saveCustomToken(chainId, customToken); onTokenSelect(customToken); onClose(); }}
                variant="solid"
                colorScheme="yellow"
                color="black"
                justifyContent="space-between"
                w="full"
                h="auto" p={3}
              >
                <HStack>
                  <Box boxSize="28px" bg="yellow.200" rounded="full" />
                  <VStack align="flex-start" gap={0}>
                    <Text fontWeight="semibold">Import {customToken.symbol}</Text>
                    <Text fontSize="xs" fontWeight="normal" color="blackAlpha.700">Found by address</Text>
                  </VStack>
                </HStack>
                <Text fontSize="sm" fontWeight="bold">Import</Text>
              </Button>
            )}
            {filtered.map((t) => (
              <Button
                key={t.address}
                onClick={() => { onTokenSelect(t); onClose(); }}
                variant="ghost"
                justifyContent="flex-start"
                w="full"
                h="auto" p={3}
                rounded="lg"
                _hover={{ bg: "whiteAlpha.100" }}
              >
                <HStack gap={3}>
                  <Image src={t.logoURI} alt={t.symbol} boxSize="28px" rounded="full" />
                  <VStack align="flex-start" gap={0}>
                    <Text fontWeight="semibold" color="whiteAlpha.900">{t.symbol}</Text>
                    <Text fontSize="sm" fontWeight="normal" color="whiteAlpha.600">{t.name}</Text>
                  </VStack>
                </HStack>
              </Button>
            ))}
          </VStack>
        )}
      </VStack>
    </Flex>
    </>
  );
}