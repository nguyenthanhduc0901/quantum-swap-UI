import { Container, Heading, Text, VStack } from "@chakra-ui/react";

export default function TermsPage() {
  return (
    <Container maxW="container.md" py={{ base: 8, md: 12 }}>
      <VStack align="stretch" gap={6}
        bg="rgba(23,35,53,0.6)" backdropFilter="blur(12px)" border="1px solid" borderColor="rgba(255,255,255,0.08)" rounded="2xl" p={{ base: 5, md: 8 }}>
        <Heading size="lg" color="white">Terms of Service</Heading>
        <Text color="whiteAlpha.700">By using this application, you agree to the following terms...</Text>
      </VStack>
    </Container>
  );
}


