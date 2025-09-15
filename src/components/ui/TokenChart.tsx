"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Flex,
  HStack,
  Text,
  VStack,
  Heading,
  useToken, // Lấy token màu an toàn theo hệ Chakra hiện tại
} from "@chakra-ui/react";

type Props = {
  data: { time: number; value: number }[];
  height?: number;
  tokenPair?: string;
};

type TimeRange = "1H" | "24H" | "1W" | "1M" | "ALL";

// Gradient nhất quán
const BRAND_GRADIENT = "linear(to-tr, #0052FF, #00D1B2)";

export function TokenChart({
  data,
  height = 280,
  tokenPair = "WETH/USDC",
}: Props) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>("24H");
  const [green300, red400] = useToken("colors", ["green.300", "red.400"]);

  // --- LOGIC TÍNH TOÁN (Giữ nguyên) ---
  const values = data.map((d) => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue;

  const displayPoints = data.length > 100 ? data.filter((_, i) => i % Math.ceil(data.length / 100) === 0) : data;

  const startPrice = data[0]?.value || 0;
  const endPrice = data[data.length - 1]?.value || 0;
  const priceChange = endPrice - startPrice;
  const isPositiveTrend = priceChange >= 0;

  // Chọn màu sắc phù hợp với theme
  const trendColor = isPositiveTrend ? green300 : red400;
  const strokeColor = isPositiveTrend ? "#00D1B2" : red400;

  const handleRangeChange = (range: TimeRange) => {
    setSelectedRange(range);
  };
  
  // --- LOGIC SVG (Giữ nguyên) ---
  const svgWidth = 1000;
  const svgHeight = 300;
  const gradientId = "chart-gradient";

  const getX = (index: number) => (index / (displayPoints.length - 1)) * svgWidth;
  const getY = (value: number) => svgHeight - ((value - minValue) / range) * (svgHeight * 0.9);

  const pathD = displayPoints.length > 1
    ? `M ${getX(0)} ${getY(displayPoints[0].value)} ` +
      displayPoints.slice(1).map((p, i) => `L ${getX(i + 1)} ${getY(p.value)}`).join(' ')
    : '';

  const areaPathD = pathD + ` L ${svgWidth} ${svgHeight} L 0 ${svgHeight} Z`;

  // --- LOGIC FORMAT (Giữ nguyên) ---
  const formatTime = (timestamp: number) => new Date(timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatDate = (timestamp: number) => new Date(timestamp * 1000).toLocaleDateString([], { month: 'short', day: 'numeric' });
  const formatPrice = (value: number) => value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <VStack
      gap={4}
      align="stretch"
      p={{ base: 4, md: 6 }}
      rounded="2xl"
      bg="rgba(23, 35, 53, 0.5)"
      backdropFilter="blur(10px)"
      border="1px solid"
      borderColor="rgba(255, 255, 255, 0.05)"
    >
      {/* Header của biểu đồ */}
      <Flex justify="space-between" align="baseline">
        <Text fontSize="lg" fontWeight="medium" color="whiteAlpha.800">
          {tokenPair}
        </Text>
        <VStack align="flex-end" gap={0}>
          <Heading size="md" color="white">
            ${formatPrice(endPrice)}
          </Heading>
          <Text fontSize="sm" fontWeight="medium" color={trendColor}>
            {isPositiveTrend ? "+" : ""}
            {formatPrice(priceChange)} (
            {((priceChange / startPrice) * 100).toFixed(2)}%)
          </Text>
        </VStack>
      </Flex>

      {/* Các nút chọn khoảng thời gian */}
      <HStack gap={2} justify="center">
        {(["1H", "24H", "1W", "1M", "ALL"] as TimeRange[]).map((range) => (
          <Button
            key={range}
            size="sm"
            rounded="lg"
            onClick={() => handleRangeChange(range)}
            // Áp dụng style glassmorphism
            {...(selectedRange === range
              ? {
                  bgGradient: BRAND_GRADIENT,
                  color: "white",
                  boxShadow: "0 0 10px rgba(0, 209, 178, 0.3)",
                }
              : {
                  variant: "ghost",
                  color: "whiteAlpha.600",
                  _hover: { bg: "whiteAlpha.100" },
                })}
          >
            {range}
          </Button>
        ))}
      </HStack>

      {/* Biểu đồ SVG */}
      <Box position="relative" height={`${height}px`} width="100%">
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="none"
        >
          {/* Định nghĩa Gradient cho vùng tô màu */}
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={0.25} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          
          {/* Đường kẻ ngang */}
          {[0.25, 0.5, 0.75].map((ratio, i) => (
            <line key={i} x1="0" y1={svgHeight * ratio} x2={svgWidth} y2={svgHeight * ratio} stroke="rgba(255,255,255,0.08)" strokeWidth="2" strokeDasharray="4 8" />
          ))}

          {/* Vùng tô màu dưới đường line */}
          <path d={areaPathD} fill={`url(#${gradientId})`} />

          {/* Đường line chính của biểu đồ */}
          <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
        </svg>

        {/* Nhãn giá trị Min/Max */}
        <Text position="absolute" top={2} left={4} fontSize="xs" color="whiteAlpha.600">Max: ${formatPrice(maxValue)}</Text>
        <Text position="absolute" bottom={2} left={4} fontSize="xs" color="whiteAlpha.600">Min: ${formatPrice(minValue)}</Text>
      </Box>

      {/* Các mốc thời gian */}
      <Flex justify="space-between" px={2} mt={-2}>
        {displayPoints.length > 0 && (
          <>
            <Text fontSize="xs" color="whiteAlpha.600">{formatDate(displayPoints[0].time)} {formatTime(displayPoints[0].time)}</Text>
            <Text fontSize="xs" color="whiteAlpha.600">{formatDate(displayPoints[displayPoints.length - 1].time)} {formatTime(displayPoints[displayPoints.length - 1].time)}</Text>
          </>
        )}
      </Flex>
    </VStack>
  );
}