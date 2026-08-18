export function parseReaisInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const normalized = trimmed.replace(/\s/g, "").replace(/^R\$\s?/i, "");

  if (!normalized.includes(",") && !normalized.includes(".")) {
    const whole = Number(normalized);
    if (!Number.isFinite(whole) || whole < 0) return null;
    return Math.round(whole * 100);
  }

  const lastComma = normalized.lastIndexOf(",");
  const lastDot = normalized.lastIndexOf(".");

  let reaisPart: string;
  let centsPart = "0";

  if (lastComma > lastDot) {
    reaisPart = normalized.slice(0, lastComma).replace(/\./g, "");
    centsPart = normalized.slice(lastComma + 1);
  } else if (lastDot > lastComma) {
    reaisPart = normalized.slice(0, lastDot).replace(/,/g, "");
    centsPart = normalized.slice(lastDot + 1);
  } else {
    reaisPart = normalized.replace(/[.,]/g, "");
  }

  if (!/^\d+$/.test(reaisPart) || !/^\d{0,2}$/.test(centsPart)) {
    return null;
  }

  const reais = Number(reaisPart);
  const cents = Number(centsPart.padEnd(2, "0").slice(0, 2));

  if (!Number.isFinite(reais) || !Number.isFinite(cents)) return null;

  return reais * 100 + cents;
}

export function formatCurrencyBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function formatInstallmentBRL(cents: number, count: number): string {
  if (count < 1) return formatCurrencyBRL(cents);
  const installmentCents = Math.round(cents / count);
  return `${count}x de ${formatCurrencyBRL(installmentCents)}`;
}

export function centsToReaisInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}
