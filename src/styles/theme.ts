import { createSystem, defaultConfig } from "@chakra-ui/react";

export const system = createSystem(defaultConfig, {
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: "#e0f7fa" },
          100: { value: "#b2ebf2" },
          200: { value: "#80deea" },
          300: { value: "#4dd0e1" },
          400: { value: "#26c6da" },
          500: { value: "#00bcd4" },
          600: { value: "#00acc1" },
          700: { value: "#0097a7" },
          800: { value: "#006064" },
          900: { value: "#004d40" },
        },
      },
      radii: {
        xl: { value: "16px" },
        card: { value: "16px" },
      },
      shadows: {
        card: { value: "0 8px 24px rgba(0, 0, 0, 0.35)" },
      },
    },
    semanticTokens: {
      colors: {
        bg: { value: { _light: "gray.50", _dark: "#0b1020" } },
        fg: { value: { _light: "gray.900", _dark: "whiteAlpha.900" } },
        workspaceBg: { value: { _light: "gray.50", _dark: "rgba(255,255,255,0.02)" } },
        cardBg: { value: { _light: "white", _dark: "rgba(255,255,255,0.06)" } },
        cardBorder: { value: { _light: "gray.200", _dark: "whiteAlpha.200" } },
        panelBg: { value: { _light: "white", _dark: "rgba(255,255,255,0.06)" } },
        panelBorder: { value: { _light: "gray.200", _dark: "whiteAlpha.200" } },
      },
    },
  },
  config: {
    initialColorMode: "dark"
  }
});

export default system;


