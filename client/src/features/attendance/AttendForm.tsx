import { Box, Button, Stack, TextField } from "@mui/material";
import { REGEX } from '../../validation/attendance';
import { useForm, type Path, type RegisterOptions } from "react-hook-form";
import { useEffect } from "react";

export type FormValues = {
  userId: string;
  name: string; 
  surname: string;
  section: string;
};

type FormField = {
  name: Path<FormValues>;
  label: string;
  rules: RegisterOptions<FormValues, Path<FormValues>>;
};

export function AttendForm({ onSubmit, isSubmitting }: {
  onSubmit: (values: FormValues) => void;
  isSubmitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitted, submitCount },
    setFocus,
  } = useForm<FormValues>({
    defaultValues: { userId: "", name: "", surname: "", section: "" },
    shouldFocusError: false,
  });

  useEffect(() => {
    if (!isSubmitted || Object.keys(errors).length === 0) return;
    const order: Path<FormValues>[] = ["userId", "name", "surname", "section"];
    for (const key of order) {
      if (errors[key]) {
        setFocus(key, { shouldSelect: true });
        break;
      }
    }
  }, [errors, isSubmitted, submitCount, setFocus]);

  const fields: FormField[]  = [  
    {
      name: "userId",
      label: "Student ID",
      rules: {
         required: "Required", 
         pattern: { 
          value: REGEX.digitsOnly,
          message: "Only digits allowed" 
        }},
    },
    {
      name: "name",
      label: "Name",
      rules: { 
        required: "Required", 
        pattern: { 
          value: REGEX.lettersOnly,
          message: "Only letters allowed" 
        }},
    },
    {
      name: "surname",
      label: "Surname",
      rules: { 
        required: "Required", 
        pattern: { 
          value: REGEX.lettersOnly,
          message: "Only letters allowed" 
        }},
    },
    {
      name: "section",
      label: "Section",
      rules: { 
        required: "Required", 
        pattern: { 
          value: REGEX.sectionAllowed,
          message: "Only letters or digits allowed" 
        }},
    },
  ];

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={2.5}>
        {fields.map((f, idx) => (
          <TextField
            key={f.name}
            label={f.label}
            {...register(f.name, f.rules)} 
            error={!!errors[f.name]}
            helperText={(errors[f.name]?.message as string) || " "}
            autoComplete="off"
            disabled={isSubmitting}
            autoFocus={idx === 0}
          />
        ))}
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Attendance"}
        </Button>
      </Stack>
    </Box>
  );
}