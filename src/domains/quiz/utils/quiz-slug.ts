export function generateQuizSlug(title?: string): string {
  const base = (title ?? "funil")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base || "funil"}-${suffix}`;
}
