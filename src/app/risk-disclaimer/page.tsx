import { Container, Heading, Text, VStack } from "@chakra-ui/react";

export default function RiskPage() {
  return (
    <Container maxW="container.md" py={{ base: 8, md: 12 }}>
      <VStack align="stretch" gap={6}
        bg="rgba(23,35,53,0.6)" backdropFilter="blur(12px)" border="1px solid" borderColor="rgba(255,255,255,0.08)" rounded="2xl" p={{ base: 5, md: 8 }}>
        <Heading size="lg" color="white">Risk Disclaimer</Heading>
        <Text color="whiteAlpha.700">Trading and providing liquidity involve risks. Only use funds you can afford to lose.</Text>
      </VStack>
    </Container>
  );
}


