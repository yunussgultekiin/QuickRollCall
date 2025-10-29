import { Box, Button, Card, CardContent, CardHeader, Stack, Typography } from "@mui/material";
import { useSnackbar } from 'notistack';
import { useCallback, useState } from "react";
import { useQrScanner } from "../../hooks/useQrScanner";
import VideoPreview from "./VideoPreview";
import config from "../../services/config";


type Props = {
  title?: string;
  aspectRatio?: number;
};

const DEFAULT_ASPECT = 3 / 4;

export default function QRScannerPanel({ title = "Scan QR to Attend", aspectRatio = DEFAULT_ASPECT }: Props) {
  const [active, setActive] = useState(true);
  const { enqueueSnackbar } = useSnackbar();

  const onResult = useCallback((text: string) => {
    try{
      const scannedUrl = new URL(text);
      const appUrl = new URL(config.appBaseUrl)
      if(scannedUrl.hostname === appUrl.hostname) {
          window.location.href = scannedUrl.toString();
      }else{
        enqueueSnackbar(`A QR code from a different site was read. It was not redirected for security reasons.`, { variant: 'warning' });
        navigator.clipboard?.writeText(text).catch(() => {});
      }
    } catch{
      navigator.clipboard?.writeText(text).catch(() => {});
      enqueueSnackbar(`Scanned text copied: ${text}`, { variant: 'info' });
    }
  }, [enqueueSnackbar]);

  const { videoRef, error, isSupported, start, stop } = useQrScanner({ active, onResult, aspectRatio });

  const controls = (
    <Stack direction="row" spacing={1} justifyContent="flex-end">
      {active ? (
        <Button size="small" onClick={() => { setActive(false); stop(); }}>Pause</Button>
      ) : (
        <Button size="small" variant="contained" onClick={() => { setActive(true); start(); }}>Resume</Button>
      )}
    </Stack>
  );

  return (
    <Card sx={{ height: "100%" }}>
      <CardHeader title={title} action={controls} />
      <CardContent>
        {!isSupported && (
          <Typography color="error" sx={{ mb: 2 }}>
            Barcode scanning is not supported in this browser.
          </Typography>
        )}
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        <VideoPreview videoRef={videoRef} aspectRatio={aspectRatio} />
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Position the QR code within the frame.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
