"use client";

import {
  Box, Container, Flex, HStack, Link as ChakraLink, Text,
  VStack, SimpleGrid,
} from "@chakra-ui/react";
import { FaGithub, FaDiscord, FaTwitter } from "react-icons/fa"; // Thay LinkedIn bằng Discord
import { GradientLogo } from "../ui/GradientLogo"; // Thêm logo
import NextLink from "next/link";

// Component con để giữ cho các link có style nhất quán
function FooterLink({ href, children }: { href: string, children: React.ReactNode }) {
  return (
    <ChakraLink
      as={NextLink}
      href={href}
      color="whiteAlpha.700"
      _hover={{
        color: "white",
        textDecoration: "underline",
        textUnderlineOffset: "3px",
      }}
    >
      {children}
    </ChakraLink>
  );
}

export function Footer() {
  return (
    <Box
      as="footer"
      bg="rgba(10, 25, 47, 0.7)" // Đồng bộ màu với Navbar
      backdropFilter="blur(10px)"
      borderTop="1px"
      borderColor="rgba(255, 255, 255, 0.08)"
      py={{ base: 8, md: 12 }}
      mt="auto" // QUAN TRỌNG: Đẩy footer xuống cuối trang
    >
      <Container maxW="container.xl">
        <VStack gap={8} align="stretch">
          {/* PHẦN 1: CÁC CỘT LIÊN KẾT */}
          <SimpleGrid
            columns={{ base: 2, md: 4 }}
            gap={{ base: 6, md: 8 }}
          >
            {/* Cột 1: Logo và Thương hiệu */}
            <VStack gap={3} align={{ base: "flex-start", md: "flex-start" }}>
              <ChakraLink as={NextLink} href="/" _hover={{ textDecoration: 'none' }}>
                <HStack gap={2}>
                  <GradientLogo width={24} height={24} />
                  <Text fontSize="xl" fontWeight="bold" color="white">
                    QuantumSwap
                  </Text>
                </HStack>
              </ChakraLink>
              <Text fontSize="sm" color="whiteAlpha.600">
                The Next Generation DeFi Exchange.
              </Text>
            </VStack>

            {/* Cột 2: Các liên kết ứng dụng */}
            <VStack gap={3} align="flex-start">
              <Text fontWeight="semibold" color="whiteAlpha.900">App</Text>
              <FooterLink href="/swap">Swap</FooterLink>
              <FooterLink href="/pool">Pool</FooterLink>
              <FooterLink href="/portfolio">Portfolio</FooterLink>
            </VStack>

            {/* Cột 3: Các liên kết tài nguyên */}
            <VStack gap={3} align="flex-start">
              <Text fontWeight="semibold" color="whiteAlpha.900">Protocol</Text>
              <FooterLink href="/docs">Docs</FooterLink>
              <FooterLink href="#">Whitepaper</FooterLink>
              <FooterLink href="#">Analytics</FooterLink>
            </VStack>
            
            {/* Cột 4: Các liên kết hỗ trợ */}
            <VStack gap={3} align="flex-start">
              <Text fontWeight="semibold" color="whiteAlpha.900">Support</Text>
              <FooterLink href="#">Help Center</FooterLink>
              <FooterLink href="#">FAQ</FooterLink>
              <FooterLink href="/terms">Terms</FooterLink>
            </VStack>
          </SimpleGrid>

          <Box h="1px" bg="whiteAlpha.200" />

          {/* PHẦN 2: BẢN QUYỀN VÀ MẠNG XÃ HỘI */}
          <Flex
            align="center"
            justify="space-between"
            gap={4}
            direction={{ base: "column-reverse", md: "row" }}
          >
            <VStack align={{ base: "center", md: "flex-start" }} gap={1}>
              <Text fontSize="sm" color="whiteAlpha.600">
                © {new Date().getFullYear()} QuantumSwap. All Rights Reserved.
              </Text>
              <Text fontSize="xs" color="whiteAlpha.500">
                This is a portfolio project. Use at your own risk.
              </Text>
            </VStack>

            <HStack gap={3}>
              {/* Các icon được giữ nguyên style hover */}
              <ChakraLink href="https://twitter.com/your-handle" target="_blank" rel="noreferrer noopener">
                <IconLink aria-label="Twitter" icon={<FaTwitter />} />
              </ChakraLink>
              <ChakraLink href="https://discord.com/your-server" target="_blank" rel="noreferrer noopener">
                <IconLink aria-label="Discord" icon={<FaDiscord />} />
              </ChakraLink>
              <ChakraLink href="https://github.com/your-org/quantumswap" target="_blank" rel="noreferrer noopener">
                <IconLink aria-label="GitHub" icon={<FaGithub />} />
              </ChakraLink>
            </HStack>
          </Flex>
        </VStack>
      </Container>
    </Box>
  );
}

// Component con cho các Icon Mạng xã hội để tránh lặp code
function IconLink({ "aria-label": ariaLabel, icon }: { "aria-label": string; icon: React.ReactElement }) {
  return (
    <Flex
      as="span"
      align="center"
      justify="center"
      boxSize="40px"
      rounded="full"
      bg="whiteAlpha.100"
      color="whiteAlpha.700"
      transition="all 0.2s ease-in-out"
      _hover={{
        color: "#00FFC2",
        bg: 'whiteAlpha.200',
        transform: "translateY(-2px)",
      }}
    >
      <Box as="span" fontSize="xl">{icon}</Box>
    </Flex>
  );
}