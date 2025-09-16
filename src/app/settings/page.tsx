"use client";

import { useEffect, useState } from "react";
import { Box, Container, Heading, HStack, Input, Text, VStack, Button, Flex } from "@chakra-ui/react";
import { GradientButton } from "@/components/ui/GradientButton";
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
    const s = Math.max(0, Math.min(50, Number(slippage || 0)));
    const d = Math.max(1, Math.min(1440, Number(deadline || 0)));
    setSlippageTolerance(s);
    setDeadlineMinutes(d);
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 1200);
  }

  return (
    <Container maxW="container.md" py={{ base: 8, md: 12 }}>
      <VStack align="stretch" gap={6}>
        {/* Hero */}
        <Box bg="linear-gradient(to bottom right, rgba(0,82,255,0.15), rgba(0,209,178,0.15))" border="1px solid" borderColor="rgba(255,255,255,0.08)" rounded="2xl" p={{ base: 6, md: 8 }} backdropFilter="blur(12px)">
          <Heading size="lg" color="white">Application Settings</Heading>
          <Text color="whiteAlpha.800" mt={2}>Customize your trading experience. Settings are saved locally.</Text>
        </Box>

        {/* Form */}
        <Box bg="rgba(23,35,53,0.6)" border="1px solid" borderColor="rgba(255,255,255,0.08)" rounded="xl" p={{ base: 5, md: 6 }}>
          <VStack align="stretch" gap={6}>
            <VStack align="stretch" gap={2}>
              <Text color="whiteAlpha.800">Slippage tolerance</Text>
              <HStack>
                <Input value={slippage} onChange={(e) => setSlippage(e.target.value.replace(/[^0-9.]/g, ""))} type="text" inputMode="decimal" bg="blackAlpha.400" color="white" textAlign="right" />
                <Box color="whiteAlpha.700">%</Box>
              </HStack>
              <HStack>
                {["0.1","0.5","1.0"].map(p => (
                  <Button key={p} size="sm" variant={slippage===p?"solid":"outline"} bg={slippage===p?"brand.400":"transparent"} color={slippage===p?"black":"whiteAlpha.800"} borderColor="whiteAlpha.300" _hover={{ bg: slippage===p?"brand.300":"whiteAlpha.200" }} onClick={() => setSlippage(p)}>
                    {p}%
                  </Button>
                ))}
              </HStack>
            </VStack>

            <VStack align="stretch" gap={2}>
              <Text color="whiteAlpha.800">Transaction deadline</Text>
              <HStack>
                <Input value={deadline} onChange={(e) => setDeadline(e.target.value.replace(/[^0-9]/g, ""))} type="text" inputMode="numeric" bg="blackAlpha.400" color="white" textAlign="right" />
                <Box color="whiteAlpha.700">minutes</Box>
              </HStack>
            </VStack>

            <Flex justify="flex-end">
              <GradientButton hoverOnly onClick={save}>
                {status === "saved" ? "Saved" : "Save Settings"}
              </GradientButton>
            </Flex>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
}


