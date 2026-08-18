import { z } from "zod";

const payloadPathSchema = z
  .array(z.string().trim().min(1))
  .max(12, "Caminho muito profundo");

const requiredPathSchema = payloadPathSchema.min(1, "Selecione um campo");

export const integrationKindSchema = z.enum(["purchase", "refund"]);

export const providerSlugSchema = z
  .string()
  .trim()
  .min(2, "Identificador muito curto")
  .max(40, "Identificador muito longo")
  .regex(
    /^[a-z][a-z0-9_-]*$/,
    "Use letras minúsculas, números, hífen e underscore",
  );

export const createIntegrationSchema = z.object({
  name: z.string().trim().min(2, "Informe um nome").max(80, "Nome muito longo"),
  kind: integrationKindSchema,
  providerSlug: providerSlugSchema,
});

export type CreateIntegrationInput = z.infer<typeof createIntegrationSchema>;

const eventFilterSchema = z.object({
  path: payloadPathSchema,
  acceptedValues: z
    .array(z.string().trim().min(1))
    .max(30, "Máximo de 30 eventos")
    .default([]),
});

const amountSchema = z.object({
  path: payloadPathSchema,
  unit: z.enum(["cents", "currency"]),
});

const planSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("fixed"),
    planId: z.string().trim().min(1, "Selecione o plano"),
  }),
  z.object({ mode: z.literal("reference"), path: requiredPathSchema }),
  z.object({
    mode: z.literal("reference_any"),
    arrayPath: requiredPathSchema,
    key: z.string().trim().min(1, "Informe o campo do item"),
  }),
]);

const accessSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("fixed"),
    days: z
      .number({ message: "Informe os dias" })
      .int("Use dias inteiros")
      .min(1, "Mínimo de 1 dia")
      .max(3650, "Máximo de 3650 dias"),
  }),
  z.object({ mode: z.literal("path"), path: requiredPathSchema }),
]);

export const purchaseMappingSchema = z.object({
  version: z.literal(1).default(1),
  eventFilter: eventFilterSchema.optional(),
  email: requiredPathSchema,
  fullName: payloadPathSchema.optional(),
  /** Obrigatório: é a chave de idempotência contra reenvios da plataforma. */
  externalPaymentId: requiredPathSchema,
  amount: amountSchema.optional(),
  paymentMethod: payloadPathSchema.optional(),
  plan: planSchema,
  access: accessSchema,
});

export const refundMappingSchema = z
  .object({
    version: z.literal(1).default(1),
    eventFilter: eventFilterSchema.optional(),
    email: payloadPathSchema.optional(),
    externalPaymentId: payloadPathSchema.optional(),
  })
  .refine(
    (data) =>
      (data.email?.length ?? 0) > 0 ||
      (data.externalPaymentId?.length ?? 0) > 0,
    {
      message: "Informe ao menos o e-mail ou o identificador do pedido",
      path: ["externalPaymentId"],
    },
  );

export const updateIntegrationSchema = z.object({
  integrationId: z.string().uuid("Integração inválida"),
  name: z.string().trim().min(2).max(80),
  providerSlug: providerSlugSchema,
  enabled: z.boolean(),
  /** `null` mantém a senha atual; string vazia limpa. */
  defaultPassword: z.string().max(200).nullable().default(null),
  fieldMapping: z.unknown(),
});

export type UpdateIntegrationInput = z.infer<typeof updateIntegrationSchema>;

export const integrationIdSchema = z.object({
  integrationId: z.string().uuid("Integração inválida"),
});

export const integrationEventIdSchema = z.object({
  eventId: z.string().uuid("Evento inválido"),
});

/** Valida o mapeamento conforme o tipo da integração. */
export function parseFieldMapping(kind: string, raw: unknown) {
  return kind === "refund"
    ? refundMappingSchema.safeParse(raw)
    : purchaseMappingSchema.safeParse(raw);
}
