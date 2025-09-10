"use client";

import NextLink from "next/link";
import { Box, Container, Flex, HStack, Heading, Link as ChakraLink } from "@chakra-ui/react";
import { ConnectWalletButton } from "../ui/ConnectWalletButton";

export function Navbar() {
  return (
    <Box as="nav" bg="gray.50" borderBottom="1px" borderColor="gray.200" py={3}>
      <Container maxW="container.xl">
        <Flex align="center" justify="space-between" gap={4}>
          <HStack spacing={3}>
            <ChakraLink as={NextLink} href="/" _hover={{ textDecoration: "none" }}>
              <Heading size="md" color="teal.600">QuantumSwap</Heading>
            </ChakraLink>
          </HStack>

          <HStack spacing={6} display={{ base: "none", md: "flex" }}>
            <ChakraLink as={NextLink} href="/swap" color="gray.700" _hover={{ color: "teal.600" }}>
              Swap
            </ChakraLink>
            <ChakraLink as={NextLink} href="/pool" color="gray.700" _hover={{ color: "teal.600" }}>
              Pool
            </ChakraLink>
          </HStack>

          <ConnectWalletButton />
        </Flex>
      </Container>
    </Box>
  );
}


