import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Alert,
  Slide,
  Divider,
  Typography,
  Stack,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import { useQrScanner } from "../../hooks/useQrScanner";
import VideoPreview from "./VideoPreview";
import { forwardRef, type ReactElement } from "react";
import type { TransitionProps } from "@mui/material/transitions";

const Transition = forwardRef(function Transition(
  props: TransitionProps & { children: ReactElement },
  ref
) {
  return <Slide direction="up" ref={ref} {...props} />;
});
type Props = {
  open: boolean;
  onClose: () => void;
  onResult: (text: string) => void;
};

const ASPECT_RATIO = 3 / 4;

export default function QRScannerDialog({ open, onClose, onResult }: Props) {
  const theme = useTheme();
  const { videoRef, error, usingFallback } = useQrScanner({
    active: open,
    onResult: (text) => {
      onResult(text);
      onClose();
    },
    aspectRatio: ASPECT_RATIO,
  });

  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      open={open}
      TransitionComponent={Transition}
      onClose={onClose}
      aria-labelledby="qr-title"
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: alpha(theme.palette.mode === "dark" ? "#02090c" : "#031b28", 0.84),
            backdropFilter: "blur(6px)",
          },
        },
      }}
      PaperProps={{
        sx: {
          borderRadius: 4,
          border: `1px solid ${alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.35 : 0.18)}`,
          background: `linear-gradient(160deg, ${alpha(theme.palette.primary.light, 0.08)} 0%, ${alpha(theme.appColors.rightBg, 0.96)} 100%)`,
          boxShadow: theme.palette.mode === "dark"
            ? `0 40px 120px -60px ${alpha("#000", 0.9)}`
            : `0 42px 120px -68px ${alpha(theme.palette.primary.main, 0.55)}`,
        },
      }}
    >
      <DialogTitle
        id="qr-title"
        sx={{
          pr: 7,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Stack spacing={0.5}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Open camera & scan
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Align the code within the frame. We’ll verify it instantly.
          </Typography>
        </Stack>
        <IconButton
          onClick={onClose}
          sx={{
            color: theme.palette.text.primary,
            backgroundColor: alpha(theme.palette.primary.main, 0.08),
            '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.16) },
          }}
          aria-label="Close"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Divider sx={{ opacity: 0.2 }} />

      <DialogContent sx={{ pt: 3, pb: 3 }}>
        <Stack spacing={2.5}>
          {error && (
            <Alert severity="error" variant="outlined">
              {error}
            </Alert>
          )}
          {usingFallback && !error && (
            <Alert severity="info" variant="outlined">
              Scanning with built-in camera
            </Alert>
          )}

          <VideoPreview videoRef={videoRef} aspectRatio={ASPECT_RATIO} />

          <Box
            sx={{
              display: "grid",
              gap: 1,
              gridTemplateColumns: { xs: "1fr", sm: "auto 1fr" },
              alignItems: { xs: "stretch", sm: "center" },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                color: theme.palette.text.secondary,
                fontSize: 13,
              }}
            >
              • QR must match this rollout • Camera stays local
            </Box>
            <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
              <Button onClick={onClose} variant="outlined" color="inherit">
                Cancel
              </Button>
            </Box>
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
