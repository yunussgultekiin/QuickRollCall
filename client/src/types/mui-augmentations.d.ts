import "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Theme {
    appColors: {
      leftBg: string;
      rightBg: string;
      dashColor: string;
    };
  }
  interface ThemeOptions {
    appColors?: {
      leftBg?: string;
      rightBg?: string;
      dashColor?: string;
    };
  }
}

export {};
