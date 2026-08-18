export type PlatformBranding = {
  productName: string;
  productDescription: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  landingHeadline: string;
  landingSubheadline: string;
};

/** Defaults neutros usados quando o banco ainda não tem branding ou falha a leitura. */
export const BRANDING_DEFAULTS: PlatformBranding = {
  productName: "Quiz Platform",
  productDescription:
    "Plataforma de criação de quizzes interativos para geração de leads, vendas e funis de conversão.",
  logoUrl: null,
  faviconUrl: null,
  primaryColor: "#0F172A",
  secondaryColor: "#3B82F6",
  landingHeadline:
    "Transforme visitantes em clientes com quizzes inteligentes.",
  landingSubheadline:
    "Crie experiências interativas, qualifique leads e aumente conversões em uma única plataforma.",
};

export function monogramFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "QP";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}
