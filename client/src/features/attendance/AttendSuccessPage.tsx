import { Box, Button, Typography, Stack } from "@mui/material";
import { Link, useLocation } from "react-router-dom";

export default function AttendSuccessPage() {
  const location = useLocation();
  const state = (location.state as any) || {};
  const sessionName = state.sessionName as string | undefined;
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
      <Stack spacing={2} sx={{ maxWidth: 560, textAlign: 'center' }}>
        <Typography variant="h5" fontWeight={800}>Attendance Submitted</Typography>
        {sessionName && <Typography color="text.secondary">Session: <strong>{sessionName}</strong></Typography>}
        <Typography color="text.secondary">Thank you! Your attendance has been recorded.</Typography>
        <Button variant="contained" component={Link} to="/">Return Home</Button>
      </Stack>
    </Box>
  );
}
