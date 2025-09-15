"use client";

import { Flex, Spinner, Text, HStack } from "@chakra-ui/react";

export default function Loading() {
  return (
    <Flex minH="60vh" align="center" justify="center">
      <HStack gap={3} bg="rgba(23,35,53,0.6)" border="1px solid" borderColor="rgba(255,255,255,0.08)" rounded="xl" p={4} backdropFilter="blur(10px)">
        <Spinner thickness="3px" speed="0.7s" color="#00D1B2" size="lg" />
        <Text color="whiteAlpha.900" fontWeight="semibold">Loading…</Text>
      </HStack>
    </Flex>
  );
}


