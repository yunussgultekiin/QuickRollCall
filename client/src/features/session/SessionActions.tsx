import { Button, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAppDispatch } from "../../store/hooks";
import { showSnackbar } from "../../store/uiSlice";

export function SessionActions({
  sessionId,
  closeSession,
  isActive,
}: {
  sessionId: string;
  closeSession: () => void;
  isActive?: boolean;
}) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [exporting, setExporting] = useState(false);
  const [stopping, setStopping] = useState(false);

  const handleStop = async () => {
    if (stopping) return;
    setStopping(true);
    try {
      await closeSession();
    } finally {
      setStopping(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    let closeFailed = false;
    try {
      await closeSession();
    } catch (err: any) {
      closeFailed = true;
      dispatch(
        showSnackbar({
          message: err?.response?.data?.message || "Failed to close session before export. Exporting current data.",
          severity: "warning",
        })
      );
    }
    navigate(`/export/${encodeURIComponent(sessionId)}`);
    if (!closeFailed) {
      dispatch(showSnackbar({ message: "Session closed. Preparing export…", severity: "info" }));
    }
  };

  return (
    <Stack direction="row" spacing={1} flexWrap="wrap">
      <Button
        variant="outlined"
        color="error"
        onClick={handleStop}
        disabled={stopping || !isActive}
        aria-label="Stop session"
      >
        Stop Session
      </Button>
      <Button variant="outlined" onClick={handleExport} disabled={exporting} aria-label="Export session PDF">
        {exporting ? "Preparing..." : "Export"}
      </Button>
    </Stack>
  );
}
