"use client";

import { useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { Container, Grid, GridItem, Box, Heading, Spinner, HStack, Text } from "@chakra-ui/react";
import { SwapComponent } from "../../components/SwapComponent";
import type { TokenInfo } from "@/constants/tokens";

// Disable SSR for ChartPanel to avoid hydration mismatches from client-only data (mock/Date.now/random)
const ChartPanel = dynamic(() => import("@/components/ChartPanel").then((m) => m.ChartPanel), { ssr: false });

export default function SwapPage() {
  const [inputToken, setInputToken] = useState<TokenInfo | null>(null);
  const [outputToken, setOutputToken] = useState<TokenInfo | null>(null);
  
  // Handler to receive token selections from SwapComponent
  const handleTokensChange = (input: TokenInfo | null, output: TokenInfo | null) => {
    setInputToken(input);
    setOutputToken(output);
  };

  return (
    <Box bgGradient="linear(to-b, gray.900, gray.800)">
      <Container maxW="container.lg" py={8}>
        <Heading size="xl" mb={6} fontWeight="bold" bgGradient="linear(to-r, brand.500, purple.400)" bgClip="text">
          Swap
        </Heading>
        
        <Grid 
          templateColumns={{ base: "1fr", lg: "1.8fr 1.2fr" }} 
          gap={{ base: 8, lg: 10 }} 
          alignItems="flex-start"
        >
          <GridItem>
            <ChartPanel inputToken={inputToken} outputToken={outputToken} />
          </GridItem>
          <GridItem display="flex" justifyContent={{ base: "center", lg: "flex-end" }}>
            <Suspense fallback={
              <HStack gap={3} bg="rgba(23,35,53,0.6)" border="1px solid" borderColor="rgba(255,255,255,0.08)" rounded="xl" p={4} backdropFilter="blur(10px)">
                <Spinner color="#00D1B2" />
                <Text color="whiteAlpha.900" fontWeight="semibold">Loading…</Text>
              </HStack>
            }>
              <SwapComponent onTokenChange={handleTokensChange} />
            </Suspense>
          </GridItem>
        </Grid>
      </Container>
    </Box>
  );
}


