"use client";

import {
  Box,
  Flex,
  Text,
  HStack,
  Heading,
  Icon,
  useDisclosure,
  VStack,
  Image,
} from "@chakra-ui/react";
import { FiChevronDown } from "react-icons/fi"; // Icon mũi tên
import { RemoveLiquidityComponent } from "./RemoveLiquidityComponent";
// Giả sử bạn có component này để hiển thị icon của cặp token
// import { PairIcons } from "./PairIcons"; 

type Props = {
  pairAddress: `0x${string}`;
  token0Symbol?: string;
  token1Symbol?: string;
  // Thêm các prop giả định để hiển thị thông tin hữu ích hơn
  lpBalance?: string;
  positionValue?: string;
  token0Logo?: string;
  token1Logo?: string;
};

export function LiquidityPositionCard({
  pairAddress,
  token0Symbol,
  token1Symbol,
  lpBalance = "1.234 LP",
  positionValue = "",
  token0Logo,
  token1Logo,
}: Props) {
  // Sử dụng useDisclosure thay vì useState cho các trạng thái mở/đóng
  const { open: isOpen, onToggle } = useDisclosure();

  return (
    <Box
      w="full"
      bg="rgba(23, 35, 53, 0.5)"
      backdropFilter="blur(10px)"
      border="1px solid"
      borderColor="rgba(255, 255, 255, 0.05)"
      rounded="2xl" // Bo góc mềm mại hơn
      p={4}
      transition="border-color 0.2s ease"
      _hover={{
        // Hiệu ứng viền phát sáng nhẹ khi hover
        borderColor: isOpen ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 255, 194, 0.2)",
      }}
    >
      {/* Header có thể click để mở/đóng */}
      <Flex
        as="button"
        onClick={onToggle}
        w="full"
        align="center"
        justify="space-between"
        textAlign="left"
      >
        <HStack gap={4}>
          <HStack gap={-2}>
            {token0Logo ? <Image src={token0Logo} alt={token0Symbol} boxSize="28px" rounded="full" /> : <Box boxSize="28px" rounded="full" bg="whiteAlpha.300" />}
            {token1Logo ? <Image src={token1Logo} alt={token1Symbol} boxSize="28px" rounded="full" border="2px solid rgba(0,0,0,0.2)" /> : <Box boxSize="28px" rounded="full" bg="whiteAlpha.300" />}
          </HStack>
          <VStack align="flex-start" gap={0}>
            <Heading size="md" color="whiteAlpha.900">
              {token0Symbol ?? "Token0"} / {token1Symbol ?? "Token1"}
            </Heading>
            <Text fontSize="sm" color="whiteAlpha.600">
              {lpBalance}
            </Text>
          </VStack>
        </HStack>

        <HStack gap={4}>
          {positionValue ? (
            <Heading size="md" color="whiteAlpha.900">{positionValue}</Heading>
          ) : null}
          <Icon
            as={FiChevronDown}
            boxSize={5}
            color="whiteAlpha.600"
            transition="transform 0.2s"
            transform={isOpen ? "rotate(180deg)" : "none"} // Xoay mũi tên khi mở
          />
        </HStack>
      </Flex>

      {/* Phần nội dung có thể gấp/mở */}
      {isOpen && (
        <Box>
          <VStack align="stretch" gap={4} pt={4}>
            <Box h="1px" bg="whiteAlpha.200" />
            <Flex justify="center">
              <RemoveLiquidityComponent
                pairAddress={pairAddress}
                onClose={onToggle} // Truyền hàm onToggle để đóng từ bên trong
              />
            </Flex>
          </VStack>
        </Box>
      )}
    </Box>
  );
}