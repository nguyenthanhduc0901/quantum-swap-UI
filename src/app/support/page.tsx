import { Container, Heading, HStack, Link as ChakraLink, Text, VStack } from "@chakra-ui/react";

export default function SupportPage() {
  return (
    <Container maxW="container.md" py={{ base: 8, md: 12 }}>
      <VStack align="stretch" gap={6}
        bg="linear-gradient(to bottom right, rgba(0,82,255,0.15), rgba(0,209,178,0.15))" backdropFilter="blur(12px)" border="1px solid" borderColor="rgba(255,255,255,0.08)" rounded="2xl" p={{ base: 5, md: 8 }}>
        <Heading size="lg" color="white">Support</Heading>
        <Text color="whiteAlpha.700">Get help or report issues via the channels below:</Text>
        <HStack>
          <ChakraLink href="https://discord.com" target="_blank" rel="noreferrer noopener" color="brand.400">Discord</ChakraLink>
          <ChakraLink href="https://twitter.com" target="_blank" rel="noreferrer noopener" color="brand.400">Twitter</ChakraLink>
          <ChakraLink href="https://github.com" target="_blank" rel="noreferrer noopener" color="brand.400">GitHub</ChakraLink>
        </HStack>
      </VStack>
    </Container>
  );
}


