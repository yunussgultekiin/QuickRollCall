import { Box } from "@mui/material";
import React from "react";

const MASK_MARGIN = 0.08;

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  aspectRatio?: number;
}

export default function VideoPreview({ videoRef, aspectRatio = 3 / 4 }: Props) {
  return (
    <Box sx={{ position: "relative", width: "100%", aspectRatio, bgcolor: "black", borderRadius: 2, overflow: "hidden" }}>
      <video ref={videoRef} playsInline muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      <OverlayMask />
    </Box>
  );
}

function OverlayMask() {
  return (
    <Box aria-hidden sx={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <Box
        sx={{
          position: "absolute",
          top: MASK_MARGIN,
          left: MASK_MARGIN,
          right: MASK_MARGIN,
          bottom: MASK_MARGIN,
          borderRadius: 2,
          boxShadow: "0 0 0 9999px rgba(0,0,0,0.35)",
          backdropFilter: "blur(3px)",
          border: "2px solid rgba(255,255,255,0.5)",
        }}
      />
    </Box>
  );
}
