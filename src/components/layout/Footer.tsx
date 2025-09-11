"use client";

import { Box, Container, Flex, HStack, IconButton, Link as ChakraLink, Text } from "@chakra-ui/react";
import { FaGithub, FaLinkedin, FaTwitter } from "react-icons/fa6";

export function Footer() {
  return (
    <Box as="footer" borderTop="1px" borderColor="panelBorder" mt={10} py={4} bg="whiteAlpha.50" color="fg">
      <Container maxW="container.xl">
        <Flex align="center" justify="space-between" gap={4} direction={{ base: "column", md: "row" }}>
          <Text fontSize="sm" color="gray.400">This is a portfolio project. Use at your own risk.</Text>
          <HStack gap={2}>
            <ChakraLink href="https://github.com/your-org/quantumswap" isExternal>
              <IconButton aria-label="GitHub" variant="ghost" colorScheme="brand">
                <FaGithub />
              </IconButton>
            </ChakraLink>
            <ChakraLink href="https://www.linkedin.com/in/your-profile" isExternal>
              <IconButton aria-label="LinkedIn" variant="ghost" colorScheme="brand">
                <FaLinkedin />
              </IconButton>
            </ChakraLink>
            <ChakraLink href="https://twitter.com/your-handle" isExternal>
              <IconButton aria-label="Twitter" variant="ghost" colorScheme="brand">
                <FaTwitter />
              </IconButton>
            </ChakraLink>
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
}



