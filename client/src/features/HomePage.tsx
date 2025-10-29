import { Box, Button, Card, CardContent, CardHeader, Container, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useNotifier } from "../hooks/useNotifier";
import config from "../services/config";
import { sessionsApi } from "../services/api";
import { SessionForm, type SessionFormValues } from "./session/SessionForm";

const QRScannerDialog = lazy(() => import("./scanner/QRScannerDialog"));
const HIGHLIGHTS = ["No apps to install", "Live session controls", "Export-ready records"] as const;

export default function HomePage() {
  const theme = useTheme();
  const notify = useNotifier();
  const navigate = useNavigate();
  const location = useLocation();
  const [scannerOpen, setScannerOpen] = useState(false);

  const isDark = theme.palette.mode === "dark";
  const surfaceBg = alpha(isDark ? theme.appColors.leftBg : "#ffffff", isDark ? 0.9 : 0.98);
  const surfaceBorder = alpha(theme.palette.primary.main, isDark ? 0.35 : 0.14);
  const surfaceShadow = isDark
    ? `0 28px 90px -45px ${alpha("#000", 0.85)}`
    : `0 32px 90px -50px ${alpha(theme.palette.primary.main, 0.35)}`;
  const featureAccent = alpha(theme.palette.primary.main, 0.25);
  const featureTextColor = alpha(theme.palette.text.secondary, isDark ? 0.85 : 0.68);

  useEffect(() => {
    const incoming = location.state as { openScanner?: boolean } | null;
    if (incoming?.openScanner) setScannerOpen(true);
  }, [location.state]);

  const handleSubmit = useCallback(async (values: SessionFormValues) => {
    try {
      const data = await sessionsApi.create({ name: values.name, durationMinutes: values.duration });
      notify("Session created", "success");

      if (data?.sessionId) {
        navigate(`/session/${encodeURIComponent(data.sessionId)}`);
        return;
      }

      const fallbackUrl = (data as { instructorUrl?: string })?.instructorUrl;
      if (fallbackUrl) window.location.href = fallbackUrl;
    } catch {
      notify("Failed to create session", "error");
    }
  }, [navigate, notify]);

  const handleQrResult = useCallback((text: string) => {
    try {
      const rawUrl = text.trim();
      const scannedUrl = new URL(rawUrl);

      let appUrl: URL | null = null;
      try {
        appUrl = new URL(config.appBaseUrl);
      } catch {
        /* ignore invalid config at runtime */
      }

      const allowCrossHostDev = import.meta.env.DEV;
      const forceAcceptAll = (import.meta as any).env?.VITE_QR_ACCEPT_ALL_HOSTS === "1";

      const normalizeHost = (host: string) => host.replace(/^www\./i, "").toLowerCase();
      const scannedHost = normalizeHost(scannedUrl.hostname);
      const currentHost = normalizeHost(window.location.hostname);
      const appHost = appUrl ? normalizeHost(appUrl.hostname) : null;
      const isHttpScheme = /^(https?):$/i.test(scannedUrl.protocol);
      const isNgrok = (host: string) => /\.ngrok(-free)?\.app$/i.test(host);

      const pathUuidRegex = /^\/attend\/[0-9a-fA-F-]{8,}(?:\/)?$/;
      const pathOk = pathUuidRegex.test(scannedUrl.pathname);
      const tokenParam = scannedUrl.searchParams.get("token");
      const tokenOk = !tokenParam || /^[0-9a-fA-F]{16,}$/.test(tokenParam);

      const directMatch = Boolean((appHost && scannedHost === appHost) || scannedHost === currentHost);
      const ngrokGroup = isNgrok(scannedHost) && (isNgrok(currentHost) || (appHost && isNgrok(appHost)));

      const accepted =
        forceAcceptAll ||
        (directMatch && isHttpScheme && pathOk && tokenOk) ||
        (ngrokGroup && isHttpScheme && pathOk && tokenOk) ||
        (allowCrossHostDev && isHttpScheme && pathOk && tokenOk);

      if (import.meta.env.DEV) {
        console.debug("[QR DEBUG]", {
          rawUrl,
          scannedHost,
          currentHost,
          appHost,
          isHttpScheme,
          pathOk,
          tokenOk,
          directMatch,
          ngrokGroup,
          forceAcceptAll,
          allowCrossHostDev,
          accepted,
        });
      }

      if (accepted) {
        navigate(scannedUrl.pathname + scannedUrl.search);
        return;
      }

      let cause = "Host mismatch";
      if (!isHttpScheme) cause = "Unsupported scheme";
      else if (!pathOk || !tokenOk) cause = "Invalid attend link structure";

      notify(`QR rejected: ${cause}. Copied to clipboard.`, "warning");
      navigator.clipboard?.writeText(rawUrl).catch(() => {});
    } catch {
      navigator.clipboard?.writeText(text).catch(() => {});
      notify("Scanned content copied to clipboard", "info");
    }
  }, [navigate, notify]);

  return (
    <Container
      maxWidth="xl"
      disableGutters
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignSelf: "center",
        my: "auto",
        px: { xs: 1.5, sm: 2.5, md: 3.5 },
        py: { xs: 2.5, md: 3.5 },
      }}
    >
      <Box
        component="section"
        id="home-overview"
        sx={{
          display: "flex",
          flexDirection: { xs: "column", lg: "row" },
          alignItems: "stretch",
          gap: { xs: 2.75, md: 3.5 },
          flex: "0 1 auto",
          my: "auto",
        }}
      >
        <Stack
          spacing={{ xs: 1.75, md: 2.2 }}
          sx={{
            flex: { xs: "0 0 auto", lg: "0 0 42%" },
            justifyContent: "center",
            maxWidth: { xs: "100%", lg: 520 },
          }}
        >
          <Typography
            variant="overline"
            sx={{ letterSpacing: 2, fontWeight: 700, color: theme.palette.primary.main }}
          >
            Modern roll calls
          </Typography>
          <Typography
            variant="h4"
            sx={{ fontWeight: 800, lineHeight: 1.05, fontSize: { xs: 28, md: 36 } }}
          >
            Launch every session with confidence and zero friction.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500 }}>
            Create secure QR-powered attendance links in under a minute. Share the instructor dashboard, monitor
            check-ins in real time, and export records instantly when class is over.
          </Typography>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={{ xs: 1, sm: 2 }}
            sx={{ color: featureTextColor }}
          >
            {HIGHLIGHTS.map((item) => (
              <Box key={item} sx={{ display: "flex", alignItems: "center", gap: 0.75, fontSize: 13 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: featureAccent }} />
                <Typography variant="body2" sx={{ fontWeight: 500, color: featureTextColor }}>
                  {item}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Stack>

        <Box
          sx={{
            flex: "1 1 auto",
            display: "grid",
            gap: { xs: 2.5, md: 3 },
            gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" },
            alignItems: "stretch",
            alignContent: "center",
            justifyContent: "center",
          }}
        >
          <Card
            id="create-session-card"
            sx={{
              borderRadius: 3,
              border: `1px solid ${surfaceBorder}`,
              boxShadow: surfaceShadow,
              backgroundColor: surfaceBg,
              display: "flex",
              flexDirection: "column",
              minHeight: { xs: 0, md: 0 },
            }}
            aria-labelledby="create-session-title"
          >
            <CardHeader
              id="create-session-title"
              title="Create a new session"
              subheader="Generate a secure instructor link and QR code in seconds."
              sx={{
                pb: 0,
                "& .MuiCardHeader-title": { fontSize: 22, fontWeight: 700 },
                "& .MuiCardHeader-subheader": { color: alpha(theme.palette.text.secondary, 0.85) },
              }}
            />
            <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
              <SessionForm onSubmit={handleSubmit} />
              <Typography variant="caption" color="text.secondary">
                We generate an owner dashboard link for you. Share the attendee QR from that page to start collecting
                check-ins.
              </Typography>
            </CardContent>
          </Card>

          <Card
            sx={{
              borderRadius: 3,
              border: `1px solid ${surfaceBorder}`,
              boxShadow: surfaceShadow,
              background: `linear-gradient(160deg, ${alpha(theme.palette.primary.light, 0.16)} 0%, ${surfaceBg} 45%, ${alpha(theme.appColors.rightBg, 0.9)} 100%)`,
              display: "flex",
              flexDirection: "column",
            }}
            aria-labelledby="scan-qr-title"
          >
            <CardHeader
              id="scan-qr-title"
              title="Capture attendance with one tap"
              subheader="Use any camera-enabled device to authenticate participants via QR."
              sx={{
                pb: 0,
                "& .MuiCardHeader-title": { fontSize: 22, fontWeight: 700 },
                "& .MuiCardHeader-subheader": { color: alpha(theme.palette.text.secondary, 0.85) },
              }}
            />
            <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Stack spacing={1.75} sx={{ flex: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Launch the built-in scanner to verify a session QR. We only open the attendance form when the QR is
                  trusted, which keeps every check-in clean.
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => setScannerOpen(true)}
                    aria-label="Open device camera to scan QR"
                    sx={{ minHeight: 44 }}
                  >
                    Open scanner
                  </Button>
                </Stack>
                <Stack spacing={1.1}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    How it works
                  </Typography>
                  <Stack spacing={0.6}>
                    <Typography variant="body2">1. Create a session and share the QR.</Typography>
                    <Typography variant="body2">2. Attendees scan the code and self-identify.</Typography>
                    <Typography variant="body2">3. Monitor or export records on the owner dashboard.</Typography>
                  </Stack>
                </Stack>
              </Stack>
              <Suspense fallback={null}>
                <QRScannerDialog open={scannerOpen} onClose={() => setScannerOpen(false)} onResult={handleQrResult} />
              </Suspense>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Container>
  );
}
