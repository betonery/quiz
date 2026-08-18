"use client";

import { MessageCircle } from "lucide-react";
import type { WhatsappWidgetConfig } from "@/domains/quiz/types/builder.types";
import type { QuizDesignSettings } from "@/domains/quiz/types/design.types";
import { VariableHighlightedText } from "@/domains/quiz/components/builder/variable-highlighted-text";
import {
  buildWhatsAppUrl,
  resolveWhatsAppColors,
  resolveWhatsAppLabel,
} from "@/domains/quiz/utils/whatsapp-widget.utils";
import { cn } from "@/lib/utils";

type WhatsappWidgetRendererProps = {
  config: WhatsappWidgetConfig;
  design: QuizDesignSettings;
  variables?: Record<string, unknown>;
  highlightVariables?: boolean;
  mode?: "edit" | "preview" | "player";
  className?: string;
};

const buttonStyles =
  "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-center text-base font-semibold transition-opacity hover:opacity-90";

export function WhatsappWidgetRenderer({
  config,
  design,
  variables,
  highlightVariables = false,
  mode = "edit",
  className,
}: WhatsappWidgetRendererProps) {
  const colors = resolveWhatsAppColors(config, design);
  const label = resolveWhatsAppLabel(config.buttonLabel, variables);
  const url = buildWhatsAppUrl(config.phoneNumber, config.message, variables);

  const labelContent = highlightVariables ? (
    <VariableHighlightedText text={config.buttonLabel} />
  ) : (
    label
  );

  const style = {
    backgroundColor: colors.background,
    color: colors.text,
  };

  if (mode === "player") {
    return (
      <a
        href={url}
        target={config.openInNewTab ? "_blank" : "_self"}
        rel={config.openInNewTab ? "noopener noreferrer" : undefined}
        className={cn(buttonStyles, className)}
        style={style}
      >
        {config.showIcon ? (
          <MessageCircle
            className="size-5 shrink-0"
            style={{ color: colors.icon }}
          />
        ) : null}
        {labelContent}
      </a>
    );
  }

  return (
    <div
      className={cn(buttonStyles, "pointer-events-none", className)}
      style={style}
    >
      {config.showIcon ? (
        <MessageCircle
          className="size-5 shrink-0"
          style={{ color: colors.icon }}
        />
      ) : null}
      {labelContent}
    </div>
  );
}
