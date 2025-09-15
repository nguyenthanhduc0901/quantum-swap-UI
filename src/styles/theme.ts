import { createSystem, defaultConfig } from "@chakra-ui/react";

export const system = createSystem(defaultConfig, {
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: "#e8faff" },
          100: { value: "#c9f3ff" },
          200: { value: "#a6eaff" },
          300: { value: "#7fdfff" },
          400: { value: "#4fd2ff" },
          500: { value: "#0aa4ff" }, // cyan primary
          600: { value: "#19e3a1" }, // teal secondary (for gradients)
          700: { value: "#0fb27d" },
          800: { value: "#0a7f59" },
          900: { value: "#074c36" },
        },
      },
      radii: {
        xl: { value: "16px" },
        card: { value: "16px" },
      },
      shadows: {
        card: { value: "0 14px 40px rgba(3, 10, 24, 0.45)" },
      },
    },
    semanticTokens: {
      colors: {
        bg: { value: { _light: "#F7F8FA", _dark: "#0b1220" } },
        fg: { value: { _light: "#1A202C", _dark: "whiteAlpha.900" } },
        workspaceBg: { value: { _light: "transparent", _dark: "rgba(255,255,255,0.02)" } },
        cardBg: { value: { _light: "#FFFFFF", _dark: "rgba(255,255,255,0.06)" } },
        cardBorder: { value: { _light: "gray.200", _dark: "whiteAlpha.200" } },
        panelBg: { value: { _light: "#FFFFFF", _dark: "rgba(255,255,255,0.06)" } },
        panelBorder: { value: { _light: "gray.200", _dark: "whiteAlpha.200" } },
      },
    },
  }
});

export default system;

