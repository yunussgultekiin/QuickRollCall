import { DataGrid } from "@mui/x-data-grid";
import { Box } from "@mui/material";

interface SessionRow {
  id: string | number;
  name: string;
  createdAt: string; 
}

export function SessionTable({ rows }: { rows: SessionRow[] }) {
  return (
    <Box sx={{ height: 400 }}>
      <DataGrid
        rows={rows}
        columns={[
          { field: "id", headerName: "ID", flex: 1 },
          { field: "name", headerName: "Name", flex: 2 },
          { field: "createdAt", headerName: "Created", flex: 2 },
        ]}
        pageSizeOptions={[5, 10]}
      />
    </Box>
  );
}