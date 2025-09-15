"use client";

import { Box } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";

// ... (các keyframes giữ nguyên, không cần thay đổi)
const subtlePulseEnlarged = keyframes`
  0%, 100% { transform: scale(1.2); }
  50% { transform: scale(1.13); }
`;
const gentleSway = keyframes`
  0%, 100% { transform: translateX(-3%); }
  50% { transform: translateX(3%); }
`;
const pulsingGlow = keyframes`
  0% { transform: scale(0.9); opacity: 0.7; }
  50% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(0.9); opacity: 0.7; }
`;

type Props = {
  size?: { base: number; md: number };
};

export function HeroPlanet({ size = { base: 300, md: 420 } }: Props) {
  const GRADIENT_SPHERE = "radial-gradient(circle at 70% 30%, #00FFC2, #0052FF 70%)";
  const GRADIENT_RING = "linear-gradient(to top right, #00C4A8, #4FD2FF)";
  const GRADIENT_GLOW = "radial-gradient(circle, rgba(0, 255, 194, 0.3) 0%, rgba(0, 255, 194, 0) 70%)";

  return (
    <Box 
      position="relative" 
      width="100%"
      style={{ aspectRatio: "1 / 1", maxWidth: `${size.md}px` }}
    >
      {/* LỚP TỎA SÁNG MỀM MẠI (GIỮ NGUYÊN) */}
      <Box
        position="absolute"
        inset="-10%"
        animation={`${pulsingGlow} 6s ease-in-out infinite`}
        style={{
          backgroundImage: GRADIENT_GLOW,
          borderRadius: '50%',
        }}
      />

      {/* LỚP QUẢ CẦU (SPHERE) */}
      <Box
        position="absolute"
        inset={0}
        animation={`${subtlePulseEnlarged} 7s ease-in-out infinite`}
        style={{
          backgroundImage: GRADIENT_SPHERE,
          maskImage: "url('/black-sphere.svg')",
          maskRepeat: "no-repeat",
          maskSize: "contain",
          maskPosition: "center",
          WebkitMaskImage: "url('/black-sphere.svg')",
          WebkitMaskRepeat: "no-repeat",
          WebkitMaskSize: "contain",
          WebkitMaskPosition: "center",
          // === THAY ĐỔI TẠI ĐÂY ===
          // Thêm một drop-shadow màu sáng (xanh ngọc) để tạo viền sáng
          filter: 
            "drop-shadow(0 0 15px rgba(0, 255, 194, 0.7)) " + // <-- VIỀN SÁNG MỚI
            "drop-shadow(0 0 8px rgba(200, 255, 255, 0.4)) " +
            "drop-shadow(0 0 25px rgba(0, 209, 178, 0.3))",
        }}
      />
      
      {/* LỚP VÒNG NGOÀI (RING) */}
      <Box
        position="absolute"
        inset={0}
        animation={`${gentleSway} 10s ease-in-out infinite`}
        style={{
          backgroundImage: GRADIENT_RING,
          maskImage: "url('/black-sphere-outer-rim.svg')",
          maskRepeat: "no-repeat",
          maskSize: "contain",
          maskPosition: "center",
          WebkitMaskImage: "url('/black-sphere-outer-rim.svg')",
          WebkitMaskRepeat: "no-repeat",
          WebkitMaskSize: "contain",
          WebkitMaskPosition: "center",
          opacity: 0.95,
        }}
      />
    </Box>
  );
}