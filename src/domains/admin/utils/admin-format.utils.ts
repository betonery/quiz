/** Formatações usadas nas tabelas e cards do painel administrativo. */

export function formatCents(cents: number | null | undefined): string {
  const value = (cents ?? 0) / 100;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    notation: value >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatShortDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

/** Distância relativa em pt-BR ("há 3 dias", "em 2 meses"). */
export function formatRelativeTime(
  value: string | null | undefined,
  now: Date = new Date(),
): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const diffMs = date.getTime() - now.getTime();
  const diffSeconds = Math.round(diffMs / 1000);
  const absSeconds = Math.abs(diffSeconds);
  const formatter = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

  if (absSeconds < 60) return formatter.format(diffSeconds, "second");
  if (absSeconds < 3600) {
    return formatter.format(Math.round(diffSeconds / 60), "minute");
  }
  if (absSeconds < 86_400) {
    return formatter.format(Math.round(diffSeconds / 3600), "hour");
  }
  if (absSeconds < 2_592_000) {
    return formatter.format(Math.round(diffSeconds / 86_400), "day");
  }
  if (absSeconds < 31_536_000) {
    return formatter.format(Math.round(diffSeconds / 2_592_000), "month");
  }
  return formatter.format(Math.round(diffSeconds / 31_536_000), "year");
}

export function formatRate(value: number): string {
  return `${new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
  }).format(value * 100)}%`;
}

/** Divisão segura para taxas de conversão — 0 quando não há base. */
export function safeRate(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return numerator / denominator;
}

export function initialsFrom(name: string | null, email: string): string {
  // Sem nome, usa só a parte local do e-mail — o domínio não diz nada sobre
  // a pessoa e produziria iniciais como "AX" para ana@x.com.
  const trimmedName = name?.trim();
  const source =
    trimmedName && trimmedName.length > 0 ? trimmedName : email.split("@")[0];

  const parts = source.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1))}…`;
}
