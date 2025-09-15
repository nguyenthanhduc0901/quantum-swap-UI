"use client";

import { Button, type ButtonProps } from "@chakra-ui/react";
import NextLink from "next/link";

type Props = ButtonProps & { href?: string; hoverOnly?: boolean };

export function GradientButton(props: Props) {
  const { children, hoverOnly, ...rest } = props;
  const GRADIENT = "linear-gradient(90deg, #0052FF 0%, #00D1B2 100%)";
  return (
    <Button
      variant="plain"
      // Shape & visuals
      rounded="full"
      border="none"
      color="white"
      bg={hoverOnly ? "transparent" : GRADIENT}
      backgroundImage={hoverOnly ? undefined : GRADIENT}
      // Spacing & typography
      px={8}
      py={3}
      fontSize="1.1rem"
      fontWeight={700}
      // Effects
      boxShadow={hoverOnly ? "none" : "0 6px 16px rgba(0, 209, 178, 0.25)"}
      transition="all 0.2s ease-in-out"
      _hover={{
        bg: GRADIENT,
        backgroundImage: GRADIENT,
        color: "white",
        transform: "translateY(-2px)",
        boxShadow: "0 8px 20px rgba(0, 209, 178, 0.30)",
      }}
      _active={{ transform: "translateY(0)", boxShadow: "0 4px 10px rgba(0, 209, 178, 0.20)" }}
      _focusVisible={{ boxShadow: "0 0 0 0" }}
      as={props.href ? (NextLink as any) : undefined}
      href={props.href as any}
      {...rest}
    >
      {children}
    </Button>
  );
}


