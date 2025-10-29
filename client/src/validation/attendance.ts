import { z } from 'zod';

export const REGEX = {
  digitsOnly: /^\d+$/, // numeric only
  lettersOnly: new RegExp("^[\\p{L} .'-]+$", 'u'),
  sectionAllowed: /^[\p{L}\d .'-]+$/u,
};

export const attendanceSubmissionSchema = z.object({
  token: z.string().min(1, 'token required'),
  userId: z.string().min(1, 'userId required').regex(REGEX.digitsOnly, { message: 'userId must contain only digits' }),
  name: z.string().min(1, 'name required').regex(REGEX.lettersOnly, { message: 'name must contain only letters' }),
  surname: z.string().min(1, 'surname required').regex(REGEX.lettersOnly, { message: 'surname must contain only letters' }),
  section: z.string().min(1, 'section required').regex(REGEX.sectionAllowed, { message: 'section must contain only letters and digits' }),
});

export type AttendanceSubmissionInput = z.infer<typeof attendanceSubmissionSchema>;
