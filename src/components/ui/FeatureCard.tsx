"use client";

import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";

type Props = {
  icon: React.ElementType;
  title: string;
  children: ReactNode;
};

export function FeatureCard({ icon: Icon, title, children }: Props) {
  return (
    <Box
      bg="cardBg"
      borderWidth="1px"
      borderColor="cardBorder"
      rounded="xl"
      boxShadow="card"
      p={6}
      transition="transform 200ms ease, box-shadow 200ms ease"
      _hover={{ transform: "translateY(-5px)", boxShadow: "lg" }}
    >
      <Flex direction="column" align="center" textAlign="center" gap={4}>
        <Box
          rounded="full"
          bgGradient="linear(to-r, brand.400, brand.600)"
          color="white"
          w={14}
          h={14}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Box as={Icon} boxSize={6} />
        </Box>
        <Heading size="md">{title}</Heading>
        <Text color="gray.500">{children}</Text>
      </Flex>
    </Box>
  );
}



