"use client";

import { useEffect, useState, useTransition } from "react";
import { Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PropertiesSection,
  PropertyField,
  propertyFieldDarkClass,
} from "@/domains/quiz/components/builder/property-panel-primitives";
import { checkQuizSlugAction } from "@/domains/quiz/actions/update-quiz-slug.action";
import { updateQuizSlugAction } from "@/domains/quiz/actions/update-quiz-slug.action";
import { useBuilderStore } from "@/domains/quiz/store/builder.store";
import { getQuizPublicUrl } from "@/domains/quiz/utils/quiz-public-url.utils";

export function SettingsSlugSection() {
  const workspaceSlug = useBuilderStore((s) => s.workspaceSlug);
  const quizId = useBuilderStore((s) => s.quizId);
  const quizSlug = useBuilderStore((s) => s.quizSlug);
  const customDomain = useBuilderStore((s) => s.customDomain);
  const setQuizSlug = useBuilderStore((s) => s.setQuizSlug);
  const setFeedback = useBuilderStore((s) => s.setFeedback);

  const [draftSlug, setDraftSlug] = useState(quizSlug);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isSaving, startSaveTransition] = useTransition();

  useEffect(() => {
    setDraftSlug(quizSlug);
  }, [quizSlug]);

  useEffect(() => {
    if (draftSlug === quizSlug) {
      setSlugError(null);
      return;
    }

    const timer = window.setTimeout(async () => {
      setIsChecking(true);
      const result = await checkQuizSlugAction(draftSlug, quizId);
      setIsChecking(false);
      if (!result.available) {
        setSlugError(result.error ?? "Slug indisponível");
      } else {
        setSlugError(null);
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [draftSlug, quizId, quizSlug]);

  const verifiedHostname =
    customDomain?.status === "verified" ? customDomain.hostname : null;

  const platformUrl = getQuizPublicUrl({
    slug: draftSlug || quizSlug,
    appOrigin:
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL,
  });

  const customUrl = verifiedHostname
    ? getQuizPublicUrl({
        slug: draftSlug || quizSlug,
        customDomain: verifiedHostname,
      })
    : null;

  function copyUrl(url: string) {
    void navigator.clipboard.writeText(url).then(() => {
      setFeedback("Link copiado", "success");
    });
  }

  function handleSaveSlug() {
    if (slugError || draftSlug === quizSlug) return;

    startSaveTransition(async () => {
      const result = await updateQuizSlugAction(
        workspaceSlug,
        quizId,
        draftSlug,
        quizSlug,
      );

      if (!result.success) {
        setFeedback(result.error, "error");
        return;
      }

      setQuizSlug(draftSlug);
      setFeedback("Slug atualizado", "success");
    });
  }

  return (
    <PropertiesSection title="Slug do funil" variant="dark">
      <PropertyField label="Slug" variant="dark">
        <div className="flex gap-2">
          <Input
            value={draftSlug}
            onChange={(e) =>
              setDraftSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))
            }
            className={propertyFieldDarkClass}
            placeholder="meu-funil"
          />
          <Button
            type="button"
            variant="outline"
            className="shrink-0 border-slate-600 bg-slate-900/50 text-slate-200"
            disabled={
              isSaving ||
              isChecking ||
              !!slugError ||
              draftSlug === quizSlug ||
              !draftSlug
            }
            onClick={handleSaveSlug}
          >
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : "Salvar"}
          </Button>
        </div>
        {isChecking ? (
          <p className="mt-1.5 text-xs text-slate-400">Verificando...</p>
        ) : slugError ? (
          <p className="mt-1.5 text-xs text-red-400">{slugError}</p>
        ) : draftSlug !== quizSlug ? (
          <p className="mt-1.5 text-xs text-emerald-400">Slug disponível</p>
        ) : null}
        <p className="mt-2 text-xs text-slate-400">
          Alterar o slug quebra links antigos até você republicar o funil.
        </p>
      </PropertyField>

      <PropertyField label="URL da plataforma" variant="dark">
        <div className="flex items-center gap-2">
          <code className="flex-1 truncate rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-200">
            {platformUrl}
          </code>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="shrink-0 border-slate-600"
            onClick={() => copyUrl(platformUrl)}
            aria-label="Copiar URL da plataforma"
          >
            <Copy className="size-4" />
          </Button>
        </div>
      </PropertyField>

      {customUrl ? (
        <PropertyField label="URL com domínio personalizado" variant="dark">
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-200">
              {customUrl}
            </code>
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="shrink-0 border-emerald-600/40"
              onClick={() => copyUrl(customUrl)}
              aria-label="Copiar URL personalizada"
            >
              <Copy className="size-4" />
            </Button>
          </div>
          <p className="mt-1.5 text-xs text-slate-400">
            O funil abre na raiz do domínio, sem slug na URL.
          </p>
        </PropertyField>
      ) : null}
    </PropertiesSection>
  );
}
