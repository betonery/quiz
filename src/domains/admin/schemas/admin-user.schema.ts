import { z } from "zod";
import { PLATFORM_ROLE_OPTIONS } from "@/domains/admin/constants/admin.constants";
import { emailSchema } from "@/validations/common/email.schema";

export const createUserSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(80, "Nome muito longo"),
  email: emailSchema,
  password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
  /** Vazio cria a conta sem assinatura. */
  planId: z.string().trim().default(""),
  accessDays: z
    .number({ message: "Informe os dias de acesso" })
    .int("Use dias inteiros")
    .min(1, "Mínimo de 1 dia")
    .max(3650, "Máximo de 3650 dias")
    .default(30),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const platformRoleSchema = z.enum(PLATFORM_ROLE_OPTIONS);

export const changePlatformRoleSchema = z.object({
  userId: z.string().uuid("Usuário inválido"),
  role: platformRoleSchema,
});

export type ChangePlatformRoleInput = z.infer<typeof changePlatformRoleSchema>;

export const suspendUserSchema = z.object({
  userId: z.string().uuid("Usuário inválido"),
  reason: z
    .string()
    .trim()
    .min(3, "Descreva o motivo da suspensão")
    .max(300, "Motivo muito longo"),
});

export type SuspendUserInput = z.infer<typeof suspendUserSchema>;

export const updateInternalNotesSchema = z.object({
  userId: z.string().uuid("Usuário inválido"),
  notes: z.string().trim().max(2000, "Notas muito longas"),
});

export type UpdateInternalNotesInput = z.infer<
  typeof updateInternalNotesSchema
>;

export const userIdSchema = z.object({
  userId: z.string().uuid("Usuário inválido"),
});
