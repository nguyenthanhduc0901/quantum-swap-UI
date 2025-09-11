"use client";

import { Box, Container, Flex, Link as ChakraLink, Text } from "@chakra-ui/react";

export function Footer() {
  return (
    <Box as="footer" borderTop="1px" borderColor="gray.200" mt={10} py={4} bg="gray.50">
      <Container maxW="container.xl">
        <Flex align="center" justify="space-between">
          <Text color="gray.600">This is a portfolio project. Use at your own risk.</Text>
          <ChakraLink 
            href="https://github.com/your-org/quantumswap" 
            color="teal.600"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </ChakraLink>
        </Flex>
      </Container>
    </Box>
  );
}



