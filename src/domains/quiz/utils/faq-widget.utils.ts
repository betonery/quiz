import type { FaqItem } from "@/domains/quiz/types/media.types";
import { resolveTemplate } from "@/domains/quiz/utils/variable-template.utils";

export function resolveFaqField(
  text: string,
  variables: Record<string, unknown>,
): string {
  return resolveTemplate(text, variables);
}

export function getInitialOpenItemIds(
  items: FaqItem[],
  firstItemOpen: boolean,
): Set<string> {
  if (!firstItemOpen || items.length === 0) return new Set();
  return new Set([items[0]!.id]);
}
