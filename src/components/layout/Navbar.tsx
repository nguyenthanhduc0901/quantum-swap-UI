"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import {
  Box, Container, Flex, Link as ChakraLink, HStack, Text,
  IconButton, VStack, useDisclosure,
} from "@chakra-ui/react";
import { FiMenu, FiX } from "react-icons/fi";
import { ConnectWalletButton } from "../ui/ConnectWalletButton";
import { GradientLogo } from "../ui/GradientLogo";

// --- COMPONENT MỚI: Dành cho các nút chính (Swap, Pool) ---
function PrimaryNavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <ChakraLink
      as={NextLink}
      href={href}
      px={4}
      py={2}
      rounded="lg"
      fontWeight="bold"
      color={isActive ? "white" : "whiteAlpha.900"}
      transition="all 0.2s ease-in-out"
      // Nền sẽ là gradient khi active, và có màu nhẹ khi hover
      bg={isActive ? "linear-gradient(to right, #0052FF, #00C4A8)" : "whiteAlpha.100"}
      _hover={{
        textDecoration: "none",
        bg: isActive ? "linear-gradient(to right, #0052FF, #00C4A8)" : "whiteAlpha.200",
        transform: "translateY(-1px)",
        boxShadow: "md"
      }}
    >
      {children}
    </ChakraLink>
  );
}

// --- Component cho các link phụ (giữ nguyên) ---
function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <ChakraLink
      as={NextLink}
      href={href}
      px={3}
      py={2}
      rounded="md"
      color={isActive ? "white" : "whiteAlpha.700"}
      fontWeight={isActive ? "bold" : "medium"}
      position="relative"
      _hover={{ textDecoration: "none", color: "white", bg: "whiteAlpha.100" }}
      _after={isActive ? { /* ... style gạch chân giữ nguyên ... */ } : {}}
    >
      {children}
    </ChakraLink>
  );
}

export function Navbar() {
  const { open, onToggle } = useDisclosure();

  return (
    <Box
      as="nav"
      bg="rgba(10, 25, 47, 0.7)"
      backdropFilter="blur(10px)"
      position="sticky"
      top={0}
      zIndex="sticky"
      borderBottom="1px"
      borderColor="rgba(255, 255, 255, 0.08)"
    >
      <Container maxW="container.xl">
        <Flex h="80px" alignItems="center" justifyContent="space-between">
          {/* Logo */}
          <ChakraLink as={NextLink} href="/" _hover={{ textDecoration: "none" }}>
            <HStack gap={2} align="center">
              <GradientLogo width={24} height={24} />
              <Text fontSize="2xl" fontWeight="bold" color="white">
                QuantumSwap
              </Text>
            </HStack>
          </ChakraLink>

          {/* Điều hướng trên Desktop */}
          <HStack gap={4} display={{ base: "none", md: "flex" }} alignItems="center">
            <PrimaryNavLink href="/swap">Swap</PrimaryNavLink>
            <PrimaryNavLink href="/pool">Pool</PrimaryNavLink>
            <NavLink href="/pairs">Pairs</NavLink>
            <NavLink href="/portfolio">Portfolio</NavLink>
            <NavLink href="/docs">Docs</NavLink>
            <NavLink href="/settings">Settings</NavLink>
            <NavLink href="/support">Support</NavLink>
            <ConnectWalletButton />
          </HStack>

          {/* Nút Hamburger cho Mobile */}
          <IconButton
            size="md"
            aria-label="Open Menu"
            display={{ md: "none" }}
            onClick={onToggle}
            variant="ghost"
            color="white"
            _hover={{ bg: 'whiteAlpha.200' }}
          >
            {open ? <Box as={FiX} /> : <Box as={FiMenu} />}
          </IconButton>
        </Flex>

        {/* Menu xổ xuống trên Mobile */}
        {open && (
          <Box pb={4} display={{ md: "none" }}>
            <VStack as="nav" gap={4} align="stretch">
              {/* === THAY ĐỔI TẠI ĐÂY: DÙNG PRIMARYNAVLINK TRÊN MOBILE === */}
              <PrimaryNavLink href="/swap">Swap</PrimaryNavLink>
              <PrimaryNavLink href="/pool">Pool</PrimaryNavLink>

              {/* Các link phụ */}
              <NavLink href="/pairs">Pairs</NavLink>
              <NavLink href="/portfolio">Portfolio</NavLink>
              <NavLink href="/docs">Docs</NavLink>
              <NavLink href="/settings">Settings</NavLink>
              <NavLink href="/support">Support</NavLink>
              
              <Box pt={2}>
                <ConnectWalletButton />
              </Box>
            </VStack>
          </Box>
        )}
      </Container>
    </Box>
  );
}