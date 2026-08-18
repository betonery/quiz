"use client";

import { Globe, Link2, Plug, Share2 } from "lucide-react";
import { useBuilderStore } from "@/domains/quiz/store/builder.store";
import { cn } from "@/lib/utils";
import type { SettingsSection } from "@/domains/quiz/store/builder.store";

const SECTIONS: {
  id: SettingsSection;
  label: string;
  icon: typeof Link2;
}[] = [
  { id: "slug", label: "Slug", icon: Link2 },
  { id: "domain", label: "Domínio", icon: Globe },
  { id: "integrations", label: "Integrações", icon: Plug },
  { id: "share", label: "Compartilhar", icon: Share2 },
];

export function SettingsSectionNav() {
  const activeSettingsSection = useBuilderStore((s) => s.activeSettingsSection);
  const setActiveSettingsSection = useBuilderStore(
    (s) => s.setActiveSettingsSection,
  );

  return (
    <nav className="flex flex-wrap gap-1.5">
      {SECTIONS.map((section) => {
        const Icon = section.icon;
        const isActive = activeSettingsSection === section.id;

        return (
          <button
            key={section.id}
            type="button"
            onClick={() => setActiveSettingsSection(section.id)}
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
