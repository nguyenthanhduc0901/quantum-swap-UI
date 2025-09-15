"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Flex,
  Image,
  Input,
  Text,
  VStack,
  HStack,
  IconButton,
} from "@chakra-ui/react";
import { FaEthereum, FaCoins } from "react-icons/fa";
import { FiPlus, FiMinus } from "react-icons/fi";
import { Balance } from "./Balance";
import type { TokenInfo } from "@/constants/tokens";

type Props = {
  label: string;
  token: TokenInfo | null;
  amount: string;
  onAmountChange: (value: string) => void;
  onTokenSelect: () => void;
  refreshKey?: number;
  onSetMax?: () => void;
  // Giả sử có thêm prop này để hiển thị giá trị USD
  usdValue?: string; 
  step?: number;
};

// Hàm getIconForSymbol không thay đổi
function getIconForSymbol(symbol?: string) {
  const s = symbol?.toUpperCase();
  if (s === "ETH" || s === "WETH") return FaEthereum;
  if (s === "USDC" || s === "USDT" || s === "DAI") return FaCoins;
  return FaCoins;
}

export function TokenInput({
  label,
  token,
  amount,
  onAmountChange,
  onTokenSelect,
  refreshKey,
  onSetMax,
  usdValue = "0.00", // Giá trị mặc định
  step = 1,
}: Props) {
  const [imgFailed, setImgFailed] = useState(false);
  useEffect(() => { setImgFailed(false); }, [token?.logoURI, token?.symbol]);

  function toNumber(value: string): number {
    const n = parseFloat(value || "0");
    return Number.isFinite(n) ? n : 0;
  }

  function formatAmount(n: number): string {
    const d = Math.min(token?.decimals ?? 6, 6);
    return n.toFixed(d).replace(/\.0+$|\.(?=\d*[^0])/g, (m) => (m === "." ? "." : ""));
  }

  function handleInc() {
    const next = Math.max(0, toNumber(amount) + step);
    onAmountChange(formatAmount(next));
  }

  function handleDec() {
    const next = Math.max(0, toNumber(amount) - step);
    onAmountChange(formatAmount(next));
  }

  return (
    <Flex
      direction="column"
      gap={4}
      p={4}
      rounded="xl"
      // Áp dụng nền kính mờ
      bg="rgba(15, 25, 40, 0.6)" // Một màu nền hơi khác để tạo độ sâu
      backdropFilter="blur(12px)"
      border="1px solid"
      borderColor="rgba(255, 255, 255, 0.05)"
      // Hiệu ứng viền phát sáng khi focus vào input bên trong
      transition="border-color 0.2s ease-in-out"
      _focusWithin={{
        borderColor: "#00FFC2",
      }}
    >
      {/* Hàng trên: Label, Balance, và nút MAX */}
      <Flex justify="space-between" align="center">
        <Text fontSize="md" color="whiteAlpha.700" fontWeight="medium">
          {label}
        </Text>
        <Flex align="center" gap={3}>
          {token && (
            <Balance
              key={`${token.address}-${refreshKey ?? 0}`}
              tokenAddress={token.address}
              // Cập nhật màu chữ cho Balance
              textColor="whiteAlpha.600"
            />
          )}
          {onSetMax && (
            <Button
              size="xs"
              variant="ghost"
              color="brand.400"
              _hover={{ color: "brand.200", bg: "transparent" }}
              fontWeight="bold"
              onClick={onSetMax}
            >
              MAX
            </Button>
          )}
        </Flex>
      </Flex>

      {/* Hàng dưới: Nút chọn Token và Input số lượng */}
      <Flex align="center" gap={3}>
        {/* Nút chọn Token */}
        <Button
          onClick={onTokenSelect}
          bg="blackAlpha.400"
          _hover={{ bg: "blackAlpha.500" }}
          rounded="xl"
          p={2}
          h="auto" // Chiều cao tự động
        >
          <Flex align="center" gap={2}>
            {token?.logoURI && !imgFailed ? (
              <Image
                src={token.logoURI}
                alt={token.symbol}
                boxSize="24px" // Tăng kích thước
                rounded="full"
                onError={() => setImgFailed(true)}
              />
            ) : (
              <Box
                as={getIconForSymbol(token?.symbol)}
                boxSize="24px"
                color="whiteAlpha.800"
              />
            )}
            <Text fontSize="lg" fontWeight="semibold" color="white">
              {token?.symbol ?? "Select Token"}
            </Text>
          </Flex>
        </Button>
        
        {/* Input và giá trị USD */}
        <VStack flex="1" align="stretch" gap={1}>
          <Flex align="center" gap={2}>
            <Input
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
              placeholder="0.0"
              inputMode="decimal"
              type="text"
              variant="flushed"
              fontSize="3xl"
              fontWeight="medium"
              color="white"
              textAlign="right"
              _placeholder={{ color: "whiteAlpha.400" }}
              flex="1"
            />
            <HStack gap={1}>
              <IconButton
                aria-label="Decrease"
                size="sm"
                h="28px"
                w="28px"
                rounded="full"
                bg="blackAlpha.300"
                border="1px solid"
                borderColor="rgba(255,255,255,0.08)"
                _hover={{ bg: "blackAlpha.400" }}
                onClick={handleDec}
              >
                <Box as={FiMinus} color="whiteAlpha.800" />
              </IconButton>
              <IconButton
                aria-label="Increase"
                size="sm"
                h="28px"
                w="28px"
                rounded="full"
                bgGradient="linear(to-r, #0052FF, #00D1B2)"
                _hover={{ filter: "brightness(1.05)" }}
                onClick={handleInc}
              >
                <Box as={FiPlus} color="white" />
              </IconButton>
            </HStack>
          </Flex>
          <Text fontSize="sm" color="whiteAlpha.600" textAlign="right">
            ${usdValue}
          </Text>
        </VStack>
      </Flex>
    </Flex>
  );
}