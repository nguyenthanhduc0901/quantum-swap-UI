"use client";

import { Box, Button, Flex, HStack, IconButton, Input, Text, VStack } from "@chakra-ui/react";
import { FiX } from "react-icons/fi";
import { useSettings } from "@/contexts/SettingsContext";

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  slippageTolerance: number;
  setSlippageTolerance: (value: number) => void;
  deadlineMinutes: number;
  setDeadlineMinutes: (value: number) => void;
};

export function SettingsModal({
  isOpen,
  onClose,
  slippageTolerance,
  setSlippageTolerance,
  deadlineMinutes,
  setDeadlineMinutes,
}: SettingsModalProps) {
  const settings = useSettings();
  function handleSlippageChange(v: string) {
    const num = Number(v.replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(num)) return;
    // Clamp 0.01% - 50%
    const clamped = Math.max(0.01, Math.min(50, num));
    setSlippageTolerance(Number(clamped.toFixed(2)));
  }

  function handleDeadlineChange(v: string) {
    const num = Number(v.replace(/[^0-9]/g, ""));
    if (!Number.isFinite(num)) return;
    const clamped = Math.max(1, Math.min(1440, num));
    setDeadlineMinutes(clamped);
  }

  if (!isOpen) return null;

  return (
    <Flex
      position="fixed"
      inset={0}
      bg="blackAlpha.700"
      backdropFilter="blur(8px)"
      zIndex={1000}
      justify="center"
      align="flex-start"
      onClick={onClose}
    >
      <VStack
        onClick={(e) => e.stopPropagation()}
        bg="rgba(23, 35, 53, 0.9)"
        backdropFilter="blur(15px)"
        border="1px solid"
        borderColor="rgba(255, 255, 255, 0.08)"
        rounded="2xl"
        boxShadow="0 10px 30px rgba(0,0,0,0.3)"
        w="full"
        maxW="420px"
        mt="15vh"
        p={6}
        gap={4}
        align="stretch"
      >
        <Flex justify="space-between" align="center">
          <Text fontWeight="bold" fontSize="xl" color="whiteAlpha.900">Settings</Text>
          <IconButton
            aria-label="Close settings"
            onClick={onClose}
            size="sm"
            variant="ghost"
            color="whiteAlpha.600"
            _hover={{ bg: "whiteAlpha.100", color: "white" }}
          >
            <Box as={FiX} />
          </IconButton>
        </Flex>
        <VStack align="stretch" gap={4}>
            <VStack align="stretch" gap={2}>
              <Text fontSize="sm" color="whiteAlpha.700">Slippage tolerance</Text>
              <HStack>
                <Input
                  value={String(slippageTolerance)}
                  onChange={(e) => { handleSlippageChange(e.target.value); settings.setSlippageTolerance(Number(e.target.value || 0)); }}
                  type="text"
                  inputMode="decimal"
                  placeholder="0.5"
                  textAlign="right"
                  color="white"
                  bg="blackAlpha.400"
                  borderColor="rgba(255,255,255,0.08)"
                />
                <Box color="whiteAlpha.700">%</Box>
              </HStack>
              <HStack gap={2}>
                {[0.1, 0.5, 1].map((p) => (
                  <Button
                    key={p}
                    size="sm"
                    variant={slippageTolerance === p ? "solid" : "ghost"}
                    bg={slippageTolerance === p ? "brand.400" : "transparent"}
                    color={slippageTolerance === p ? "black" : "whiteAlpha.800"}
                    _hover={{ bg: slippageTolerance === p ? "brand.300" : "whiteAlpha.200" }}
                    onClick={() => { setSlippageTolerance(p); settings.setSlippageTolerance(p); }}
                  >
                    {p}%
                  </Button>
                ))}
              </HStack>
            </VStack>

            <VStack align="stretch" gap={2}>
              <Text fontSize="sm" color="whiteAlpha.700">Transaction deadline</Text>
              <HStack>
                <Input
                  value={String(deadlineMinutes)}
                  onChange={(e) => { handleDeadlineChange(e.target.value); settings.setDeadlineMinutes(Number(e.target.value || 0)); }}
                  type="text"
                  inputMode="numeric"
                  placeholder="30"
                  textAlign="right"
                  color="white"
                  bg="blackAlpha.400"
                  borderColor="rgba(255,255,255,0.08)"
                />
                <Box color="whiteAlpha.700">minutes</Box>
              </HStack>
            </VStack>

            <Flex justify="flex-end">
              <Button onClick={onClose} bg="blackAlpha.400" _hover={{ bg: "blackAlpha.500" }} color="white">Close</Button>
            </Flex>
          </VStack>
        </VStack>
      </Flex>
  );
}


