"use client";

import { Container, Flex } from "@chakra-ui/react";
import { SwapComponent } from "../../components/SwapComponent";

export default function SwapPage() {
  return (
    <Container maxW="container.lg" py={10}>
      <Flex justify="center">
        <SwapComponent />
      </Flex>
    </Container>
  );
}


