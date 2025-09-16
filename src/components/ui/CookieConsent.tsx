"use client";

import { useEffect, useState } from "react";
import { Box, HStack, Text, Link as ChakraLink, Button } from "@chakra-ui/react";
import NextLink from "next/link";
import { GradientButton } from "@/components/ui/GradientButton";

const STORAGE_KEY = "qs.cookies.accepted";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const accepted = window.localStorage.getItem(STORAGE_KEY);
      if (accepted !== "true") setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  function accept() {
    try { window.localStorage.setItem(STORAGE_KEY, "true"); } catch {}
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <Box position="fixed" bottom={4} right={4} zIndex={10000}>
      <Box
        w={{ base: "calc(100vw - 32px)", sm: "360px" }}
        bg="rgba(23,35,53,0.9)"
        backdropFilter="blur(12px)"
        border="1px solid"
        borderColor="rgba(255,255,255,0.08)"
        rounded="xl"
        p={{ base: 3, md: 4 }}
        boxShadow="0 8px 24px rgba(0,0,0,0.35)"
      >
        <Text color="whiteAlpha.900" fontSize={{ base: "sm", md: "sm" }} mb={3}>
          We use cookies to improve your experience. See our
          {" "}
          <ChakraLink as={NextLink} href="/privacy" color="brand.300" _hover={{ textDecoration: "underline" }}>Privacy Policy</ChakraLink>.
        </Text>
        <HStack justify="flex-end" gap={2}>
          <Button size="sm" variant="ghost" color="whiteAlpha.800" _hover={{ bg: "whiteAlpha.200" }} onClick={() => setVisible(false)}>Dismiss</Button>
          <GradientButton size="sm" onClick={accept} hoverOnly>Accept</GradientButton>
        </HStack>
      </Box>
    </Box>
  );
}


