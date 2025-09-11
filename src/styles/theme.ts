import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
  initialColorMode: "dark",
  useSystemColorMode: false,
};

const styles = {
  global: {
    body: {
      bg: "gray.900",
      color: "whiteAlpha.900",
    },
  },
};

const colors = {
  brand: {
    50: "#e0f7fa",
    100: "#b2ebf2",
    200: "#80deea",
    300: "#4dd0e1",
    400: "#26c6da",
    500: "#00bcd4",
    600: "#00acc1",
    700: "#0097a7",
    800: "#006064",
    900: "#004d40",
  },
};

export const theme = extendTheme({ config, styles, colors });

export default theme;


