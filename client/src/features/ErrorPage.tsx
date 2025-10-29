import {
  Box,
  Button,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, type ReactNode } from "react";
import { useAppDispatch } from "../store/hooks";
import { setError } from "../store/uiSlice";

interface ErrorLocationState {
  code?: number;
  message?: string;
}

export default function ErrorPage() {
  const location = useLocation();
  const state = location.state as ErrorLocationState | null;
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const code: number = state?.code || 500;
  const rawMessage: string | undefined = state?.message;
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  useEffect(() => { dispatch(setError(null)); }, [dispatch]);

  const { title, subtitle } = getCopy(code, rawMessage);

  return (
    <Container
      maxWidth="xl"
      disableGutters
      sx={{
        flex: "1 1 auto",
        px: { xs: 1.5, sm: 2.5, md: 3.5 },
        py: { xs: 4, md: 0 },
        minHeight: { xs: "auto", md: "100%" },
        display: "flex",
        alignItems: { xs: "flex-start", md: "center" },
        justifyContent: "center",
      }}
    >
      <Stack spacing={{ xs: 2, md: 2.8 }} sx={{ width: "100%", maxWidth: 640, alignItems: "center", textAlign: "center" }}>
        <Typography
          variant="overline"
          sx={{ letterSpacing: 2, fontWeight: 700, color: "primary.main" }}
        >
          Something went wrong
        </Typography>

        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            lineHeight: 1.08,
            fontSize: { xs: "2.1rem", md: "2.6rem" },
            background: isDark
              ? `linear-gradient(90deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`
              : `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {title}
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ maxWidth: 540 }}
        >
          {subtitle}
        </Typography>

        <HintPill>
          {code === 403 && "Your signed-in account does not have owner authority. Try again with the owner link."}
          {code === 404 && "The link may be invalid or your session may have expired. Request a new link."}
          {code === 429 && "You've made too many requests in a short time. Wait a bit and try again."}
          {!([403,404,429] as number[]).includes(code) && "This might be a temporary issue. Please refresh and try again."}
        </HintPill>

  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ pt: 0.5 }}>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate("/", { replace: true })}
          >
            Back to Home
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate(0)}
          >
            Try Again
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}

function getCopy(code: number, raw?: string) {
  switch (code) {
    case 403:
      return {
        title: raw || "Access denied",
        subtitle:
          "This page can only be opened with the owner's link. Use the secure instructor link provided when the session is started.",
      };
    case 404:
      return {
        title: raw || "We can’t find that",
        subtitle:
          "The resource you are looking for could not be found. The link may be outdated or the session may be closed.",
      };
    case 410:
      return {
        title: raw || "This link has expired",
        subtitle:
          "The source has been removed or expired. Request a new link if necessary.",
      };
    case 423:
      return {
        title: raw || "Resource locked",
        subtitle:
          "This resource is currently locked. Try again after a while or contact the owner.",
      };
    case 429:
      return {
        title: raw || "Too many attempts",
        subtitle:
          "Too many requests have been received. Please wait a short time and try again.",
      };
    default:
      return {
        title: raw || "Unexpected error",
        subtitle:
          "An unexpected error occurred. Please refresh the page or try again later.",
      };
  }
}

function HintPill({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        mt: 1,
        display: "inline-flex",
        alignItems: "center",
        gap: 1,
        borderRadius: 999,
        px: 1.5,
        py: 0.75,
        fontSize: 13,
        color: "text.secondary",
        backgroundColor: (theme) =>
          alpha(
            theme.palette.primary.main,
            theme.palette.mode === "dark" ? 0.16 : 0.1
          ),
        border: (theme) =>
          `1px solid ${alpha(
            theme.palette.primary.main,
            theme.palette.mode === "dark" ? 0.28 : 0.18
          )}`,
      }}
    >
      • {children}
    </Box>
  );
}
