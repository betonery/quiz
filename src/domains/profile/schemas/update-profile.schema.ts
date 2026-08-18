import { z } from "zod";

export const updateProfileSchema = z.object({
  full_name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres"),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
