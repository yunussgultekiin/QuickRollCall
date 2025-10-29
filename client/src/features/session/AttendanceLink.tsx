import { TextField, IconButton, Tooltip } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

export function AttendanceLink({ attendUrl }: { attendUrl: string | null }) {
  return (
    <TextField
      value={attendUrl ?? "Generating..."}
      InputProps={{
        readOnly: true,
        endAdornment: (
          <Tooltip title="Copy">
            <IconButton
              aria-label="Copy attend link"
              onClick={() => attendUrl && navigator.clipboard.writeText(attendUrl)}
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
      }}
    />
  );
}