import { z } from "zod";

const isoDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use o formato AAAA-MM-DD");

export const manualPaymentSchema = z
  .object({
    workspaceId: z.string().uuid("Workspace inválido"),
    planId: z.string().trim().min(1, "Selecione um plano"),
    amountCents: z
      .number({ message: "Informe o valor" })
      .int("Use o valor em centavos")
      .min(1, "O valor deve ser maior que zero")
      .max(100_000_000, "Valor muito alto"),
    paymentMethod: z
      .string()
      .trim()
      .min(2, "Informe a forma de pagamento")
      .max(40),
    externalPaymentId: z
      .string()
      .trim()
      .min(3, "Informe uma referência única")
      .max(120),
    periodStart: isoDateSchema,
    periodEnd: isoDateSchema,
    /** Ativa/renova a assinatura junto com o lançamento. */
    activateSubscription: z.boolean().default(true),
  })
  .refine((data) => new Date(data.periodEnd) > new Date(data.periodStart), {
    message: "O fim do período deve ser depois do início",
    path: ["periodEnd"],
  });

export type ManualPaymentFormInput = z.infer<typeof manualPaymentSchema>;

export const refundPaymentSchema = z.object({
  paymentId: z.string().uuid("Pagamento inválido"),
});
