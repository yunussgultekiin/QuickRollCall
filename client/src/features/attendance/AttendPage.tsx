import { Box, Card, CardContent, Typography, Divider, CircularProgress, Fade, Container, Stack } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { useToken } from "../../hooks/useToken";
import { useSessionValidation } from "../../hooks/useSessionValidation";
import { attendanceApi } from "../../services/api";
import { getAttendanceErrorMessage } from "./messages";
import { ErrorReasons, type ErrorReason } from "../../types/errors";
import { lazy, Suspense } from 'react';
const AttendForm = lazy(() => import('./AttendForm').then(m => ({ default: m.AttendForm })));
import { useEffect, useState, useRef } from "react";

export default function AttendPage() {
  const { sessionId } = useParams();
  const token = useToken();
  const location = useLocation(); 
  const navigate = useNavigate();
  const { validated, sessionName, error } = useSessionValidation(sessionId, token);

  useEffect(() => {
    const shouldMint = !!sessionId && !token;
    if (!shouldMint) return;
    (async () => {
      try {
        const res = await attendanceApi.mintToken(sessionId!);
        const newUrl = `${location.pathname}?token=${encodeURIComponent(res.token)}`;
        navigate(newUrl, { replace: true });
      } catch (e: any) {
        const msg = e?.response?.data?.message || 'Could not issue token';
        navigate('error', { state: { reason: 'TOKEN_INVALID', message: msg, sessionId }, replace: true });
      }
    })();
  }, [sessionId, token]);

  const theme = useTheme();
  const leftBg = theme.appColors.leftBg;
  const rightBg = theme.appColors.rightBg;
  const primary = theme.palette.primary.main;
  const isDark = theme.palette.mode === "dark";
  const cardBg = alpha(isDark ? leftBg : "#ffffff", isDark ? 0.9 : 0.98);
  const cardBorder = alpha(primary, isDark ? 0.35 : 0.18);
  const overlayColor = alpha(isDark ? "#0d1a21" : "#f2fafb", isDark ? 0.65 : 0.75);

  const [submitting, setSubmitting] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselTimer = useRef<number | null>(null);
  const carouselMessages = [
    "Submitting your attendance…",
    "Stamping the virtual roll…",
    "Securing your token…",
    "Almost done…",
  ];

  useEffect(() => {
    if (error) {
      navigate("error", { state: { ...error, sessionId, token }, replace: true });
    }
  }, [error, navigate, sessionId, token]);

  const validating = !error && !validated; 

  useEffect(() => {
    if (submitting) {
      carouselTimer.current = window.setInterval(() => {
        setCarouselIndex((i) => (i + 1) % carouselMessages.length);
      }, 1800);
    } else if (carouselTimer.current) {
      clearInterval(carouselTimer.current);
      carouselTimer.current = null;
      setCarouselIndex(0);
    }
    return () => {
      if (carouselTimer.current) clearInterval(carouselTimer.current);
    };
  }, [submitting]);

  const onSubmit = async (values: any) => {
    if (!sessionId || !token || submitting) return;
    setSubmitting(true);
    try {
      await attendanceApi.submit(sessionId, { token, ...values });
      const currentPath = location.pathname.replace(/\/error$/, '').replace(/\/success$/, ''); 
      navigate(`${currentPath}/success`, { 
        replace: true, 
        state: { 
          sessionName: sessionName,
          token: token 
        } 
      });
    } catch (err: any) {
      const status = err?.response?.status as number | undefined;
      const rawReason = err?.response?.data?.reason as string | undefined;
      const knownReason = (Object.values(ErrorReasons) as string[]).includes(rawReason ?? '')
        ? (rawReason as ErrorReason)
        : undefined;
      const derivedReason: ErrorReason | undefined = knownReason || (status === 429 ? ErrorReasons.RATE_LIMIT : undefined);
      const message = getAttendanceErrorMessage(derivedReason, status);
      navigate("error", { replace: true, state: { reason: derivedReason ?? "ERROR", message, sessionId, token } });
    } finally {
      setSubmitting(false);
    }
  };

  if (validating) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress aria-label="Validating..." />
      </Box>
    );
  }

  if (error) {
    // Navigation effect should normally handle, but return minimal fallback to avoid blank screen during transition
    return null;
  }

  return (
    <Container
      maxWidth="md"
      sx={{
        flex: "1 1 auto",
        px: { xs: 1, sm: 2.5 },
        py: { xs: 3, md: 0 },
        display: "flex",
        flexDirection: "column",
        justifyContent: { xs: "flex-start", md: "center" },
        minHeight: { xs: "auto", md: "100%" },
      }}
    >
      <Box
        component="main"
        sx={{
          flex: "1 1 auto",
          display: "flex",
          justifyContent: { xs: "flex-start", md: "center" },
          alignItems: { xs: "stretch", md: "center" },
          minHeight: { xs: "auto", md: "100%" },
        }}
      >
        <Card
          sx={{
            width: "100%",
            borderRadius: 3,
            border: `1px solid ${cardBorder}`,
            boxShadow: isDark
              ? `0 30px 80px -40px ${alpha("#000", 0.85)}`
              : `0 26px 70px -45px ${alpha(primary, 0.45)}`,
            background: `linear-gradient(150deg, ${alpha(primary, 0.12)} 0%, ${cardBg} 45%, ${alpha(rightBg, 0.98)} 100%)`,
          }}
        >
          <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="overline" sx={{ letterSpacing: 1.6, fontWeight: 700, color: alpha(primary, 0.85) }}>
                  Attendance check-in
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {sessionName || "Active session"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Verified QR scanned • Token secured for this device
                </Typography>
              </Box>

              <Box sx={{ position: "relative", borderRadius: 2, border: `1px solid ${alpha(primary, 0.12)}`, backgroundColor: alpha(leftBg, isDark ? 0.82 : 0.92), p: { xs: 2.2, md: 2.8 } }}>
                <Suspense fallback={<Box sx={{ py: 4, textAlign: 'center' }}><CircularProgress size={28} /></Box>}>
                  <AttendForm onSubmit={onSubmit} isSubmitting={submitting} />
                </Suspense>
                {submitting && (
                  <Box
                    aria-label="Submission progress"
                    role="status"
                    sx={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: overlayColor,
                      borderRadius: 2,
                      p: 2,
                      textAlign: "center",
                    }}
                  >
                    <CircularProgress size={40} sx={{ mb: 2 }} />
                    {carouselMessages.map((m, idx) => (
                      <Fade key={idx} in={carouselIndex === idx} timeout={400} unmountOnExit>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {m}
                        </Typography>
                      </Fade>
                    ))}
                  </Box>
                )}
              </Box>

              <Divider />
              <Typography variant="body2">
                <Link to="/">Back to Home</Link>
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}