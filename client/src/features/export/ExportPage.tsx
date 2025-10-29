import { Container, Typography, Card, CardContent, Stack, CircularProgress, Box, Button } from "@mui/material";
import { useParams } from "react-router-dom";
import { http, setOwnerToken, hasOwnerToken } from "../../services/api";
import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";

const iframeStyle = {
  width: '100%',
  height: '100%',
  border: 0
};

export default function ExportPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  const autoLoadedRef = useRef(false);
  useEffect(() => {
    if (!sessionId) return;
    try {
      const params = new URLSearchParams(window.location.search);
      const ownerToken = params.get('ownerToken');
      if (ownerToken) {
        setOwnerToken(sessionId, ownerToken);
        params.delete('ownerToken');
        const query = params.toString();
        const newUrl = window.location.pathname + (query ? ('?' + query) : '');
        window.history.replaceState({}, '', newUrl);
      }
    } catch(e) {
      console.error('There was a problem clearing the URL:', e)
    }
  }, [sessionId]);
  const loadPdf = useCallback(async () => {
    if (!sessionId) return;
    if (autoLoadedRef.current) return;
    if (!hasOwnerToken(sessionId)) {
      navigate('/error', { replace: true, state: { message: 'Owner token missing', code: 403 } });
      return;
    }
    autoLoadedRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const { data } = await http.get(`/export/${encodeURIComponent(sessionId)}/pdf`, { responseType: 'blob', silent: true });
      setObjectUrl(prev => {
        if (prev) { try { URL.revokeObjectURL(prev); } catch(e) {console.error('Failed to revoke previous object URL:',e)} }
        return URL.createObjectURL(data as Blob);
      });
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 403) {
        navigate('/error', { replace: true, state: { code: 403, message: 'Forbidden' } });
        return;
      }
      if (status === 404) {
        navigate('/error', { replace: true, state: { code: 404, message: 'Session not found or purged' } });
        return;
      }
      setError(e?.message || 'Failed to load PDF');
    } finally {
      setLoading(false);
    }
  }, [sessionId, navigate]);

  useEffect(() => { loadPdf(); }, [loadPdf]);
  useEffect(() => () => { if (objectUrl) URL.revokeObjectURL(objectUrl); }, [objectUrl]);

  return (
  <Container
    maxWidth="lg"
    sx={{
      flex: "1 1 auto",
      py: { xs: 3.5, md: 1 },
      px: { xs: 1.5, md: 2.5 },
      display: "flex",
      flexDirection: "column",
      justifyContent: { xs: "flex-start", md: "center" },
      minHeight: { xs: "auto", md: "100%" },
    }}
  >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        spacing={1.5}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography
            variant="overline"
            sx={{
              letterSpacing: 2,
              fontWeight: 700,
              color: "primary.main",
            }}
          >
            Export Tools
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
            Session Export
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="large"
          onClick={() => navigate('/')}
          aria-label="Go to home"
          sx={{
            borderRadius: 999,
            px: 2.5,
          }}
        >
          Home
        </Button>
      </Stack>
      {loading && (
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb:2 }}>
          <CircularProgress size={24} />
          <Typography>Generating PDF…</Typography>
        </Stack>
      )}
      {error && <Typography color="error" sx={{ mb:2 }}>{error}</Typography>}
  <Card sx={{ mb: { xs: 3, md: 4 }, flex: "1 1 auto", minHeight: { xs: "auto", md: 0 }, display: "flex", flexDirection: "column" }}>
        <CardContent sx={{ flex: "1 1 auto", display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
          <Typography variant="subtitle1" sx={{ fontWeight:600, mb:1 }}>PDF Preview</Typography>
          {!objectUrl && !loading && !error && (
            <Typography variant="body2" color="text.secondary">No PDF available.</Typography>
          )}
          {objectUrl && (
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                overflow: 'hidden',
                flex: '1 1 auto',
                height: {
                  xs: 'clamp(240px, 52vh, 460px)',
                  sm: 'clamp(280px, 54vh, 540px)',
                  md: 'clamp(320px, 56vh, 600px)',
                },
                mb: 2,
              }}
            >
              <iframe
                title="Attendance PDF"
                src={objectUrl}
                style={ iframeStyle }
              />
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
