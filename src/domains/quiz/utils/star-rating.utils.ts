export type StarFillState = "full" | "half" | "empty";

export function clampRatingScore(score: number): number {
  return Math.min(5, Math.max(0, score));
}

export function getStarFillState(
  score: number,
  index: number,
  showHalfStars = true,
): StarFillState {
  const clamped = clampRatingScore(score);
  const starValue = index + 1;

  if (clamped >= starValue) return "full";
  if (showHalfStars && clamped >= starValue - 0.5) return "half";
  return "empty";
}

export function formatRatingScore(score: number): string {
  const clamped = clampRatingScore(score);
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(clamped);
}

export function parseVariableScore(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return clampRatingScore(value);
  }
  if (typeof value === "string") {
    const normalized = value.trim().replace(",", ".");
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) return clampRatingScore(parsed);
  }
  return null;
}
