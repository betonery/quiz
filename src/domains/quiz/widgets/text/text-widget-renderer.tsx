import type { CSSProperties } from "react";
import { VariableHighlightedText } from "@/domains/quiz/components/builder/variable-highlighted-text";
import type { TextWidgetConfig } from "@/domains/quiz/types/builder.types";
import {
  renderRichTextHtml,
  richContentToPlainText,
} from "@/domains/quiz/utils/text-rich-content.utils";
import { resolveTemplate } from "@/domains/quiz/utils/variable-template.utils";
import { cn } from "@/lib/utils";

const weightMap = {
  normal: "font-normal",
  semibold: "font-semibold",
  bold: "font-bold",
} as const;

const alignMap = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

type TextWidgetRendererProps = {
  config: TextWidgetConfig;
  variables?: Record<string, unknown>;
  highlightVariables?: boolean;
  className?: string;
  style?: CSSProperties;
};

function getBlockStyle(config: TextWidgetConfig, style?: CSSProperties) {
  return {
    color: config.color,
    fontSize: `${config.fontSizePx}px`,
    letterSpacing:
      config.letterSpacingPx === 0 ? undefined : `${config.letterSpacingPx}px`,
    ...style,
  } satisfies CSSProperties;
}

export function TextWidgetRenderer({
  config,
  variables,
  highlightVariables = false,
  className,
  style,
}: TextWidgetRendererProps) {
  const isRich = config.contentMode === "rich" && Boolean(config.richContent);
  const rawContent =
    config.content ||
    (isRich && config.richContent
      ? richContentToPlainText(config.richContent)
      : "Seu texto aqui");

  if (isRich && config.richContent) {
    const html = highlightVariables
      ? renderRichTextHtml(config.richContent)
      : renderRichTextHtml(config.richContent, variables);

    return (
      <div
        className={cn(
          "text-widget-rich-content w-full [&_p]:m-0 [&_p+p]:mt-2",
          weightMap[config.fontWeight],
          alignMap[config.align],
          highlightVariables &&
            "[&_.text-widget-variable-chip]:mx-0.5 [&_.text-widget-variable-chip]:inline-block [&_.text-widget-variable-chip]:rounded-md [&_.text-widget-variable-chip]:bg-slate-200 [&_.text-widget-variable-chip]:px-1.5 [&_.text-widget-variable-chip]:py-0.5 [&_.text-widget-variable-chip]:text-xs [&_.text-widget-variable-chip]:font-bold [&_.text-widget-variable-chip]:text-violet-700",
          className,
        )}
        style={getBlockStyle(config, style)}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  const content =
    highlightVariables || !variables
      ? rawContent
      : resolveTemplate(rawContent, variables);

  return (
    <p
      className={cn(
        "w-full whitespace-pre-wrap",
        weightMap[config.fontWeight],
        alignMap[config.align],
        className,
      )}
      style={getBlockStyle(config, style)}
    >
      {highlightVariables ? (
        <VariableHighlightedText text={rawContent} />
      ) : (
        content
      )}
    </p>
  );
}
