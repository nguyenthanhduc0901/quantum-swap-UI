"use client";

import NextLink from "next/link";
import { Container, Flex, Heading, Text, HStack, Button, Box } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { FiArrowRight } from "react-icons/fi";
import { FaEthereum, FaCoins } from "react-icons/fa";

const MotionBox = motion(Box);

export default function Home() {
  return (
    <Container maxW="container.lg" py={{ base: 16, md: 24 }}>
      <Flex direction={{ base: "column", md: "row" }} align="center" gap={{ base: 10, md: 12 }}>
        {/* Left: Hero copy */}
        <Flex direction="column" gap={6} flex="1" align={{ base: "center", md: "flex-start" }} textAlign={{ base: "center", md: "left" }}>
          <Heading as="h1" size="3xl" lineHeight="1.1" bgGradient="linear(to-r, brand.400, brand.600)" bgClip="text">
            Secure, Fast, and Decentralized Trading
          </Heading>
          <Text fontSize="xl" color="gray.500" maxW={{ base: "full", md: "lg" }}>
            Swap any token on the Ethereum network with deep liquidity and low fees. Your assets, your control.
          </Text>
          <HStack gap={4}>
            <Button as={NextLink} href="/swap" colorScheme="brand" h={12} px={6} fontWeight="semibold">
              <HStack gap={2}>
                <span>Launch App</span>
                <FiArrowRight />
              </HStack>
            </Button>
            <Button as={NextLink} href="https://github.com/your-org/quantumswap" target="_blank" rel="noreferrer" variant="outline" colorScheme="brand" h={12} px={6}>
              Learn More
            </Button>
          </HStack>
        </Flex>

        {/* Right: Abstract animated visual */}
        <Flex flex="1" justify="center" align="center" minH={{ base: 220, md: 320 }}>
          <Box position="relative" w={{ base: 280, md: 360 }} h={{ base: 280, md: 360 }}>
            {/* Floating gradient orbs */}
            <MotionBox
              position="absolute"
              top="10%"
              left="5%"
              w={{ base: 140, md: 180 }}
              h={{ base: 140, md: 180 }}
              rounded="full"
              bgGradient="linear(to-br, brand.400, brand.600)"
              filter="blur(30px)"
              opacity={0.35}
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
            <MotionBox
              position="absolute"
              bottom="8%"
              right="6%"
              w={{ base: 160, md: 200 }}
              h={{ base: 160, md: 200 }}
              rounded="full"
              bgGradient="linear(to-tr, brand.300, brand.600)"
              filter="blur(40px)"
              opacity={0.3}
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Token icons moving gently */}
            <MotionBox
              position="absolute"
              top="50%"
              left="50%"
              style={{ transform: "translate(-50%, -50%)" }}
              w={{ base: 120, md: 150 }}
              h={{ base: 120, md: 150 }}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              px={6}
              animate={{ x: [0, 6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Box as={FaEthereum} boxSize={{ base: 10, md: 12 }} color="brand.600" />
              <Box as={FaCoins} boxSize={{ base: 10, md: 12 }} color="brand.400" />
            </MotionBox>

            {/* Card frame behind icons for depth */}
            <Box position="absolute" top="50%" left="50%" style={{ transform: "translate(-50%, -50%)" }} w={{ base: 220, md: 280 }} h={{ base: 140, md: 180 }}
              bg="cardBg" borderWidth="1px" borderColor="cardBorder" boxShadow="card" rounded="xl" />
          </Box>
        </Flex>
      </Flex>
    </Container>
  );
}
