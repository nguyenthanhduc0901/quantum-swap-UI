"use client";

import { Box } from "@chakra-ui/react";

type Props = {
  width?: string | number;
  height?: string | number;
};

export function GradientLogo({ width = 20, height = 20 }: Props) {
  // THAY ĐỔI DÒNG NÀY:
  // Hướng từ góc trái dưới lên góc trên phải (to top right)
  // Xanh dương chỉ chiếm một phần nhỏ ở đầu (ví dụ: 10%), 
  // và chuyển sang xanh ngọc sớm hơn (ví dụ: tại 80%)
  const GRADIENT = "linear-gradient(to top right, #0052FF 10%, #00FFC2 80%)";

  return (
    <Box position="relative" width={width} height={height}>
      <Box
        position="absolute"
        inset={0}
        style={{
          backgroundImage: GRADIENT,
          WebkitMaskImage: "url('/logo-quantum.svg')",
          WebkitMaskRepeat: "no-repeat",
          WebkitMaskSize: "contain",
          WebkitMaskPosition: "left center",
          maskImage: "url('/logo-quantum.svg')",
          maskRepeat: "no-repeat",
          maskSize: "contain",
          maskPosition: "left center",
          filter: "drop-shadow(0 0 10px rgba(0, 209, 178, 0.35)) drop-shadow(0 0 10px rgba(0, 82, 255, 0.25))",
          opacity: 0.9,
        }}
      />
      <Box
        aria-label="QuantumSwap"
        role="img"
        position="absolute"
        inset={0}
        style={{
          backgroundImage: GRADIENT,
          WebkitMaskImage: "url('/logo-quantum.svg')",
          WebkitMaskRepeat: "no-repeat",
          WebkitMaskSize: "contain",
          WebkitMaskPosition: "left center",
          maskImage: "url('/logo-quantum.svg')",
          maskRepeat: "no-repeat",
          maskSize: "contain",
          maskPosition: "left center",
        }}
      />
    </Box>
  );
}