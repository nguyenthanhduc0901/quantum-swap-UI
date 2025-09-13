"use client";
import { Container, Flex, Heading, Grid, GridItem, Box, Text } from "@chakra-ui/react";
import { YourLiquidityComponent } from "@/components/YourLiquidityComponent";
import { AddLiquidityComponent } from "@/components/AddLiquidityComponent";

export default function PoolPage() {
  return (
    <Container maxW="container.xl" py={8}>
      <Heading size="lg" mb={6}>Pool</Heading>
      <Grid templateColumns={{ base: "1fr", lg: "1.2fr 1fr" }} gap={8} alignItems="start">
        <GridItem order={{ base: 2, lg: 1 }}>
          <Box borderWidth="1px" borderColor="cardBorder" rounded="xl" p={4} bg="cardBg" boxShadow="card">
            <Text fontWeight="semibold" mb={3}>Your Positions</Text>
            <YourLiquidityComponent />
          </Box>
        </GridItem>
        <GridItem order={{ base: 1, lg: 2 }} display="flex" justifyContent={{ base: "center", lg: "flex-end" }}>
          <AddLiquidityComponent />
        </GridItem>
      </Grid>
    </Container>
  );
}


