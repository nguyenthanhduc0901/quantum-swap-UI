"use client";

import NextLink from "next/link";
import { Container, Flex, Heading, Text, HStack, Box, VStack, SimpleGrid } from "@chakra-ui/react";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { FaBolt, FaShieldAlt, FaLayerGroup, FaUsers } from "react-icons/fa";
import { HeroPlanet } from "@/components/ui/HeroPlanet";
import { GradientButton } from "@/components/ui/GradientButton";

const BRAND_GRADIENT_CSS = "linear-gradient(to top right, #0052FF, #00FFC2)";

export default function Home() {
  return (
    <VStack w="full" gap={{ base: 20, md: 24 }} align="stretch">
      {/* Hero Section - dark, spacious, planet on left, copy on right */}
      <Box w="full" bgGradient="linear(to-b, #0b1220, #0a1426)" rounded="2xl" p={{ base: 8, md: 14 }}>
        <Flex direction={{ base: "column", md: "row" }} align="center" gap={{ base: 10, md: 14 }}>
          <Flex flex="1" justify="center">
            <HeroPlanet />
          </Flex>
          <Flex direction="column" gap={6} flex="1" align={{ base: "center", md: "flex-start" }} textAlign={{ base: "center", md: "left" }}>
            {/* Accent bar above heading */}
            <Box
              h="6px"
              w={{ base: 160, md: 220 }}
              rounded="full"
              mb={1}
              style={{
                background: "linear-gradient(90deg, #0052FF 0%, #00D1B2 100%)",
                boxShadow: "0 0 10px rgba(0,209,178,0.35)",
              }}
            />
            <Heading as="h1" fontSize={{ base: "4xl", md: "6xl" }} lineHeight="1.1" color="white">
              The Next Generation
              <br />
              of DeFi Exchange
            </Heading>
            <Text color="gray.400" fontSize={{ base: "md", md: "lg" }}>
              QuantumSwap • The next‑gen DeFi exchange
            </Text>
            <HStack>
              <GradientButton as={NextLink} href="/swap" size="lg" px={8} h={12}>
                Get Started
              </GradientButton>
            </HStack>
          </Flex>
        </Flex>
      </Box>

      {/* Section 2: Why Choose QuantumSwap? */}
      <Container maxW="container.lg">
        <VStack align="stretch" gap={8}>
          <Box display="flex" justifyContent="center">
            <Box h="6px" w={{ base: 120, md: 160 }} rounded="full" style={{ background: "linear-gradient(90deg, #0052FF 0%, #00D1B2 100%)", boxShadow: "0 0 8px rgba(0,209,178,0.3)" }} />
          </Box>
          <Heading size="lg" textAlign="center">Why Choose QuantumSwap?</Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
            <FeatureCard icon={FaBolt} title="Lightning-Fast Swaps">
              Our optimized router finds the best price across multiple liquidity pools in milliseconds.
            </FeatureCard>
            <FeatureCard icon={FaShieldAlt} title="Fortified Security">
              Audited smart contracts and a non-custodial architecture mean your funds are always under your control.
            </FeatureCard>
            <FeatureCard icon={FaLayerGroup} title="Deep Liquidity & Low Fees">
              Provide liquidity to earn competitive, real-time fees from a growing volume of trades.
            </FeatureCard>
            <FeatureCard icon={FaUsers} title="Community Governed">
              QuantumSwap is built for the community. Participate in governance to shape the future of the protocol.
            </FeatureCard>
          </SimpleGrid>
        </VStack>
      </Container>

  {/* Section 3: Getting Started in 3 Easy Steps */}
  <Container maxW="container.lg" py={{ base: 16, md: 24 }}>
    <VStack align="stretch" gap={12}>
      {/* --- Header --- */}
      <VStack gap={4}>
        <Box
          h="6px"
          w={{ base: 140, md: 180 }}
          rounded="full"
          style={{
            background: BRAND_GRADIENT_CSS,
            boxShadow: "0 0 12px rgba(0, 209, 178, 0.4)",
          }}
        />
        <Heading size="xl" color="whiteAlpha.900" textAlign="center">
          Getting Started in 3 Easy Steps
        </Heading>
      </VStack>

      {/* --- Step Cards --- */}
      <Flex direction={{ base: "column", md: "row" }} gap={6}>
        {/* Card 1 */}
        <VStack
          flex={1}
          p={6}
          align="flex-start"
          gap={3}
          rounded="2xl"
          bg="rgba(23, 35, 53, 0.5)"
          backdropFilter="blur(10px)"
          border="1px solid"
          borderColor="rgba(255, 255, 255, 0.05)"
          transition="border-color 0.3s ease"
          _hover={{
            borderColor: "rgba(0, 255, 194, 0.3)",
          }}
        >
          <Text
            fontSize="5xl"
            fontWeight="bold"
            style={{
              background: BRAND_GRADIENT_CSS,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            01
          </Text>
          <Heading size="md" color="whiteAlpha.900">
            Connect Your Wallet
          </Heading>
          <Text color="whiteAlpha.700">
            Securely connect your MetaMask or any WalletConnect-compatible wallet in seconds.
          </Text>
        </VStack>

        {/* Card 2 */}
        <VStack
          flex={1}
          p={6}
          align="flex-start"
          gap={3}
          rounded="2xl"
          bg="rgba(23, 35, 53, 0.5)"
          backdropFilter="blur(10px)"
          border="1px solid"
          borderColor="rgba(255, 255, 255, 0.05)"
          transition="border-color 0.3s ease"
          _hover={{
            borderColor: "rgba(0, 255, 194, 0.3)",
          }}
        >
          <Text
            fontSize="5xl"
            fontWeight="bold"
            style={{
              background: BRAND_GRADIENT_CSS,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            02
          </Text>
          <Heading size="md" color="whiteAlpha.900">
            Select Tokens & Swap
          </Heading>
          <Text color="whiteAlpha.700">
            Choose from thousands of tokens and execute your trade instantly at the best available rate.
          </Text>
        </VStack>

        {/* Card 3 */}
        <VStack
          flex={1}
          p={6}
          align="flex-start"
          gap={3}
          rounded="2xl"
          bg="rgba(23, 35, 53, 0.5)"
          backdropFilter="blur(10px)"
          border="1px solid"
          borderColor="rgba(255, 255, 255, 0.05)"
          transition="border-color 0.3s ease"
          _hover={{
            borderColor: "rgba(0, 255, 194, 0.3)",
          }}
        >
          <Text
            fontSize="5xl"
            fontWeight="bold"
            style={{
              background: BRAND_GRADIENT_CSS,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            03
          </Text>
          <Heading size="md" color="whiteAlpha.900">
            Provide Liquidity & Earn
          </Heading>
          <Text color="whiteAlpha.700">
            Become a liquidity provider to earn passive income from trading fees on your favorite pairs.
          </Text>
        </VStack>
      </Flex>
    </VStack>
  </Container>

  {/* Section 4: Protocol at a Glance */}
  <Container maxW="container.lg" pb={{ base: 16, md: 24 }}>
    <VStack align="stretch" gap={12}>
      {/* --- Header --- */}
      <VStack gap={4}>
        <Box
          h="6px"
          w={{ base: 140, md: 180 }}
          rounded="full"
          style={{
            background: BRAND_GRADIENT_CSS,
            boxShadow: "0 0 12px rgba(0, 209, 178, 0.4)",
          }}
        />
        <Heading size="xl" color="whiteAlpha.900" textAlign="center">
          Protocol at a Glance
        </Heading>
      </VStack>

      {/* --- Stat Cards --- */}
      <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
        {/* Card 1 */}
        <VStack
          p={6}
          rounded="2xl"
          bg="rgba(23, 35, 53, 0.5)"
          backdropFilter="blur(10px)"
          border="1px solid"
          borderColor="rgba(255, 255, 255, 0.05)"
        >
          <Text fontSize="md" color="whiteAlpha.600">
            Total Value Locked
          </Text>
          <Heading
            size="2xl"
            style={{
              background: BRAND_GRADIENT_CSS,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            $125.4M
          </Heading>
        </VStack>

        {/* Card 2 */}
        <VStack
          p={6}
          rounded="2xl"
          bg="rgba(23, 35, 53, 0.5)"
          backdropFilter="blur(10px)"
          border="1px solid"
          borderColor="rgba(255, 255, 255, 0.05)"
        >
          <Text fontSize="md" color="whiteAlpha.600">
            24H Trading Volume
          </Text>
          <Heading
            size="2xl"
            style={{
              background: BRAND_GRADIENT_CSS,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            $15.2M
          </Heading>
        </VStack>

        {/* Card 3 */}
        <VStack
          p={6}
          rounded="2xl"
          bg="rgba(23, 35, 53, 0.5)"
          backdropFilter="blur(10px)"
          border="1px solid"
          borderColor="rgba(255, 255, 255, 0.05)"
        >
          <Text fontSize="md" color="whiteAlpha.600">
            Active Pools
          </Text>
          <Heading
            size="2xl"
            style={{
              background: BRAND_GRADIENT_CSS,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            350+
          </Heading>
        </VStack>
      </SimpleGrid>
    </VStack>
  </Container>


    </VStack>
  );
}
