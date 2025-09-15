"use client";

import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";

type Props = {
  icon: React.ElementType;
  title: string;
  children: ReactNode;
};

// Gradient nhất quán với thương hiệu
const BRAND_GRADIENT = "linear(to-tr, #0052FF, #00D1B2)";

export function FeatureCard({ icon: Icon, title, children }: Props) {
  return (
    <Box
      // Thêm role="group" để điều khiển hiệu ứng con khi hover vào cha
      role="group"
      suppressHydrationWarning
      position="relative"
      p="1.5rem" // Padding
      rounded="2xl" // Bo góc tròn hơn
      overflow="hidden" // Rất quan trọng để hiệu ứng glow không tràn ra ngoài
      transition="transform 0.3s ease"
      _hover={{
        transform: "translateY(-8px)", // Hiệu ứng nhấc lên rõ hơn
      }}
      // Nền kính mờ (Glassmorphism)
      bg="rgba(23, 35, 53, 0.5)" // Màu nền xanh đậm, bán trong suốt
      backdropFilter="blur(10px)" // Hiệu ứng làm mờ nền phía sau
      border="1px solid rgba(255, 255, 255, 0.05)" // Thêm viền mờ để tăng độ sắc nét
    >
      {/* 
        HIỆU ỨNG GLOW KHI HOVER
        - Nằm ở lớp dưới cùng (zIndex={-1})
        - Mặc định ẩn (opacity: 0)
        - Hiện ra khi hover vào component cha (_groupHover)
      */}
      <Box
        suppressHydrationWarning
        position="absolute"
        zIndex={-1}
        inset={0}
        opacity={0}
        transition="opacity 0.4s ease-in-out"
        _groupHover={{
          opacity: 1,
        }}
        // Vầng sáng bao quanh card
        _after={{
          content: '""',
          position: 'absolute',
          inset: '-2px',
          rounded: '2xl',
          bgGradient: BRAND_GRADIENT,
          filter: 'blur(18px)',
        }}
      />
      
      {/* NỘI DUNG CARD */}
      <Flex direction="column" align="center" textAlign="center" gap={4}>
        <Flex
          w={16}
          h={16}
          align="center"
          justify="center"
          rounded="full"
          bgGradient={BRAND_GRADIENT}
          boxShadow="0 0 20px rgba(0, 209, 178, 0.3)" // Thêm bóng mờ cho icon
        >
          <Box as={Icon} boxSize={8} color="white" />
        </Flex>
        
        <Heading size="md" color="white">
          {title}
        </Heading>
        
        <Text color="gray.400" // Màu chữ phụ sáng hơn, dễ đọc trên nền tối
        >
          {children}
        </Text>
      </Flex>
    </Box>
  );
}