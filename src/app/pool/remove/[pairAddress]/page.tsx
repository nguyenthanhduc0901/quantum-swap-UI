/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { Container, Flex } from "@chakra-ui/react";
import { RemoveLiquidityComponent } from "../../../../components/RemoveLiquidityComponent";

type PageProps = { params: Promise<{ pairAddress: `0x${string}` }> };

export default function RemoveLiquidityPage({ params }: PageProps) {
  const resolved = React.use(params);
  const pairAddress = resolved?.pairAddress ?? "0x0000000000000000000000000000000000000000";
  return (
    <Container maxW="container.lg" py={10}>
      <Flex justify="center">
        <RemoveLiquidityComponent pairAddress={pairAddress as `0x${string}`} />
      </Flex>
    </Container>
  );
}


