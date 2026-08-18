export function formatNumber(value: number, locale = "pt-BR"): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatPercent(value: number, locale = "pt-BR"): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value / 100);
}

export function formatDate(date: Date | string, locale = "pt-BR"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}
