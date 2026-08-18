import { z } from "zod";

const metaPixelIntegrationSchema = z.object({
  enabled: z.boolean(),
  pixelId: z
    .string()
    .trim()
    .regex(/^\d+$/, "Pixel ID deve conter apenas números"),
});

const utmifyIntegrationSchema = z.object({
  enabled: z.boolean(),
  utmScriptEnabled: z.boolean(),
  pixelId: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9]+$/, "Pixel ID inválido")
    .optional()
    .or(z.literal("")),
});

export const quizIntegrationsSchema = z.object({
  metaPixel: metaPixelIntegrationSchema.optional(),
  utmify: utmifyIntegrationSchema.optional(),
});

export const quizSettingsSchema = z.object({
  integrations: quizIntegrationsSchema.default({}),
  testIntegrationsInPreview: z.boolean().optional(),
});

export const customDomainSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Domínio inválido")
  .max(253, "Domínio muito longo")
  .regex(
    /^([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/,
    "Informe um domínio válido (ex: quiz.empresa.com)",
  );

export const addQuizCustomDomainSchema = z.object({
  quizId: z.string().uuid(),
  workspaceSlug: z.string().min(1),
  hostname: customDomainSchema,
});
