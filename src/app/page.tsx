"use client";

import NextLink from "next/link";
import { Container, Flex, Heading, Text, HStack, Button, Box, VStack, SimpleGrid } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { FiArrowRight } from "react-icons/fi";
import { FaEthereum, FaCoins } from "react-icons/fa";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { FaBolt, FaShieldAlt, FaLayerGroup, FaUsers } from "react-icons/fa";

const MotionBox = motion(Box);

export default function Home() {
  return (
    <VStack spacing={{ base: 20, md: 24 }} align="stretch">
      {/* Hero Section */}
      <Container maxW="container.lg" py={{ base: 16, md: 24 }}>
        <Flex direction={{ base: "column", md: "row" }} align="center" gap={{ base: 10, md: 12 }}>
        {/* Left: Hero copy */}
        <Flex direction="column" gap={6} flex="1" align={{ base: "center", md: "flex-start" }} textAlign={{ base: "center", md: "left" }}>
          <Heading as="h1" size="3xl" lineHeight="1.1" bgGradient="linear(to-r, brand.500, brand.600)" bgClip="text">
            The Future of Decentralized Exchange is Here.
          </Heading>
          <Text fontSize="xl" color="gray.500" maxW={{ base: "full", md: "lg" }}>
            Swap any token on the Ethereum network with deep liquidity and low fees. Your assets, your control.
          </Text>
          <HStack gap={4}>
            <Button as={NextLink} href="/swap" colorScheme="brand" size="lg" h={12} px={6} fontWeight="semibold" _hover={{ boxShadow: "md" }}>
              <HStack gap={2}>
                <span>Launch App</span>
                <FiArrowRight />
              </HStack>
            </Button>
            <Button as={NextLink} href="https://github.com/your-org/quantumswap" target="_blank" rel="noreferrer" variant="outline" colorScheme="gray" size="lg" h={12} px={6}>
              Learn More
            </Button>
          </HStack>
        </Flex>

        {/* Right: Abstract animated visual */}
        <Flex flex="1" justify="center" align="center" minH={{ base: 220, md: 320 }}>
          {/* Glass container */}
          <Box
            position="relative"
            w={{ base: 300, md: 380 }}
            h={{ base: 220, md: 260 }}
            bg="whiteAlpha.200"
            borderWidth="1px"
            borderColor="whiteAlpha.400"
            rounded="xl"
            boxShadow="card"
            style={{ backdropFilter: "blur(10px)" }}
            overflow="hidden"
          >
            {/* Floating gradient orbs (behind) */}
            <MotionBox
              position="absolute"
              top="10%"
              left="-8%"
              w={{ base: 160, md: 200 }}
              h={{ base: 160, md: 200 }}
              rounded="full"
              bgGradient="linear(to-br, brand.400, brand.600)"
              filter="blur(30px)"
              opacity={0.35}
              zIndex={0}
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
            <MotionBox
              position="absolute"
              bottom="-12%"
              right="-10%"
              w={{ base: 200, md: 240 }}
              h={{ base: 200, md: 240 }}
              rounded="full"
              bgGradient="linear(to-tr, brand.300, brand.600)"
              filter="blur(40px)"
              opacity={0.3}
              zIndex={0}
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Token icons moving gently (above orbs) */}
            <MotionBox
              position="absolute"
              top="50%"
              left="50%"
              style={{ transform: "translate(-50%, -50%)" }}
              w={{ base: 140, md: 170 }}
              h={{ base: 140, md: 170 }}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              px={6}
              zIndex={1}
              animate={{ x: [0, 6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Box as={FaEthereum} boxSize={{ base: 10, md: 12 }} color="brand.600" />
              <Box as={FaCoins} boxSize={{ base: 10, md: 12 }} color="brand.400" />
            </MotionBox>
          </Box>
        </Flex>
      </Container>

      {/* Section 2: Why Choose QuantumSwap? */}
      <Container maxW="container.lg">
        <VStack align="stretch" spacing={8}>
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
      <Container maxW="container.lg">
        <VStack align="stretch" spacing={8}>
          <Heading size="lg" textAlign="center">Getting Started in 3 Easy Steps</Heading>
          <Flex direction={{ base: "column", md: "row" }} gap={6}>
            <VStack flex={1} p={6} bg="cardBg" borderWidth="1px" borderColor="cardBorder" rounded="xl" boxShadow="card" align="flex-start">
              <Text fontSize="4xl" fontWeight="bold" color="brand.600">01</Text>
              <Heading size="md">Connect Your Wallet</Heading>
              <Text color="gray.500">Securely connect your MetaMask or any WalletConnect-compatible wallet in seconds.</Text>
            </VStack>
            <VStack flex={1} p={6} bg="cardBg" borderWidth="1px" borderColor="cardBorder" rounded="xl" boxShadow="card" align="flex-start">
              <Text fontSize="4xl" fontWeight="bold" color="brand.600">02</Text>
              <Heading size="md">Select Tokens & Swap</Heading>
              <Text color="gray.500">Choose from thousands of tokens and execute your trade instantly at the best available rate.</Text>
            </VStack>
            <VStack flex={1} p={6} bg="cardBg" borderWidth="1px" borderColor="cardBorder" rounded="xl" boxShadow="card" align="flex-start">
              <Text fontSize="4xl" fontWeight="bold" color="brand.600">03</Text>
              <Heading size="md">Provide Liquidity & Earn</Heading>
              <Text color="gray.500">Become a liquidity provider to earn passive income from trading fees on your favorite pairs.</Text>
            </VStack>
          </Flex>
        </VStack>
      </Container>

      {/* Section 4: Protocol at a Glance */}
      <Container maxW="container.lg" pb={{ base: 16, md: 24 }}>
        <VStack align="stretch" spacing={8}>
          <Heading size="lg" textAlign="center">Protocol at a Glance</Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
            <VStack bg="cardBg" borderWidth="1px" borderColor="cardBorder" rounded="xl" boxShadow="card" p={6}>
              <Text fontSize="sm" color="gray.500">Total Value Locked</Text>
              <Heading size="lg">$125.4M</Heading>
            </VStack>
            <VStack bg="cardBg" borderWidth="1px" borderColor="cardBorder" rounded="xl" boxShadow="card" p={6}>
              <Text fontSize="sm" color="gray.500">24H Trading Volume</Text>
              <Heading size="lg">$15.2M</Heading>
            </VStack>
            <VStack bg="cardBg" borderWidth="1px" borderColor="cardBorder" rounded="xl" boxShadow="card" p={6}>
              <Text fontSize="sm" color="gray.500">Active Pools</Text>
              <Heading size="lg">350+</Heading>
            </VStack>
          </SimpleGrid>
        </VStack>
      </Container>
    </VStack>
  );
}
