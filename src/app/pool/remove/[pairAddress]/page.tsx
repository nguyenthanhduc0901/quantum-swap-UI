/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React from "react";
import {
  Container,
  Flex,
  VStack,
  Heading,
  Text,
  Link as ChakraLink,
  Button,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { FiArrowLeft } from "react-icons/fi"; // Icon quay lại
import { RemoveLiquidityComponent } from "../../../../components/RemoveLiquidityComponent";

type PageProps = { params: Promise<{ pairAddress: `0x${string}` }> };

export default function RemoveLiquidityPage({ params }: PageProps) {
  const resolved = React.use(params);
  const pairAddress = resolved?.pairAddress ?? "0x0000000000000000000000000000000000000000";

  return (
    <Container maxW="container.lg" py={{ base: 8, md: 12 }}>
      <VStack align="stretch" gap={8}>
        {/* === THÊM MỚI: HEADER CỦA TRANG === */}
        <VStack align="flex-start" gap={4}>
          {/* Nút quay lại để cải thiện điều hướng */}
          <ChakraLink
            as={NextLink}
            href="/pool"
            display="inline-flex"
            alignItems="center"
            gap={2}
            color="brand.300"
            _hover={{ textDecoration: "none", color: "brand.200" }}
          >
            <FiArrowLeft />
            Back to All Positions
          </ChakraLink>

          {/* Tiêu đề và mô tả của trang */}
          <Heading as="h1" size="2xl" color="whiteAlpha.900">
            Manage Liquidity
          </Heading>
          <Text color="whiteAlpha.600">
            Review your position details and withdraw your tokens from the pool.
          </Text>
        </VStack>

        {/* Phần nội dung chính */}
        <Flex justify="center">
          {/* Component này đã được thiết kế đẹp, chỉ cần đặt nó vào đúng vị trí */}
          {/* Loại bỏ prop onClose vì nút "Back" đã xử lý việc điều hướng */}
          <RemoveLiquidityComponent pairAddress={pairAddress as `0x${string}`} />
        </Flex>
      </VStack>
    </Container>
  );
}