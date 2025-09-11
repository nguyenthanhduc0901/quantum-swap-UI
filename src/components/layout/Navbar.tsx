"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { Box, Container, Flex, Heading, Link as ChakraLink } from "@chakra-ui/react";
import { ConnectWalletButton } from "../ui/ConnectWalletButton";

export function Navbar() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href;

  return (
    <Box as="nav" bg="white" borderBottom="1px" borderColor="cardBorder" py={3} color="fg">
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
              py={0}
              h={9}
              display="inline-flex"
              alignItems="center"
              rounded="md"
              bg={isActive("/swap") ? "gray.100" : "transparent"}
              color={isActive("/swap") ? "brand.600" : "fg"}
              _hover={{ color: "brand.600", bg: "gray.100" }}
            >
              Swap
            </ChakraLink>
            <ChakraLink
              as={NextLink}
              href="/pool"
              px={3}
              py={0}
              h={9}
              display="inline-flex"
              alignItems="center"
              rounded="md"
              bg={isActive("/pool") ? "gray.100" : "transparent"}
              color={isActive("/pool") ? "brand.600" : "fg"}
              _hover={{ color: "brand.600", bg: "gray.100" }}
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


