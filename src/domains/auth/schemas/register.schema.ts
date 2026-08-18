import { z } from "zod";
import { emailSchema } from "@/validations/common/email.schema";

export const registerSchema = z
  .object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    email: emailSchema,
    password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
    confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
    terms: z.literal(true, {
      message: "Você deve aceitar os termos",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
