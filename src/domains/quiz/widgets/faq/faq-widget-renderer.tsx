"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { FaqWidgetConfig } from "@/domains/quiz/types/builder.types";
import type { QuizDesignSettings } from "@/domains/quiz/types/design.types";
import type { FaqItem } from "@/domains/quiz/types/media.types";
import {
  getInitialOpenItemIds,
  resolveFaqField,
} from "@/domains/quiz/utils/faq-widget.utils";
import { cn } from "@/lib/utils";

type FaqWidgetRendererProps = {
  config: FaqWidgetConfig;
  design: QuizDesignSettings;
  variables?: Record<string, unknown>;
  className?: string;
};

function FaqAccordionItem({
  item,
  design,
  variables = {},
  isOpen,
  onToggle,
  isLast,
}: {
  item: FaqItem;
  design: QuizDesignSettings;
  variables?: Record<string, unknown>;
  isOpen: boolean;
  onToggle: () => void;
  isLast: boolean;
}) {
  const question = resolveFaqField(item.question, variables);
  const answer = resolveFaqField(item.answer, variables);

  return (
    <div className={cn(!isLast && "border-b border-slate-200")}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-start justify-between gap-3 py-4 text-left"
      >
        <span
          className="min-w-0 flex-1 text-sm font-semibold leading-snug [font-family:var(--quiz-font-body)]"
          style={{ color: design.colors.titles }}
        >
          {question || "Pergunta"}
        </span>
        {isOpen ? (
          <ChevronUp className="size-4 shrink-0 text-slate-500" />
        ) : (
          <ChevronDown className="size-4 shrink-0 text-slate-500" />
        )}
      </button>
      {isOpen && answer.trim() && (
        <p className="pb-4 text-sm leading-relaxed text-slate-500 [font-family:var(--quiz-font-body)]">
          {answer}
        </p>
      )}
    </div>
  );
}

export function FaqWidgetRenderer({
  config,
  design,
  variables,
  className,
}: FaqWidgetRendererProps) {
  const [openIds, setOpenIds] = useState<Set<string>>(() =>
    getInitialOpenItemIds(config.items, config.firstItemOpen),
  );

  if (config.items.length === 0) return null;

  function toggleItem(id: string) {
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className={cn("w-full", className)}>
      {config.items.map((item, index) => (
        <FaqAccordionItem
          key={item.id}
          item={item}
          design={design}
          variables={variables}
          isOpen={openIds.has(item.id)}
          onToggle={() => toggleItem(item.id)}
          isLast={index === config.items.length - 1}
        />
      ))}
    </div>
  );
}
