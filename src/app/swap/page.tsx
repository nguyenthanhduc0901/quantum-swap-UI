"use client";

import { Container, Grid, GridItem } from "@chakra-ui/react";
import { SwapComponent } from "../../components/SwapComponent";
import { ChartPanel } from "@/components/ChartPanel";

export default function SwapPage() {
  return (
    <Container maxW="container.lg" py={10}>
      <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={6} alignItems="flex-start">
        <GridItem>
          <ChartPanel />
        </GridItem>
        <GridItem display="flex" justifyContent="center">
          <SwapComponent />
        </GridItem>
      </Grid>
    </Container>
  );
}


