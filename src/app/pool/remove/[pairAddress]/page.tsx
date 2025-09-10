"use client";

import { Container, Flex } from "@chakra-ui/react";
import { RemoveLiquidityComponent } from "../../../../components/RemoveLiquidityComponent";

type Params = { params: { pairAddress: string } };
export default function RemoveLiquidityPage({ params }: Params) {
  const pairAddress = params.pairAddress ?? "0x0000000000000000000000000000000000000000";
  return (
    <Container maxW="container.lg" py={10}>
      <Flex justify="center">
        <RemoveLiquidityComponent pairAddress={pairAddress as `0x${string}`} />
      </Flex>
    </Container>
  );
}


