import { Box, Typography } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import { formatRemaining } from "../../services/time";

export function SessionInfo({ name, remaining }: { name?: string; remaining: number | null }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const accent = alpha(theme.palette.primary.main, 0.18);
  const badgeBg = alpha(theme.palette.primary.main, isDark ? 0.2 : 0.14);
  const badgeColor = isDark ? "#e3f2f4" : theme.palette.primary.dark;
  const formatted = formatRemaining(remaining);
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        justifyContent: "space-between",
        alignItems: { xs: "flex-start", md: "center" },
        gap: { xs: 2, md: 3 },
        borderRadius: 3,
        border: `1px solid ${accent}`,
        backgroundColor: alpha(theme.appColors.leftBg, theme.palette.mode === "dark" ? 0.55 : 0.1),
        px: { xs: 2.2, md: 3.2 },
        py: { xs: 1.8, md: 2.2 },
      }}
    >
      <Box>
        <Typography variant="overline" sx={{ letterSpacing: 1.6, fontWeight: 700, color: theme.palette.primary.main }}>
          Instructor dashboard
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
          {name || "Untitled session"}
        </Typography>
      </Box>
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 1,
          alignSelf: { xs: "flex-start", md: "center" },
          backgroundColor: badgeBg,
          color: badgeColor,
          px: 2,
          py: 1,
          borderRadius: 999,
          fontWeight: 600,
          fontSize: 15,
          boxShadow: isDark ? `0 10px 24px -18px ${alpha("#000", 0.8)}` : `0 12px 24px -18px ${alpha(theme.palette.primary.main, 0.4)}`,
        }}
      >
        <AccessTimeRoundedIcon sx={{ fontSize: 18 }} />
        <span>{formatted}</span>
      </Box>
    </Box>
  );
}