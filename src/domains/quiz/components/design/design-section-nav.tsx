"use client";

import { Image, Palette, Sparkles, Type } from "lucide-react";
import { useBuilderStore } from "@/domains/quiz/store/builder.store";
import { cn } from "@/lib/utils";
import type { DesignSection } from "@/domains/quiz/store/builder.store";

const SECTIONS: {
  id: DesignSection;
  label: string;
  icon: typeof Image;
}[] = [
  { id: "header", label: "Header", icon: Image },
  { id: "colors", label: "Cores", icon: Palette },
  { id: "typography", label: "Tipografia", icon: Type },
  { id: "animation", label: "Animação", icon: Sparkles },
];

export function DesignSectionNav() {
  const activeDesignSection = useBuilderStore((s) => s.activeDesignSection);
  const setActiveDesignSection = useBuilderStore(
    (s) => s.setActiveDesignSection,
  );

  return (
    <nav className="flex flex-wrap gap-1.5">
      {SECTIONS.map((section) => {
        const Icon = section.icon;
        const isActive = activeDesignSection === section.id;

        return (
          <button
            key={section.id}
            type="button"
            onClick={() => setActiveDesignSection(section.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
              isActive
                ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                : "border-transparent text-slate-400 hover:border-slate-700/60 hover:bg-slate-800/60 hover:text-slate-200",
            )}
          >
            <Icon className="size-3.5 shrink-0" />
            {section.label}
          </button>
        );
      })}
    </nav>
  );
}
