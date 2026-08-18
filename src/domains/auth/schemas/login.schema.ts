import { z } from "zod";
import { emailSchema } from "@/validations/common/email.schema";

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Senha é obrigatória"),
});

export type LoginInput = z.infer<typeof loginSchema>;
