import { Box, Button, Typography, Stack } from "@mui/material";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

export default function AttendErrorPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const state = (location.state as any) || {};
  const message = state.message || "An error occurred.";

  const handleRetry = () => {
    const sid = state.sessionId || sessionId;
    const token = state.token;
    if (sid && token) {
      navigate(`/attend/${encodeURIComponent(sid)}?token=${encodeURIComponent(token)}`, { replace: true });
      return;
    }
    if (sid) {
      navigate(`/attend/${encodeURIComponent(sid)}`, { replace: true });
      return;
    }
    navigate('/', { state: { openScanner: true }, replace: true });
  };

  return (
    <Box
      sx={{
        flex: '1 1 auto',
        minHeight: { xs: 'auto', md: '100%' },
        display: 'flex',
        alignItems: { xs: 'stretch', md: 'center' },
        justifyContent: 'center',
        p: { xs: 3, md: 3.5 },
        width: '100%',
      }}
    >
      <Stack spacing={3} sx={{ maxWidth: 560, textAlign: 'center' }}>
        <Typography variant="h5" fontWeight={800}>Attendance Error</Typography>
        <Typography color="text.secondary">{message}</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
          <Button variant="contained" onClick={handleRetry} aria-label="Retry validation or rescan QR">Retry</Button>
          <Button variant="outlined" component={Link} to="/" aria-label="Back to home">Home</Button>
          <Button variant="text" component={Link} to="/" state={{ openScanner: true }} aria-label="Open scanner to scan another QR">Scan Again</Button>
        </Stack>
      </Stack>
    </Box>
  );
}
