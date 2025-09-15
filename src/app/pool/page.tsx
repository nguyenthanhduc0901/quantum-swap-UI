"use client";
import { Container, Grid, GridItem, Heading, Text, VStack } from "@chakra-ui/react";
import { YourLiquidityComponent } from "@/components/YourLiquidityComponent";
import { AddLiquidityComponent } from "@/components/AddLiquidityComponent";

export default function PoolPage() {
  return (
    <Container maxW="container.xl" py={{ base: 8, md: 12 }}>
      <VStack align="stretch" gap={{ base: 8, md: 10 }}>
        {/* 1. Header của trang được thiết kế lại */}
        <VStack align="flex-start" gap={2}>
          <Heading as="h1" size="2xl" color="whiteAlpha.900">
            Liquidity Pool
          </Heading>
          <Text color="whiteAlpha.600">
            Provide liquidity to earn fees, or manage your existing positions.
          </Text>
        </VStack>

        {/* 2. Grid được giữ nguyên nhưng nội dung bên trong được tinh chỉnh */}
        <Grid
          templateColumns={{ base: "1fr", lg: "1.2fr 1fr" }}
          gap={{ base: 8, md: 12 }} // Tăng khoảng cách
          alignItems="start"
        >
          {/* Cột bên trái: Danh sách vị thế */}
          <GridItem order={{ base: 2, lg: 1 }}>
            {/* 3. Loại bỏ Box wrapper không cần thiết */}
            {/* YourLiquidityComponent đã có style riêng, tự nó là một card */}
            <YourLiquidityComponent />
          </GridItem>

          {/* Cột bên phải: Thêm thanh khoản */}
          <GridItem order={{ base: 1, lg: 2 }}>
            {/* AddLiquidityComponent cũng đã có style riêng */}
            <AddLiquidityComponent />
          </GridItem>
        </Grid>
      </VStack>
    </Container>
  );
}