"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { Box, Container, Flex, Heading, Link as ChakraLink } from "@chakra-ui/react";
import { ConnectWalletButton } from "../ui/ConnectWalletButton";

export function Navbar() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href;

  return (
    <Box as="nav" bg="whiteAlpha.50" borderBottom="1px" borderColor="panelBorder" py={3} color="fg" backdropFilter="blur(6px)">
      <Container maxW="container.xl">
        <Flex align="center" justify="space-between" gap={4}>
          <Flex align="center" gap={3}>
            <ChakraLink as={NextLink} href="/" _hover={{ textDecoration: "none" }}>
              <Heading size="md" color="brand.300">QuantumSwap</Heading>
            </ChakraLink>
          </Flex>

          <Flex align="center" gap={2} display={{ base: "none", md: "flex" }}>
            <ChakraLink
              as={NextLink}
              href="/swap"
              px={3}
              py={1}
              rounded="md"
              bg={isActive("/swap") ? "whiteAlpha.100" : "transparent"}
              color={isActive("/swap") ? "brand.300" : "fg"}
              _hover={{ color: "brand.300", bg: "whiteAlpha.100" }}
            >
              Swap
            </ChakraLink>
            <ChakraLink
              as={NextLink}
              href="/pool"
              px={3}
              py={1}
              rounded="md"
              bg={isActive("/pool") ? "whiteAlpha.100" : "transparent"}
              color={isActive("/pool") ? "brand.300" : "fg"}
              _hover={{ color: "brand.300", bg: "whiteAlpha.100" }}
            >
              Pool
            </ChakraLink>
          </Flex>

          <ConnectWalletButton />
        </Flex>
      </Container>
    </Box>
  );
}


