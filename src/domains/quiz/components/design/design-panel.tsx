"use client";

import { BUILDER_OUTER_COLUMN_CLASS } from "@/domains/quiz/components/builder/builder-layout";
import { DesignSectionNav } from "@/domains/quiz/components/design/design-section-nav";
import { DesignAnimationSection } from "@/domains/quiz/components/design/sections/design-animation-section";
import { DesignColorsSection } from "@/domains/quiz/components/design/sections/design-colors-section";
import { DesignHeaderSection } from "@/domains/quiz/components/design/sections/design-header-section";
import { DesignTypographySection } from "@/domains/quiz/components/design/sections/design-typography-section";
import { QuizGoogleFonts } from "@/domains/quiz/components/design/quiz-design-provider";
import { useBuilderStore } from "@/domains/quiz/store/builder.store";
import { cn } from "@/lib/utils";

export function DesignPanel() {
  const activeDesignSection = useBuilderStore((s) => s.activeDesignSection);
  const design = useBuilderStore((s) => s.design);

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-l border-slate-700/60 bg-[#0c1220]",
        BUILDER_OUTER_COLUMN_CLASS,
      )}
    >
      <QuizGoogleFonts design={design} />
      <div className="border-b border-slate-700/60 px-5 py-4">
        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
          Design
        </p>
        <h2 className="mt-1 text-base font-semibold text-slate-100">
          Personalização do funil
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Alterações aplicadas em todas as etapas
        </p>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b border-slate-700/60 px-4 py-3">
          <DesignSectionNav />
        </div>
        <div className="flex-1 overflow-y-auto bg-slate-900/20 p-4">
          {activeDesignSection === "header" && <DesignHeaderSection />}
          {activeDesignSection === "colors" && <DesignColorsSection />}
          {activeDesignSection === "typography" && <DesignTypographySection />}
          {activeDesignSection === "animation" && <DesignAnimationSection />}
        </div>
      </div>
    </aside>
  );
}
