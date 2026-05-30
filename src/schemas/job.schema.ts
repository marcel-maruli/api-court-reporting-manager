import { z } from 'zod';

export const CreateJobSchema = z.object({
  case_name: z.string().min(3),
  duration_minutes: z.number().positive(),
  location_type: z.enum(['PHYSICAL', 'REMOTE']),
  city: z.string().min(2),
});

export const AssignUserSchema = z.object({
  userId: z.number().positive(),
});

export const UpdateStatusSchema = z.object({
  status: z.enum(['NEW', 'ASSIGNED', 'TRANSCRIBED', 'REVIEWED', 'COMPLETED']),
});