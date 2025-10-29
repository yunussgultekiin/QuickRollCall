import { Box, Card, CardContent, Container, Stack, Typography } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { QRBox } from "./QRBox";
import { SessionInfo } from "./SessionInfo";
import { SessionActions } from "./SessionActions";
import { useCountdown } from "../../hooks/useCountdown";
import { useSessionData } from "../../hooks/useSessionData";
import { useMemo, useEffect, useRef } from "react";
import { hasOwnerToken } from "../../services/api";

export default function SessionPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { session, qrDataUrl, error, closeSession } = useSessionData(sessionId);
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const surfaceBg = alpha(isDark ? theme.appColors.leftBg : "#ffffff", isDark ? 0.88 : 0.98);
  const surfaceBorder = alpha(theme.palette.primary.main, isDark ? 0.34 : 0.18);
  const surfaceShadow = isDark
    ? `0 32px 90px -50px ${alpha("#000", 0.8)}`
    : `0 30px 80px -45px ${alpha(theme.palette.primary.main, 0.35)}`;

  // Memoize to avoid new object each render -> prevents useCountdown effect restart loop
  const countdownInput = useMemo(() => {
    if (!session) return undefined;
    if (session.endTime && session.serverNow) {
      return { endTimeMs: session.endTime, serverNowMs: session.serverNow } as const;
    }
    const endEpoch = session.closedAt ?? (session.createdAt + (session.durationMinutes ?? 0) * 60_000);
    return { endTimeIso: new Date(endEpoch).toISOString() } as const;
  }, [session]);

  const remaining = useCountdown(countdownInput);

  const redirectedRef = useRef(false);
  useEffect(() => {
    if (redirectedRef.current || !error) return;
      if (error.status === 403) {
        redirectedRef.current = true;
        navigate('/error', { replace: true, state: { code: 403 } });
        return;
      }
      if (error.status === 404) {
        redirectedRef.current = true;
        navigate('/error', { replace: true, state: { code: 404 } });
        return;
      }
    }, [error, navigate]);

  useEffect(() => {
    if (redirectedRef.current) return;
    if (!session && sessionId && !hasOwnerToken(sessionId)) {
      redirectedRef.current = true;
      navigate('/error', { replace: true, state: { code: 403 } });
    }
  }, [session, sessionId, navigate]);

  if (error && (error.status === 403 || error.status === 404)) {
    return null;
  }

  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Typography color="error">{error.message}</Typography>
      </Container>
    );
  }

  if (!session) {
    return (
      <Container sx={{ py: 4 }}>
        <Typography>Loading session…</Typography>
      </Container>
    );
  }

  return (
    <Container
      maxWidth="xl"
      disableGutters
      sx={{
        flex: "1 1 auto",
        px: { xs: 1.5, sm: 2.5, md: 3.5 },
        py: { xs: 3.5, md: 0.5 },
        display: "flex",
        flexDirection: "column",
        justifyContent: { xs: "flex-start", md: "center" },
        minHeight: { xs: "auto", md: "100%" },
      }}
    >
      <Stack
        spacing={{ xs: 3, md: 4 }}
        sx={{ flex: "1 1 auto", minHeight: { xs: "auto", md: 0 }, justifyContent: { xs: "flex-start", md: "center" } }}
      >
        <SessionInfo name={session.name} remaining={session.isActive ? remaining : 0} />
        <Box
          sx={{
            display: "grid",
            gap: { xs: 2.5, md: 3.5 },
            alignItems: "stretch",
            gridTemplateColumns: {
              xs: "1fr",
              md: "minmax(320px, 0.45fr) minmax(0, 1fr)",
            },
          }}
        >
          <Card
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 3,
                border: `1px solid ${surfaceBorder}`,
                backgroundColor: surfaceBg,
                boxShadow: surfaceShadow,
                minHeight: 260,
              }}
              aria-label="QR code area"
            >
              <CardContent sx={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Share this QR with attendees
                </Typography>
                {qrDataUrl ? (
                  <QRBox value={qrDataUrl} />
                ) : (
                  <Typography variant="body2">Generating QR…</Typography>
                )}
                <Typography variant="caption" color="text.secondary" textAlign="center">
                  The code updates automatically as the session status changes.
                </Typography>
              </CardContent>
            </Card>
          <Card
              sx={{
                height: "100%",
                borderRadius: 3,
                border: `1px solid ${surfaceBorder}`,
                backgroundColor: surfaceBg,
                boxShadow: surfaceShadow,
                display: "flex",
                flexDirection: "column",
              }}
              aria-label="Session controls"
            >
              <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Manage session
                </Typography>
                {sessionId && (
                  <SessionActions
                    sessionId={sessionId}
                    closeSession={closeSession}
                    isActive={session.isActive}
                  />
                )}
                <Typography variant="body2" color="text.secondary">
                  Share the owner link to collaborate with trusted assistants. Export attendance whenever you’re ready – we’ll package a PDF instantly.
                </Typography>
              </CardContent>
            </Card>
        </Box>
      </Stack>
    </Container>
  );
}

