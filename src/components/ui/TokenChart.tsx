"use client";

import { useState } from "react";
import { Box, Button, Flex, HStack, Text, VStack, useToken } from "@chakra-ui/react";

// Simple chart implementation without external dependencies
type Props = {
  data: { time: number; value: number }[];
  height?: number;
  tokenPair?: string;
};

type TimeRange = "1H" | "24H" | "1W" | "1M" | "ALL";

export function TokenChart({ data, height = 280, tokenPair = "WETH/USDC" }: Props) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>("24H");
  const [brandColor] = useToken('colors', ['brand.500']);
  
  // Calculate min, max values for scaling
  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue;
  
  // Get a subset of data points to display based on screen space
  const displayPoints = data.length > 100 ? data.filter((_, i) => i % Math.ceil(data.length / 100) === 0) : data;
  
  // Determine if price trend is positive
  const startPrice = data[0]?.value || 0;
  const endPrice = data[data.length - 1]?.value || 0;
  const priceChange = endPrice - startPrice;
  const trendColor = priceChange >= 0 ? brandColor : 'red.500';
  
  const handleRangeChange = (range: TimeRange) => {
    setSelectedRange(range);
    // In a real app, this would fetch new data based on the time range
  };

  // Create SVG path for the chart line
  const svgWidth = 1000; // SVG coordinate system width
  const svgHeight = 300;  // SVG coordinate system height
  
  const getX = (index: number) => (index / (displayPoints.length - 1)) * svgWidth;
  const getY = (value: number) => svgHeight - ((value - minValue) / range) * (svgHeight * 0.9);
  
  let pathD = '';
  
  if (displayPoints.length > 0) {
    pathD = `M ${getX(0)} ${getY(displayPoints[0].value)}`;
    
    for (let i = 1; i < displayPoints.length; i++) {
      pathD += ` L ${getX(i)} ${getY(displayPoints[i].value)}`;
    }
    
    // Add path to bottom corners to create area effect
    pathD += ` L ${svgWidth} ${svgHeight} L 0 ${svgHeight} Z`;
  }

  // Format timestamps for display
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };
  
  // Display price with appropriate decimal places
  const formatPrice = (value: number) => {
    return value.toLocaleString(undefined, { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <VStack gap={4} align="stretch">
      <HStack gap={2} justify="center" mb={2}>
        {(['1H', '24H', '1W', '1M', 'ALL'] as TimeRange[]).map((range) => (
          <Button 
            key={range}
            size="sm"
            colorScheme={selectedRange === range ? 'brand' : 'gray'}
            variant={selectedRange === range ? 'solid' : 'outline'}
            onClick={() => handleRangeChange(range)}
          >
            {range}
          </Button>
        ))}
      </HStack>
      
      {/* Price indicators */}
      <Flex justify="space-between" px={2}>
        <Text fontSize="sm" color="gray.500">Min: ${formatPrice(minValue)}</Text>
        <Text fontSize="sm" color="gray.500">Max: ${formatPrice(maxValue)}</Text>
      </Flex>
      
      {/* SVG Chart */}
      <Box 
        position="relative" 
        height={`${height}px`}
        width="100%"
        overflow="hidden"
        borderRadius="md"
      >
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map((ratio, i) => (
            <line
              key={i}
              x1="0"
              y1={svgHeight * ratio}
              x2={svgWidth}
              y2={svgHeight * ratio}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
            />
          ))}
          
          {/* Main chart path */}
          <path
            d={pathD}
            fill={`${trendColor}20`}
            stroke={trendColor}
            strokeWidth="2"
          />
        </svg>
        
        {/* Price labels */}
        <Box position="absolute" top={2} right={2} bg="blackAlpha.700" px={2} py={1} borderRadius="md">
          <Text 
            fontSize="sm" 
            fontWeight="bold" 
            color={priceChange >= 0 ? "green.300" : "red.300"}
          >
            {priceChange >= 0 ? "+" : ""}{((priceChange / startPrice) * 100).toFixed(2)}%
          </Text>
        </Box>
      </Box>
      
      {/* Time markers */}
      <Flex justify="space-between" px={2} mt={-2}>
        {displayPoints.length > 0 && (
          <>
            <Text fontSize="xs" color="gray.500">{formatDate(displayPoints[0].time)} {formatTime(displayPoints[0].time)}</Text>
            {displayPoints.length > 2 && (
              <Text fontSize="xs" color="gray.500">{formatDate(displayPoints[Math.floor(displayPoints.length/2)].time)}</Text>
            )}
            <Text fontSize="xs" color="gray.500">{formatDate(displayPoints[displayPoints.length-1].time)} {formatTime(displayPoints[displayPoints.length-1].time)}</Text>
          </>
        )}
      </Flex>
    </VStack>
  );
}


