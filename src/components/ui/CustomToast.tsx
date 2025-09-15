"use client";

import { Box, Flex, HStack, Text, Spinner, Icon } from "@chakra-ui/react";
import { FiCheckCircle, FiAlertCircle, FiInfo } from "react-icons/fi";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

export type ToastKind = "info" | "success" | "error" | "loading";

type Props = {
  title: string;
  description?: ReactNode;
  kind: ToastKind;
};

const toastConfig = {
  info: { icon: FiInfo, gradient: "linear(to-r, blue.400, cyan.400)" },
  success: { icon: FiCheckCircle, gradient: "linear(to-r, green.400, teal.400)" },
  error: { icon: FiAlertCircle, gradient: "linear(to-r, red.500, orange.500)" },
  loading: { icon: Spinner, gradient: "linear(to-r, gray.500, gray.600)" },
} as const;

export function CustomToast({ title, description, kind }: Props) {
  const { icon, gradient } = toastConfig[kind];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
    >
      <Flex
        w="full"
        maxW="md"
        bg="rgba(23, 35, 53, 0.75)"
        backdropFilter="blur(10px)"
        boxShadow="0 10px 30px rgba(0,0,0,0.3)"
        border="1px solid"
        borderColor="rgba(255, 255, 255, 0.1)"
        rounded="xl"
        p={4}
        color="white"
        position="relative"
        overflow="hidden"
      >
        {/* Dải màu gradient bên trái */}
        <Box position="absolute" left={0} top={0} bottom={0} w="4px" bgGradient={gradient} />

        <HStack gap={4} align="flex-start" pl={2}>
          <Box mt={1}>
            {kind === "loading" ? (
              <Spinner size="sm" color="whiteAlpha.700" />
            ) : (
              <Icon as={icon as any} boxSize={5} color="whiteAlpha.900" />
            )}
          </Box>
          <Flex direction="column" gap={1}>
            <Text fontWeight="bold">{title}</Text>
            {description && (
              <Text fontSize="sm" color="whiteAlpha.700">
                {description}
              </Text>
            )}
          </Flex>
        </HStack>
      </Flex>
    </motion.div>
  );
}



