"use client";

import { Box, Button, Flex, Heading, Text, VStack } from "@chakra-ui/react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body>
        <Flex minH="100vh" align="center" justify="center" bg="rgba(10,25,47,0.8)" backdropFilter="blur(10px)">
          <VStack p={8} rounded="2xl" border="1px solid" borderColor="rgba(255,255,255,0.08)" bg="rgba(23,35,53,0.8)" gap={3}>
            <Heading size="lg" color="white">Something went wrong</Heading>
            <Text color="whiteAlpha.700">{error.message}</Text>
            {error.digest && <Text color="whiteAlpha.500" fontSize="xs">Digest: {error.digest}</Text>}
            <Button onClick={reset} bg="whiteAlpha.200" _hover={{ bg: "whiteAlpha.300" }} color="white">Try again</Button>
          </VStack>
        </Flex>
      </body>
    </html>
  );
}


