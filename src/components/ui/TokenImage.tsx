"use client";

import { Box, Image } from "@chakra-ui/react";
import { useState } from "react";

export function TokenImage({ src, alt, boxSize = "22px", rounded = "full" }: { src?: string; alt?: string; boxSize?: string; rounded?: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <Box boxSize={boxSize} rounded={rounded} bg="whiteAlpha.300" />;
  return <Image src={src} alt={alt} boxSize={boxSize} rounded={rounded} onError={() => setFailed(true)} />;
}


