"use client";

import { Flex, Heading, Text, VStack, Button } from "@chakra-ui/react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Flex minH="60vh" align="center" justify="center">
      <VStack p={8} rounded="2xl" border="1px solid" borderColor="rgba(255,255,255,0.08)" bg="rgba(23,35,53,0.8)" gap={3}>
        <Heading size="lg" color="white">Unexpected Error</Heading>
        <Text color="whiteAlpha.700">{error.message}</Text>
        <Button onClick={reset} bg="whiteAlpha.200" _hover={{ bg: "whiteAlpha.300" }} color="white">Try again</Button>
      </VStack>
    </Flex>
  );
}


