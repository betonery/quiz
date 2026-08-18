import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value.length === 0 ? null : value))
    .nullable();

const hexColor = z
  .string()
  .trim()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Use uma cor no formato #RRGGBB");

const optionalUrl = z
  .union([z.literal(""), z.string().trim().url("URL inválida").max(2000)])
  .transform((value) => (value === "" ? null : value))
  .nullable();

export const platformSettingsSchema = z.object({
  maintenanceMode: z.boolean(),
  maintenanceMessage: z
    .string()
    .trim()
    .min(5, "Escreva a mensagem exibida durante a manutenção")
    .max(300, "Mensagem muito longa"),
  signupsEnabled: z.boolean(),
  signupsDisabledMessage: z
    .string()
    .trim()
    .min(5, "Escreva a mensagem exibida com cadastros fechados")
    .max(300, "Mensagem muito longa"),
  globalAnnouncement: optionalText(300),
  defaultPlanId: z
    .string()
    .trim()
    .max(40)
    .transform((value) => (value.length === 0 ? null : value))
    .nullable(),
  trialDays: z
    .number({ message: "Informe os dias de teste" })
    .int("Use dias inteiros")
    .min(0, "Não pode ser negativo")
    .max(365, "Máximo de 365 dias"),
  supportEmail: z
    .union([z.string().trim().email("E-mail inválido"), z.literal("")])
    .transform((value) => (value === "" ? null : value))
    .nullable(),
  productName: z
    .string()
    .trim()
    .min(2, "Informe o nome do produto")
    .max(80, "Nome muito longo"),
  productDescription: z
    .string()
    .trim()
    .min(10, "Descreva o produto em pelo menos 10 caracteres")
    .max(300, "Descrição muito longa"),
  logoUrl: optionalUrl,
  faviconUrl: optionalUrl,
  primaryColor: hexColor,
  secondaryColor: hexColor,
  landingHeadline: z
    .string()
    .trim()
    .min(5, "Informe o título do hero")
    .max(200, "Título muito longo"),
  landingSubheadline: z
    .string()
    .trim()
    .min(5, "Informe o subtítulo do hero")
    .max(300, "Subtítulo muito longo"),
});

export type PlatformSettingsFormInput = z.input<typeof platformSettingsSchema>;
export type PlatformSettingsParsed = z.infer<typeof platformSettingsSchema>;

export const maintenanceToggleSchema = z.object({
  enabled: z.boolean(),
});
