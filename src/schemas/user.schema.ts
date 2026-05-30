import { z } from 'zod';

export const CreateUserSchema = z.object({
  email: z.string().email({ message: "Format email tidak valid" }),
  age: z.number().min(18, { message: "Umur minimal harus 18 tahun" }),
});