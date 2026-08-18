"use client";

import type { CSSProperties, ReactNode } from "react";
import type { QuizDesignSettings } from "@/domains/quiz/types/design.types";
import {
  getDesignCssVariables,
  getDesignFontsUrl,
} from "@/domains/quiz/utils/design-css.utils";

type QuizDesignProviderProps = {
  design: QuizDesignSettings;
  children: ReactNode;
  className?: string;
};

export function QuizGoogleFonts({ design }: { design: QuizDesignSettings }) {
  const href = getDesignFontsUrl(design);
  if (!href) return null;
  return <link rel="stylesheet" href={href} />;
}

export function QuizDesignProvider({
  design,
  children,
  className,
}: QuizDesignProviderProps) {
  const style = getDesignCssVariables(design) as CSSProperties;

  return (
    <>
      <QuizGoogleFonts design={design} />
      <div className={className} style={style}>
        {children}
      </div>
    </>
  );
}
