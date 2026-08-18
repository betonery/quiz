export function clampRedirectDelaySeconds(seconds: number): number {
  if (!Number.isFinite(seconds)) return 1;
  return Math.min(120, Math.max(1, Math.round(seconds)));
}
