import { createTheme, alpha, lighten, darken } from "@mui/material/styles";
import type { PaletteMode, Components, Theme } from "@mui/material";
import type { Mode } from "../store/themeSlice";

const TOKENS = {
  primary: "#0f4c5c",
  dark: {
    leftBg: "#0a1e26",
    rightBg: "#06171f",
    primary: "#4fb3bf",
  },
  light: {
    leftBgLightenFactor: 0.88,
    rightBgLightenFactor: 0.94,
    primary: "#ffffff",
  },
};

type AppColors = {
  leftBg: string;
  rightBg: string;
  dashColor: string;
};

function getAppColors(mode: PaletteMode): AppColors {
  if (mode === "dark") {
    return {
      leftBg: TOKENS.dark.leftBg,
      rightBg: TOKENS.dark.rightBg,
      dashColor: alpha("#ffffff", 0.3),
    };
  }

  return {
    leftBg: lighten(TOKENS.primary, TOKENS.light.leftBgLightenFactor),
    rightBg: lighten(TOKENS.primary, TOKENS.light.rightBgLightenFactor),
    dashColor: alpha(TOKENS.primary, 0.4),
  };
}

function getComponents(mode: PaletteMode): Components<Theme> {
  const isDark = mode === "dark";
  const darkPrimary = TOKENS.dark.primary;
  const primary = TOKENS.primary;

  return {
    MuiCssBaseline: {
      styleOverrides: {
        body: () => ({
          colorScheme: isDark ? "dark" : "light",
        }),
      },
    },
    MuiAppBar: {
      styleOverrides: {
        colorDefault: () => ({
          backgroundColor: isDark ? TOKENS.dark.leftBg : darken(primary, 0.08),
          color: isDark ? undefined : "#f4fbfc",
          borderBottom: isDark ? `1px solid ${alpha("#ffffff", 0.08)}` : undefined,
          boxShadow: isDark ? "0 2px 10px rgba(0,0,0,0.25)" : undefined,
        }),
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none" as const,
          fontWeight: 600,
        },
        containedPrimary: {
          backgroundColor: isDark ? darkPrimary : primary,
          "&:hover": {
            backgroundColor: isDark
              ? darken(darkPrimary, 0.2)
              : darken(primary, 0.2),
          },
        },
        outlined: {
          borderWidth: 2,
          "&:hover": { borderWidth: 2 },
        },
        outlinedPrimary: {
          color: isDark ? "#ffffff" : darken(primary, 0.1),
          borderColor: isDark ? alpha("#ffffff", 0.5) : alpha(primary, 0.4),
          "&:hover": {
            borderColor: isDark ? "#ffffff" : darken(primary, 0.1),
            backgroundColor: isDark ? alpha("#ffffff", 0.08) : alpha(primary, 0.08),
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: () => ({
          borderRadius: 16,
          border: isDark ? `1px solid ${alpha("#ffffff", 0.1)}` : undefined,
          boxShadow: isDark ? "0 8px 24px rgba(0,0,0,0.35)" : undefined,
        }),
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: () => ({
          backgroundColor: isDark ? alpha("#ffffff", 0.03) : undefined,
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: isDark ? alpha("#ffffff", 0.3) : undefined,
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: isDark ? alpha("#ffffff", 0.5) : undefined,
          },
        }),
        notchedOutline: () => ({
          borderColor: isDark ? alpha("#ffffff", 0.2) : undefined,
        }),
        input: () => ({
          "::placeholder": {
            color: isDark ? alpha("#ffffff", 0.55) : "#b0bcc7",
            opacity: 1,
          },
        }),
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: () => ({
          backgroundColor: isDark ? alpha("#ffffff", 0.05) : undefined,
        }),
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: () => ({
          "&:hover": {
            backgroundColor: isDark ? alpha("#ffffff", 0.07) : alpha(TOKENS.primary, 0.02),
          },
          "&:not(:last-child) td, &:not(:last-child) th": {
            borderBottomColor: isDark ? alpha("#ffffff", 0.15) : undefined,
          },
        }),
      },
    },
    MuiLink: {
      styleOverrides: {
        root: () => ({
          color: isDark ? lighten(darkPrimary, 0.25) : darken(primary, 0.1),
          textDecorationColor: isDark ? alpha(lighten(darkPrimary, 0.25), 0.5) : undefined,
          "&:hover": {
            color: isDark ? lighten(darkPrimary, 0.4) : undefined,
          },
        }),
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: () => ({
          borderColor: isDark ? alpha("#ffffff", 0.2) : alpha(TOKENS.primary, 0.25),
        }),
      },
    },
  };
}

export function makeTheme(mode: Mode = "light") {
  const paletteMode = mode as PaletteMode;
  const isDark = paletteMode === "dark";

  const appColors = getAppColors(paletteMode);

  const theme = createTheme({
    palette: {
      mode: paletteMode,
      primary: {
        main: isDark ? TOKENS.dark.primary : TOKENS.primary,
        dark: isDark ? darken(TOKENS.dark.primary, 0.2) : darken(TOKENS.primary, 0.2),
        light: isDark ? lighten(TOKENS.dark.primary, 0.2) : lighten(TOKENS.primary, 0.2),
        contrastText: "#f1fbfd",
      },
      background: {
        default: isDark ? TOKENS.dark.rightBg : appColors.rightBg,
        // Paper surfaces should be white-ish in light mode for better contrast with text and borders
        paper: isDark ? TOKENS.dark.leftBg : "#ffffff",
      },
      text: isDark
        ? { primary: "#e3f2f4", secondary: "#9fbfc5" }
        : { primary: "#15262d", secondary: "#4a6670" },
      divider: isDark ? alpha("#ffffff", 0.18) : alpha(TOKENS.primary, 0.22),
    },
    appColors,
    components: getComponents(paletteMode),
  });

  return theme;
}
