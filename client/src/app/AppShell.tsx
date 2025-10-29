import {
  Backdrop,
  CircularProgress,
  Snackbar,
  Alert,
  AppBar,
  Toolbar,
  Typography,
  Box,
  Switch,
} from "@mui/material";
import { useTheme, alpha, styled } from "@mui/material/styles";
import { useAppSelector, useAppDispatch } from "../store/hooks.ts";
import { clearSnackbar } from "../store/uiSlice";
import type { PropsWithChildren } from "react";
import { toggleMode } from "../store/themeSlice.ts";

const ModeSwitch = styled(Switch)(({ theme }) => ({
  width: 66,
  height: 38,
  padding: 7,
  '& .MuiSwitch-switchBase': {
    margin: 1,
    padding: 0,
    transform: 'translateX(4px)',
    transition: theme.transitions.create(['transform'], { duration: 200 }),
    '&.Mui-checked': {
      transform: 'translateX(30px)',
      color: '#fff',
      '& .MuiSwitch-thumb:before': {
        content: `'🌙'`,
      },
      '& + .MuiSwitch-track': {
        opacity: 1,
        backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.65 : 0.8),
      },
    },
  },
  '& .MuiSwitch-thumb': {
    backgroundColor: theme.palette.mode === 'dark' ? '#0f2730' : '#ffffff',
    width: 28,
    height: 28,
    boxShadow: theme.shadows[2],
    position: 'relative',
    '&:before': {
      content: `'☀️'`,
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 15,
    },
  },
  '& .MuiSwitch-track': {
    borderRadius: 26,
    opacity: 1,
    background: theme.palette.mode === 'dark'
      ? `linear-gradient(120deg, ${alpha('#08151b', 0.95)} 0%, ${alpha(theme.palette.primary.main, 0.5)} 100%)`
      : `linear-gradient(120deg, ${alpha('#dff5f8', 0.8)} 0%, ${alpha(theme.palette.primary.main, 0.4)} 100%)`,
  },
}));

export default function AppShell({ children }: PropsWithChildren) {
  const { loading, snackbar } = useAppSelector((s) => s.ui);
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { leftBg, rightBg } = theme.appColors;
  const gradient = `radial-gradient(140% 140% at 12% -10%, ${alpha(theme.palette.primary.light, isDark ? 0.24 : 0.32)} 0%, ${alpha(leftBg, isDark ? 0.85 : 0.9)} 40%, ${rightBg} 100%)`;

  const handleToggleMode = () => dispatch(toggleMode());
  const handleCloseSnackbar = () => dispatch(clearSnackbar());

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: gradient,
        transition: "background 240ms ease",
      }}
    >
      <AppBar
        position="sticky"
        color="transparent"
        elevation={0}
        enableColorOnDark
        sx={{
          backdropFilter: "blur(14px)",
          backgroundColor: isDark
            ? alpha(leftBg, 0.65)
            : alpha("#f7fbfc", 0.75),
          borderBottom: `1px solid ${alpha(isDark ? "#ffffff" : theme.palette.primary.dark, isDark ? 0.08 : 0.08)}`,
        }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <Typography
              variant="h5"
              component="span"
              sx={{
                fontWeight: 800,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                fontSize: { xs: "1.12rem", sm: "1.32rem" },
              }}
            >
              Quick
              <Box component="span" sx={{ color: theme.palette.primary.main, ml: 0.75 }}>
                Roll Call
              </Box>
            </Typography>
          </Box>
          <ModeSwitch
            checked={isDark}
            onChange={handleToggleMode}
            inputProps={{ "aria-label": "Toggle dark mode" }}
          />
        </Toolbar>
      </AppBar>
      <Box
        component="main"
        sx={{
          flex: "1 1 auto",
          width: "100%",
          px: { xs: 2, sm: 3, md: 3.5 },
          py: { xs: 3, md: 4.5 },
          display: "flex",
          justifyContent: { xs: "flex-start", md: "center" },
          overflowY: { xs: "auto", md: "hidden" },
          overflowX: "hidden",
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: { xs: "960px", xl: "1240px" },
            display: "flex",
            flexDirection: "column",
            minHeight: { xs: "auto", md: "100%" },
            gap: { xs: 3, md: 0 },
          }}
        >
          {children}
        </Box>
      </Box>

      <Backdrop open={loading} sx={{ color: "#fff", zIndex: (t) => t.zIndex.drawer + 1 }}>
        <CircularProgress color="inherit" />
      </Backdrop>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar?.severity ?? "info"} sx={{ width: "100%" }}>
          {snackbar?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
