"use client";
import { useState } from "react";
import { Container, Grid, GridItem, Heading, Text, VStack, Tabs } from "@chakra-ui/react";
import { PoolsTable } from "../../components/PoolsTable";
import { YourLiquidityComponent } from "@/components/YourLiquidityComponent";
import { AddLiquidityComponent } from "@/components/AddLiquidityComponent";

export default function PoolPage() {
  const [tab, setTab] = useState("my");
  const GRAD = "linear-gradient(90deg, #0052FF 0%, #00D1B2 100%)";
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
            <Tabs.Root value={tab} onValueChange={(d: any) => setTab(String(d.value || d))}>
              <Tabs.List style={{ marginBottom: 20, display: 'flex', gap: 8, border: 'none', borderBottom: 'none', boxShadow: 'none' }}>
                <Tabs.Trigger
                  value="my"
                  style={{
                    borderRadius: 9999,
                    padding: '8px 16px',
                    backgroundImage: tab === 'my' ? GRAD : 'none',
                    color: tab === 'my' ? '#fff' : 'rgba(255,255,255,0.95)',
                    border: tab === 'my' ? 'none' : '1px solid rgba(255,255,255,0.25)',
                    boxShadow: tab === 'my' ? '0 6px 16px rgba(0, 209, 178, 0.25)' : 'none',
                  }}
                >
                  My Positions
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="all"
                  style={{
                    borderRadius: 9999,
                    padding: '8px 16px',
                    backgroundImage: tab === 'all' ? GRAD : 'none',
                    color: tab === 'all' ? '#fff' : 'rgba(255,255,255,0.95)',
                    border: tab === 'all' ? 'none' : '1px solid rgba(255,255,255,0.25)',
                    boxShadow: tab === 'all' ? '0 6px 16px rgba(0, 209, 178, 0.25)' : 'none',
                  }}
                >
                  All Pools
                </Tabs.Trigger>
              </Tabs.List>
              <Tabs.Content value="my">
                <YourLiquidityComponent />
              </Tabs.Content>
              <Tabs.Content value="all">
                <PoolsTable />
              </Tabs.Content>
            </Tabs.Root>
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