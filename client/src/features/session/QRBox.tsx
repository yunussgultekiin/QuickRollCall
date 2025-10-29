  import { Box } from "@mui/material";

  export function QRBox({ value }: { value: string }) {
    return (
      <Box
        sx={{
          p: 2,
          bgcolor: "background.paper",
          borderRadius: 2,
          display: "inline-block",
        }}
      >
        <img
          src={value}
          alt="Session attendance QR code. Scan with the participant device to open the attendance form."
          width={180}
          height={180}
        />
      </Box>
    );
  }
