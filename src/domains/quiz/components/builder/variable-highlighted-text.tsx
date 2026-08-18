import type { CSSProperties, ReactNode } from "react";
import { parseTemplateParts } from "@/domains/quiz/utils/variable-template.utils";
import { cn } from "@/lib/utils";

export const VARIABLE_HIGHLIGHT_CLASS =
  "mx-0.5 inline-block rounded-md bg-slate-200 px-1.5 py-0.5 font-bold text-violet-700";

type VariableHighlightedTextProps = {
  text: string;
  className?: string;
  style?: CSSProperties;
};

export function VariableHighlightChip({ name }: { name: string }) {
  return <span className={VARIABLE_HIGHLIGHT_CLASS}>{name}</span>;
}

export function VariableHighlightedText({
  text,
  className,
  style,
}: VariableHighlightedTextProps) {
  const parts = parseTemplateParts(text);
  const hasVariables = parts.some((part) => part.type === "variable");

  if (!hasVariables) {
    return (
      <span className={className} style={style}>
        {text}
      </span>
    );
  }

  const nodes: ReactNode[] = [];

  parts.forEach((part, index) => {
    if (part.type === "text") {
      nodes.push(<span key={`text-${index}`}>{part.value}</span>);
      return;
    }

    nodes.push(
      <VariableHighlightChip
        key={`var-${index}-${part.key}`}
        name={part.key}
      />,
    );
  });

  return (
    <span className={cn(className)} style={style}>
      {nodes}
    </span>
  );
}
