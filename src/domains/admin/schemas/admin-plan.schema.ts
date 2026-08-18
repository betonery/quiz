import { z } from "zod";

/** -1 = ilimitado, conforme convenção já usada em `plan-limits.utils`. */
const limitSchema = z
  .number({ message: "Informe um número" })
  .int("Use números inteiros")
  .min(-1, "Use -1 para ilimitado ou um valor maior ou igual a 0")
  .max(1_000_000, "Valor muito alto");

export const EXTERNAL_REFERENCE_MAX_LENGTH = 160;
export const EXTERNAL_REFERENCES_MAX_ITEMS = 50;

/**
 * Códigos que identificam o plano em plataformas externas de pagamento.
 * Normaliza antes de validar: apara espaços, descarta vazios e remove
 * duplicados — colar uma lista de várias linhas é o caso comum.
 */
export const externalReferencesSchema = z
  .array(z.string())
  .default([])
  .transform((values) => {
    const seen = new Set<string>();
    const result: string[] = [];

    for (const value of values) {
      const trimmed = value.trim();
      if (trimmed.length === 0 || seen.has(trimmed)) continue;
      seen.add(trimmed);
      result.push(trimmed);
    }

    return result;
  })
  .refine(
    (values) => values.every((v) => v.length <= EXTERNAL_REFERENCE_MAX_LENGTH),
    {
      message: `Cada código deve ter até ${EXTERNAL_REFERENCE_MAX_LENGTH} caracteres`,
    },
  )
  .refine((values) => values.length <= EXTERNAL_REFERENCES_MAX_ITEMS, {
    message: `Máximo de ${EXTERNAL_REFERENCES_MAX_ITEMS} códigos por plano`,
  });

export const planFormSchema = z.object({
  id: z
    .string()
    .trim()
    .min(2, "Identificador muito curto")
    .max(40, "Identificador muito longo")
    .regex(
      /^[a-z][a-z0-9_-]*$/,
      "Use apenas letras minúsculas, números, hífen e underscore",
    ),
  name: z.string().trim().min(2, "Informe o nome do plano").max(60),
  description: z.string().trim().max(300).nullable().default(null),
  maxQuizzes: limitSchema,
  maxTeamMembers: limitSchema,
  maxCustomDomains: limitSchema,
  priceCents: z
    .number({ message: "Informe o preço" })
    .int("Use o valor em centavos")
    .min(0, "O preço não pode ser negativo")
    .max(100_000_000, "Valor muito alto")
    .nullable()
    .default(null),
  checkoutUrl: z
    .union([z.string().trim().url("URL inválida"), z.literal("")])
    .nullable()
    .default(null),
  externalReferences: externalReferencesSchema,
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(999).default(0),
});

export type PlanFormInput = z.infer<typeof planFormSchema>;

/** Na edição o id é imutável — mudá-lo quebraria assinaturas e pagamentos. */
export const planUpdateSchema = planFormSchema.omit({ id: true });

export type PlanUpdateInput = z.infer<typeof planUpdateSchema>;

export const planIdParamSchema = z.object({
  planId: z.string().trim().min(1, "Plano inválido"),
});
