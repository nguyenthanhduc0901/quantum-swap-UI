import { Container, Heading, Text, VStack } from "@chakra-ui/react";

export default function PrivacyPage() {
  return (
    <Container maxW="container.md" py={{ base: 8, md: 12 }}>
      <VStack align="stretch" gap={6}
        bg="rgba(23,35,53,0.6)" backdropFilter="blur(12px)" border="1px solid" borderColor="rgba(255,255,255,0.08)" rounded="2xl" p={{ base: 5, md: 8 }}>
        <Heading size="lg" color="white">Privacy Policy</Heading>
        <Text color="whiteAlpha.700">We do not collect personal data unless explicitly provided...</Text>
      </VStack>
    </Container>
  );
}


