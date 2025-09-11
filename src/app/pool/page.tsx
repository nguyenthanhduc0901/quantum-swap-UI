"use client";
import { Container, Flex, Heading } from "@chakra-ui/react";
// import { AddLiquidityComponent } from "@/components/AddLiquidityComponent";
import { YourLiquidityComponent } from "@/components/YourLiquidityComponent";
import { AddLiquidityComponent } from "@/components/AddLiquidityComponent";

export default function PoolPage() {
  return (
    <Container maxW="container.lg" py={10}>
      <Flex direction="column" gap={8} align="center">
        <Heading size="lg" w="full" maxW="520px">Pool</Heading>
        <AddLiquidityComponent />
        <YourLiquidityComponent />
      </Flex>
    </Container>
  );
}


