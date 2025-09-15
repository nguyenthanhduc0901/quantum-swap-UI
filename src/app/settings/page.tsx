"use client";

import { useEffect, useState } from "react";
import { Box, Container, Heading, HStack, Input, Text, VStack, Button } from "@chakra-ui/react";
import { useSettings } from "@/contexts/SettingsContext";

export default function SettingsPage() {
  const { slippageTolerance, deadlineMinutes, setSlippageTolerance, setDeadlineMinutes } = useSettings();
  const [slippage, setSlippage] = useState<string>(String(slippageTolerance));
  const [deadline, setDeadline] = useState<string>(String(deadlineMinutes));
  const [status, setStatus] = useState<"idle" | "saved">("idle");

  useEffect(() => {
    setSlippage(String(slippageTolerance));
    setDeadline(String(deadlineMinutes));
  }, [slippageTolerance, deadlineMinutes]);

  function save() {
    setSlippageTolerance(Number(slippage || 0));
    setDeadlineMinutes(Number(deadline || 0));
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 1200);
  }

  return (
    <Container maxW="container.md" py={{ base: 8, md: 12 }}>
      <VStack align="stretch" gap={6}>
        {/* Hero */}
        <Box bg="rgba(23,35,53,0.75)" border="1px solid" borderColor="rgba(255,255,255,0.08)" rounded="2xl" p={{ base: 6, md: 8 }} backdropFilter="blur(12px)">
          <Heading size="lg" color="white">Settings</Heading>
          <Text color="whiteAlpha.800" mt={2}>Customize your trading experience. Values are stored locally in your browser.</Text>
        </Box>

        {/* Form */}
        <Box bg="rgba(23,35,53,0.6)" border="1px solid" borderColor="rgba(255,255,255,0.08)" rounded="xl" p={{ base: 5, md: 6 }}>
          <VStack align="stretch" gap={4}>
            <Box>
              <Text color="whiteAlpha.800" mb={2}>Slippage tolerance (%)</Text>
              <Input value={slippage} onChange={(e) => setSlippage(e.target.value)} type="text" inputMode="decimal" bg="blackAlpha.400" color="white" />
            </Box>
            <Box>
              <Text color="whiteAlpha.800" mb={2}>Transaction deadline (minutes)</Text>
              <Input value={deadline} onChange={(e) => setDeadline(e.target.value)} type="text" inputMode="numeric" bg="blackAlpha.400" color="white" />
            </Box>
            <HStack>
              <Button onClick={save} bgGradient="linear(to-r, #0052FF, #00D1B2)" _hover={{ filter: "brightness(1.05)" }} color="white" rounded="lg">
                {status === "saved" ? "Saved" : "Save Settings"}
              </Button>
            </HStack>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
}


