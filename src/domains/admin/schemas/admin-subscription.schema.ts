import { z } from "zod";

export const subscriptionStatusSchema = z.enum([
  "inactive",
  "active",
  "past_due",
  "canceled",
]);

const isoDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use o formato AAAA-MM-DD");

export const grantSubscriptionSchema = z
  .object({
    workspaceId: z.string().uuid("Workspace inválido"),
    planId: z.string().trim().min(1, "Selecione um plano"),
    status: subscriptionStatusSchema,
    periodStart: isoDateSchema,
    periodEnd: isoDateSchema,
  })
  .refine((data) => new Date(data.periodEnd) > new Date(data.periodStart), {
    message: "O fim do período deve ser depois do início",
    path: ["periodEnd"],
  });

export type GrantSubscriptionInput = z.infer<typeof grantSubscriptionSchema>;

export const extendSubscriptionSchema = z.object({
  workspaceId: z.string().uuid("Workspace inválido"),
  days: z
    .number({ message: "Informe a quantidade de dias" })
    .int("Use dias inteiros")
    .min(1, "Mínimo de 1 dia")
    .max(3650, "Máximo de 3650 dias"),
});

export type ExtendSubscriptionInput = z.infer<typeof extendSubscriptionSchema>;

export const workspaceIdSchema = z.object({
  workspaceId: z.string().uuid("Workspace inválido"),
});
