"use client";

import { BUILDER_OUTER_COLUMN_CLASS } from "@/domains/quiz/components/builder/builder-layout";
import { SettingsSectionNav } from "@/domains/quiz/components/settings/settings-section-nav";
import { SettingsDomainSection } from "@/domains/quiz/components/settings/sections/settings-domain-section";
import { SettingsIntegrationsSection } from "@/domains/quiz/components/settings/sections/settings-integrations-section";
import { SettingsShareSection } from "@/domains/quiz/components/settings/sections/settings-share-section";
import { SettingsSlugSection } from "@/domains/quiz/components/settings/sections/settings-slug-section";
import { useBuilderStore } from "@/domains/quiz/store/builder.store";
import { cn } from "@/lib/utils";

export function SettingsPanel() {
  const activeSettingsSection = useBuilderStore((s) => s.activeSettingsSection);

  return (
    <div className="flex min-h-0 flex-1">
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-950/20">
        <div className="border-b border-slate-700/60 px-6 py-5">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Configurações
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-100">
            Publicação e integrações
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Slug, domínio personalizado e pixels de rastreamento
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto w-full max-w-2xl">
            {activeSettingsSection === "slug" && <SettingsSlugSection />}
            {activeSettingsSection === "domain" && <SettingsDomainSection />}
            {activeSettingsSection === "integrations" && (
              <SettingsIntegrationsSection />
            )}
            {activeSettingsSection === "share" && <SettingsShareSection />}
          </div>
        </div>
      </main>

      <aside
        className={cn(
          "flex shrink-0 flex-col border-l border-slate-700/60 bg-[#0c1220]",
          BUILDER_OUTER_COLUMN_CLASS,
        )}
      >
        <div className="border-b border-slate-700/60 px-5 py-4">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Seções
          </p>
        </div>
        <div className="border-b border-slate-700/60 px-4 py-3">
          <SettingsSectionNav />
        </div>
      </aside>
    </div>
  );
}
