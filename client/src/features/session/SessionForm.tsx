import { Box, Button, Stack, TextField } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useForm } from "react-hook-form";

export type SessionFormValues = { name: string; duration: number };


export function SessionForm({ onSubmit }: { onSubmit: (values: SessionFormValues) => void }) {
  const theme = useTheme();
  const placeholderColor = theme.palette.mode === "dark" ? "#a3c7cf" : "#b0bcc7";
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SessionFormValues>({
    defaultValues: { name: "", duration: undefined as unknown as number },
  });

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={2.5}>
        <TextField
          label="Session name"
          placeholder="e.g. Morning lecture"
          fullWidth
          size="medium"
          InputProps={{ sx: { "& input::placeholder": { color: placeholderColor, opacity: 1 } } }}
          {...register("name", { required: "Required" })}
          error={!!errors.name}
          helperText={errors.name?.message}
        />
        <TextField
          type="number"
          label="Duration (minutes)"
          placeholder="45"
          fullWidth
          size="medium"
          inputProps={{ min: 1 }}
          InputProps={{ sx: { "& input::placeholder": { color: placeholderColor, opacity: 1 } } }}
          {...register("duration", { required: "Required", min: { value: 1, message: "Must be > 0" } })}
          error={!!errors.duration}
          helperText={errors.duration?.message}
        />
        <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create session"}
        </Button>
      </Stack>
    </Box>
  );
}