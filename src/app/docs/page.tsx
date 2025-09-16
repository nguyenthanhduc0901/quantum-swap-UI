import { Box, Container, Heading, Text, VStack, HStack, Link as ChakraLink } from "@chakra-ui/react";
import NextLink from "next/link";

export default function DocsPage() {
  return (
    <Container maxW="container.lg" py={{ base: 8, md: 12 }}>
      <VStack align="stretch" gap={6}>
        {/* Hero card */}
        <Box bg="linear-gradient(to bottom right, rgba(0,82,255,0.15), rgba(0,209,178,0.15))" border="1px solid" borderColor="rgba(255,255,255,0.08)" rounded="2xl" p={{ base: 6, md: 8 }} backdropFilter="blur(12px)">
          <Heading size="lg" color="white" mb={2}>QuantumSwap Documentation</Heading>
          <Text color="whiteAlpha.800">A concise guide to get productive quickly.</Text>
        </Box>

        {/* Quick Links */}
        <Box bg="rgba(23,35,53,0.6)" border="1px solid" borderColor="rgba(255,255,255,0.08)" rounded="xl" p={5}>
          <Heading size="sm" color="white" mb={3}>Quick Links</Heading>
          <HStack gap={4} wrap="wrap">
            <ChakraLink as={NextLink} href="/swap" color="brand.400" _hover={{ color: "brand.200" }}>Swap</ChakraLink>
            <ChakraLink as={NextLink} href="/pool" color="brand.400" _hover={{ color: "brand.200" }}>Pool</ChakraLink>
            <ChakraLink as={NextLink} href="/portfolio" color="brand.400" _hover={{ color: "brand.200" }}>Portfolio</ChakraLink>
            <ChakraLink as={NextLink} href="/settings" color="brand.400" _hover={{ color: "brand.200" }}>Settings</ChakraLink>
          </HStack>
        </Box>

        {/* Getting Started */}
        <CardSection title="Getting Started">
          <Text color="whiteAlpha.800">Connect your wallet, choose tokens, set slippage in Settings, then execute swaps or add liquidity.</Text>
          <Pre>
{`# Local development
1) Start Hardhat node:
   quantum/ npm run node
2) Deploy local contracts:
   quantum/ npx hardhat run --network localhost scripts/deploy-local.ts
3) Start frontend:
   frontend/ npm run dev`}
          </Pre>
        </CardSection>

        {/* Swapping */}
        <CardSection title="Swapping">
          <VStack align="stretch" gap={2}>
            <Step>Open <b>Swap</b>, pick input/output tokens.</Step>
            <Step>Enter amount, review price and expected output.</Step>
            <Step>If prompted, approve the token spending, then Swap.</Step>
          </VStack>
        </CardSection>

        {/* Liquidity */}
        <CardSection title="Providing Liquidity">
          <VStack align="stretch" gap={2}>
            <Step>Go to <b>Pool</b> → <b>Add Liquidity</b>, select both tokens.</Step>
            <Step>Enter both amounts (auto-fill is disabled until both fields have values).</Step>
            <Step>Approve tokens if needed, then Supply.</Step>
          </VStack>
        </CardSection>

        {/* Troubleshooting */}
        <CardSection title="Troubleshooting">
          <VStack align="stretch" gap={2}>
            <Step>If a modal doesn’t open, ensure your wallet is connected to <b>localhost:31337</b>.</Step>
            <Step>Re-run local deploy script to refresh generated addresses.</Step>
            <Step>Clear generated cache in the browser (hard refresh) if addresses changed.</Step>
          </VStack>
        </CardSection>
      </VStack>
    </Container>
  );
}

function CardSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box bg="rgba(23,35,53,0.6)" border="1px solid" borderColor="rgba(255,255,255,0.08)" rounded="xl" p={{ base: 5, md: 6 }}>
      <Heading size="sm" color="white" mb={3}>{title}</Heading>
      {children}
    </Box>
  );
}

function Pre({ children }: { children: React.ReactNode }) {
  return (
    <Box as="pre" color="whiteAlpha.900" bg="blackAlpha.500" p={4} rounded="lg" overflowX="auto" border="1px solid" borderColor="rgba(255,255,255,0.08)">
      {children}
    </Box>
  );
}

function Step({ children }: { children: React.ReactNode }) {
  return <Text color="whiteAlpha.800">• {children}</Text>;
}


