"use client";

import { useEffect, useState, useTransition } from "react";
import { Copy, Loader2, RefreshCw, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PropertiesSection,
  PropertyField,
} from "@/domains/quiz/components/builder/property-panel-primitives";
import { getQuizShareSettingsAction } from "@/domains/quiz/actions/get-quiz-share.action";
import { updateQuizShareAction } from "@/domains/quiz/actions/update-quiz-share.action";
import { useBuilderStore } from "@/domains/quiz/store/builder.store";
import type { QuizShareSettings } from "@/domains/quiz/types/quiz-share.types";
import { cn } from "@/lib/utils";

export function SettingsShareSection() {
  const workspaceSlug = useBuilderStore((s) => s.workspaceSlug);
  const quizId = useBuilderStore((s) => s.quizId);
  const steps = useBuilderStore((s) => s.steps);
  const setFeedback = useBuilderStore((s) => s.setFeedback);

  const [settings, setSettings] = useState<QuizShareSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  async function loadSettings() {
    setIsLoading(true);
    const result = await getQuizShareSettingsAction(workspaceSlug, quizId);
    if (result.success) {
      setSettings(result.data);
    } else {
      setFeedback(result.error, "error");
    }
    setIsLoading(false);
  }

  useEffect(() => {
    void loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug, quizId, steps.length]);

  function copyShareUrl() {
    if (!settings?.shareUrl) return;
    void navigator.clipboard.writeText(settings.shareUrl).then(() => {
      setFeedback("Link de compartilhamento copiado", "success");
    });
  }

  function runShareAction(
    action: "enable" | "disable" | "refresh" | "regenerate",
  ) {
    startTransition(async () => {
      const result = await updateQuizShareAction(workspaceSlug, quizId, {
        action,
      });
      if (!result.success) {
        setFeedback(result.error, "error");
        return;
      }
      await loadSettings();
      const messages = {
        enable: "Compartilhamento ativado",
        disable: "Compartilhamento desativado",
        refresh: "Snapshot compartilhado atualizado",
        regenerate: "Novo link gerado",
      };
      setFeedback(messages[action], "success");
    });
  }

  const canEnable = steps.length > 0;

  if (isLoading && !settings) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-slate-400">
        <Loader2 className="mr-2 size-4 animate-spin" />
        Carregando compartilhamento...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PropertiesSection title="Importação por link">
        <p className="text-sm text-slate-400">
          Permita que outros usuários importem uma cópia deste funil usando um
          link. Integrações, domínio personalizado e tokens de webhook não são
          incluídos.
        </p>

        {!canEnable ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            Adicione ao menos uma etapa antes de habilitar o compartilhamento.
          </div>
        ) : null}

        <PropertyField label="Compartilhamento">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-700/60 bg-slate-900/40 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-100">
                {settings?.enabled ? "Ativo" : "Desativado"}
              </p>
              <p className="text-xs text-slate-500">
                Snapshot congelado até você atualizar manualmente
              </p>
            </div>
            <button
              type="button"
              disabled={isPending || !canEnable}
              onClick={() =>
                runShareAction(settings?.enabled ? "disable" : "enable")
              }
              className={cn(
                "relative h-7 w-12 rounded-full transition-colors",
                settings?.enabled ? "bg-brand-secondary" : "bg-slate-700",
                (isPending || !canEnable) && "opacity-50",
              )}
              aria-pressed={settings?.enabled ?? false}
            >
              <span
                className={cn(
                  "absolute top-0.5 size-6 rounded-full bg-white transition-transform",
                  settings?.enabled ? "left-5" : "left-0.5",
                )}
              />
            </button>
          </div>
        </PropertyField>

        {settings?.enabled && settings.shareUrl ? (
          <>
            <PropertyField label="Link de compartilhamento">
              <div className="flex gap-2">
                <input
                  readOnly
                  value={settings.shareUrl}
                  className="min-w-0 flex-1 rounded-xl border border-slate-700/60 bg-slate-900/60 px-3 py-2 text-sm text-slate-200"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={copyShareUrl}
                  aria-label="Copiar link"
                >
                  <Copy className="size-4" />
                </Button>
              </div>
            </PropertyField>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => runShareAction("refresh")}
                className="gap-2 border-slate-600 bg-transparent text-slate-200"
              >
                <RefreshCw className="size-4" />
                Atualizar snapshot
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => runShareAction("regenerate")}
                className="gap-2 border-slate-600 bg-transparent text-slate-200"
              >
                <Share2 className="size-4" />
                Regenerar link
              </Button>
            </div>

            <p className="text-xs text-slate-500">
              Importado {settings.importCount} vez
              {settings.importCount === 1 ? "" : "es"}
              {settings.updatedAt
                ? ` · Snapshot de ${new Intl.DateTimeFormat("pt-BR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  }).format(new Date(settings.updatedAt))}`
                : ""}
            </p>
          </>
        ) : null}

        <div className="rounded-xl border border-slate-700/60 bg-slate-900/30 px-4 py-3 text-xs text-slate-400">
          Imagens enviadas como arquivo continuam referenciando o storage
          original até serem substituídas no funil importado.
        </div>
      </PropertiesSection>
    </div>
  );
}
