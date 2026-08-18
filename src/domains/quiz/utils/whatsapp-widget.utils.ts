import type { WhatsappWidgetConfig } from "@/domains/quiz/types/builder.types";
import type { QuizDesignSettings } from "@/domains/quiz/types/design.types";
import { resolveTemplate } from "@/domains/quiz/utils/variable-template.utils";

const WHATSAPP_GREEN = "#25D366";
const WHATSAPP_TEXT = "#ffffff";

export function normalizePhoneNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length <= 11 && digits.length >= 10) {
    return `55${digits}`;
  }
  return digits;
}

export function buildWhatsAppUrl(
  phoneNumber: string,
  message: string,
  variables?: Record<string, unknown>,
): string {
  const phone = normalizePhoneNumber(phoneNumber);
  const text = variables ? resolveTemplate(message, variables) : message;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export function resolveWhatsAppColors(
  config: Pick<
    WhatsappWidgetConfig,
    "backgroundColor" | "textColor" | "iconColor"
  >,
  _design: QuizDesignSettings,
) {
  return {
    background: config.backgroundColor ?? WHATSAPP_GREEN,
    text: config.textColor ?? WHATSAPP_TEXT,
    icon: config.iconColor ?? WHATSAPP_TEXT,
  };
}

export function resolveWhatsAppLabel(
  label: string,
  variables?: Record<string, unknown>,
): string {
  if (!variables) return label;
  return resolveTemplate(label, variables);
}
