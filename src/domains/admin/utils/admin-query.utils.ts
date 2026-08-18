import {
  ADMIN_MAX_PAGE_SIZE,
  ADMIN_PAGE_SIZE,
} from "@/domains/admin/constants/admin.constants";
import type { AdminListParams } from "@/domains/admin/types/admin.types";

export function parsePage(value: unknown): number {
  const page = Number(value);
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.floor(page);
}

export function parsePageSize(value: unknown): number {
  const size = Number(value);
  if (!Number.isFinite(size) || size < 1) return ADMIN_PAGE_SIZE;
  return Math.min(Math.floor(size), ADMIN_MAX_PAGE_SIZE);
}

export function parseSearch(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (trimmed.length === 0) return undefined;
  return trimmed.slice(0, 120);
}

export function parseListParams(searchParams: {
  q?: string;
  page?: string;
  pageSize?: string;
}): AdminListParams {
  return {
    search: parseSearch(searchParams.q),
    page: parsePage(searchParams.page),
    pageSize: parsePageSize(searchParams.pageSize),
  };
}

/**
 * Prepara o termo para ir dentro de aspas no filtro do PostgREST.
 * A barra invertida é o escape do LIKE — uma sobrando no fim faz o Postgres
 * recusar o padrão inteiro, então some. As aspas são escapadas porque
 * delimitam o valor.
 */
export function escapeSearchTerm(term: string): string {
  return term.replace(/\\/g, "").replace(/"/g, '\\"');
}

/**
 * Valor sempre entre aspas: vírgula e parênteses são separadores da sintaxe
 * `or(...)` do PostgREST e, sem as aspas, um termo como "Silva, João"
 * viraria dois filtros.
 */
export function buildIlikePattern(term: string): string {
  return `"%${escapeSearchTerm(term)}%"`;
}

/** Monta o filtro `or` do PostgREST para busca em múltiplas colunas. */
export function buildOrIlikeFilter(columns: string[], term: string): string {
  const pattern = buildIlikePattern(term);
  return columns.map((column) => `${column}.ilike.${pattern}`).join(",");
}

export type RangeBounds = { from: number; to: number };

export function toRange(page: number, pageSize: number): RangeBounds {
  const from = (page - 1) * pageSize;
  return { from, to: from + pageSize - 1 };
}

export function pageCountFor(total: number, pageSize: number): number {
  if (pageSize <= 0) return 1;
  return Math.max(1, Math.ceil(total / pageSize));
}

/** Clampa a página ao total disponível — evita listagem vazia após filtrar. */
export function clampPage(
  page: number,
  total: number,
  pageSize: number,
): number {
  return Math.min(Math.max(1, page), pageCountFor(total, pageSize));
}

export function buildQueryString(
  params: Record<string, string | number | undefined | null>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

/** Índice por id para juntar listas vindas de queries separadas. */
export function indexBy<T, K extends string | number>(
  items: T[],
  getKey: (item: T) => K,
): Map<K, T> {
  const map = new Map<K, T>();
  for (const item of items) {
    map.set(getKey(item), item);
  }
  return map;
}

export function countBy<T, K extends string | number>(
  items: T[],
  getKey: (item: T) => K | null | undefined,
): Map<K, number> {
  const map = new Map<K, number>();
  for (const item of items) {
    const key = getKey(item);
    if (key === null || key === undefined) continue;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}
