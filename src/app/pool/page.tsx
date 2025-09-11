"use client";
import { Container, Flex, Heading } from "@chakra-ui/react";
// import { AddLiquidityComponent } from "@/components/AddLiquidityComponent";
import { YourLiquidityComponent } from "@/components/YourLiquidityComponent";
import { AddLiquidityComponent } from "@/components/AddLiquidityComponent";

export default function PoolPage() {
  return (
    <Container maxW="container.lg" py={12}>
      <Flex direction="column" gap={8}>
        <Heading size="lg">Pool</Heading>
        <AddLiquidityComponent />
        <YourLiquidityComponent />
      </Flex>
    </Container>
  );
}


