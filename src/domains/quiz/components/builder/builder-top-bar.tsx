"use client";

import Link from "next/link";
import { ArrowLeft, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import type { BuilderTab } from "@/domains/quiz/types/builder.types";
import { cn } from "@/lib/utils";

import { getQuizPublicUrl } from "@/domains/quiz/utils/quiz-public-url.utils";

const TABS: { id: BuilderTab; label: string; implemented: boolean }[] = [
  { id: "flow", label: "Fluxo", implemented: true },
  { id: "design", label: "Design", implemented: true },
  { id: "statistics", label: "Estatísticas", implemented: true },
  { id: "settings", label: "Configurações", implemented: true },
];

type BuilderTopBarProps = {
  workspaceSlug: string;
  quizTitle: string;
  quizSlug: string;
  activeTab: BuilderTab;
  isSaving: boolean;
  isPublishing: boolean;
  isDirty: boolean;
  hasUnpublishedChanges: boolean;
  onSave: () => void;
  onPublish: () => void;
  onTabChange: (tab: BuilderTab) => void;
  onStubTab: (label: string) => void;
};

export function BuilderTopBar({
  workspaceSlug,
  quizTitle,
  quizSlug,
  isSaving,
  isPublishing,
  isDirty,
  hasUnpublishedChanges,
  activeTab,
  onSave,
  onPublish,
  onTabChange,
  onStubTab,
}: BuilderTopBarProps) {
  const isBusy = isSaving || isPublishing;

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-700/60 bg-[#0b121e] px-4">
      <div className="flex items-center gap-2">
        <Link
          href={ROUTES.quizzes(workspaceSlug)}
          className="flex size-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800/80 hover:text-slate-100"
          aria-label="Voltar para funis"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="ml-2 hidden sm:block">
          <span className="text-sm font-medium text-slate-100">
            {quizTitle}
          </span>
          {isDirty && (
            <span className="ml-2 text-xs text-amber-600">
              Alterações não salvas
            </span>
          )}
          {!isDirty && hasUnpublishedChanges && (
            <span className="ml-2 text-xs text-amber-600">
              Alterações não publicadas
            </span>
          )}
        </div>
      </div>

      <nav className="hidden items-center gap-1 md:flex">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() =>
              tab.implemented ? onTabChange(tab.id) : onStubTab(tab.label)
            }
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "bg-brand-secondary text-white"
                : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-100",
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Ver prévia da versão salva"
          onClick={() => {
            const previewUrl = getQuizPublicUrl({
              slug: quizSlug,
              appOrigin: window.location.origin,
              preview: true,
            });
            window.open(previewUrl, "_blank", "noopener,noreferrer");
          }}
        >
          <Play className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onSave}
          disabled={isBusy}
        >
          {isSaving ? "Salvando..." : "Salvar"}
        </Button>
        <Button
          type="button"
          variant="brand"
          onClick={onPublish}
          disabled={isBusy}
        >
          {isPublishing ? "Publicando..." : "Publicar"}
        </Button>
      </div>
    </header>
  );
}
