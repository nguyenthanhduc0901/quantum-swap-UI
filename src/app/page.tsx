"use client";

import { Container, VStack, Heading, Text } from "@chakra-ui/react";

export default function Home() {
  return (
    <Container maxW="container.md" py={12}>
      <VStack spacing={4} textAlign="center">
        <Heading size="xl">Welcome to QuantumSwap</Heading>
        <Text fontSize="lg" color="gray.600">
          The most advanced and secure decentralized exchange.
        </Text>
      </VStack>
    </Container>
  );
}
