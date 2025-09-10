"use client";

import { Container, Box, Heading, Text } from "@chakra-ui/react";

export default function Home() {
  return (
    <Container maxW="container.md" py={12}>
      <Box textAlign="center">
        <Heading size="xl">Welcome to QuantumSwap</Heading>
        <Text fontSize="lg" color="gray.600" mt={4}>
          The most advanced and secure decentralized exchange.
        </Text>
      </Box>
    </Container>
  );
}
