"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PropertiesSection,
  PropertyField,
  propertyFieldDarkClass,
} from "@/domains/quiz/components/builder/property-panel-primitives";
import {
  addQuizCustomDomainAction,
  removeQuizCustomDomainAction,
  verifyQuizCustomDomainAction,
} from "@/domains/quiz/actions/quiz-custom-domain.action";
import { useBuilderStore } from "@/domains/quiz/store/builder.store";
import { getQuizPublicUrl } from "@/domains/quiz/utils/quiz-public-url.utils";
import { cn } from "@/lib/utils";

export function SettingsDomainSection() {
  const workspaceSlug = useBuilderStore((s) => s.workspaceSlug);
  const quizId = useBuilderStore((s) => s.quizId);
  const quizSlug = useBuilderStore((s) => s.quizSlug);
  const customDomain = useBuilderStore((s) => s.customDomain);
  const setCustomDomain = useBuilderStore((s) => s.setCustomDomain);
  const setFeedback = useBuilderStore((s) => s.setFeedback);

  const [hostname, setHostname] = useState(customDomain?.hostname ?? "");
  const [isPending, startTransition] = useTransition();

  const statusLabel =
    customDomain?.status === "verified"
      ? "Ativo"
      : customDomain?.status === "failed"
        ? "Falhou"
        : customDomain
          ? "Pendente"
          : null;

  function handleAddDomain() {
    startTransition(async () => {
      const result = await addQuizCustomDomainAction(
        workspaceSlug,
        quizId,
        hostname,
      );

      if (!result.success) {
        setFeedback(result.error, "error");
        return;
      }

      setCustomDomain(result.domain);
      setFeedback("Domínio registrado. Configure o DNS abaixo.", "success");
    });
  }

  function handleVerify() {
    startTransition(async () => {
      const result = await verifyQuizCustomDomainAction(workspaceSlug, quizId);

      if (!result.success) {
        setFeedback(result.error, "error");
        return;
      }

      setCustomDomain(result.domain);
      setFeedback(
        result.domain.status === "verified"
          ? "Domínio verificado com sucesso!"
          : "DNS ainda pendente. Tente novamente em alguns minutos.",
        result.domain.status === "verified" ? "success" : "info",
      );
    });
  }

  function handleRemove() {
    startTransition(async () => {
      const result = await removeQuizCustomDomainAction(workspaceSlug, quizId);

      if (!result.success) {
        setFeedback(result.error, "error");
        return;
      }

      setCustomDomain(null);
      setHostname("");
      setFeedback("Domínio removido", "success");
    });
  }

  return (
    <PropertiesSection title="Domínio personalizado" variant="dark">
      {!customDomain ? (
        <>
          <PropertyField label="Hostname" variant="dark">
            <Input
              value={hostname}
              onChange={(e) => setHostname(e.target.value.trim().toLowerCase())}
              placeholder="quiz.suaempresa.com"
              className={propertyFieldDarkClass}
            />
            <p className="mt-1.5 text-xs text-slate-400">
              Use o domínio principal ou um subdomínio dedicado a este funil. A
              URL pública será{" "}
              <code className="font-mono text-slate-300">
                https://meudominio.com.br/
              </code>{" "}
              (sem slug na URL).
            </p>
          </PropertyField>
          <Button
            type="button"
            variant="brand"
            disabled={!hostname || isPending}
            onClick={handleAddDomain}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Registrando...
              </>
            ) : (
              "Adicionar domínio"
            )}
          </Button>
        </>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-700/60 bg-slate-950/40 px-3 py-2.5">
            <div>
              <p className="text-sm font-medium text-slate-100">
                {customDomain.hostname}
              </p>
              {statusLabel ? (
                <span
                  className={cn(
                    "mt-1 inline-flex items-center gap-1 text-xs font-medium",
                    customDomain.status === "verified"
                      ? "text-emerald-400"
                      : customDomain.status === "failed"
                        ? "text-red-400"
                        : "text-amber-400",
                  )}
                >
                  {customDomain.status === "verified" ? (
                    <CheckCircle2 className="size-3.5" />
                  ) : null}
                  {statusLabel}
                </span>
              ) : null}
            </div>
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="border-slate-600 text-red-300 hover:text-red-200"
              onClick={handleRemove}
              disabled={isPending}
              aria-label="Remover domínio"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>

          {customDomain.status === "verified" ? (
            <PropertyField label="URL pública" variant="dark">
              <code className="block truncate rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-200">
                {getQuizPublicUrl({
                  slug: quizSlug,
                  customDomain: customDomain.hostname,
                })}
              </code>
              <p className="mt-1.5 text-xs text-slate-400">
                Visitantes veem o funil na raiz do domínio, sem{" "}
                <code className="font-mono">/q/slug</code>. A URL da plataforma
                continua disponível como fallback.
              </p>
            </PropertyField>
          ) : null}

          <PropertyField label="Configuração DNS" variant="dark">
            <div className="space-y-2">
              {(
                customDomain.verification_records as Array<{
                  type?: string;
                  domain?: string;
                  value?: string;
                  reason?: string;
                }>
              ).map((record, index) => (
                <div
                  key={`${record.type}-${index}`}
                  className="rounded-lg border border-slate-700/60 bg-slate-950/50 p-3 text-xs text-slate-300"
                >
                  <p>
                    <span className="text-slate-500">Tipo:</span>{" "}
                    {record.type ?? "—"}
                  </p>
                  <p>
                    <span className="text-slate-500">Nome:</span>{" "}
                    {record.domain ?? "@"}
                  </p>
                  <p className="break-all">
                    <span className="text-slate-500">Valor:</span>{" "}
                    {record.value ?? "—"}
                  </p>
                  {record.reason ? (
                    <p className="mt-1 text-slate-400">{record.reason}</p>
                  ) : null}
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Adicione todos os registros abaixo no seu provedor DNS (ex.:
              Cloudflare). Se houver TXT, ele é necessário para a Vercel
              confirmar a propriedade do domínio. Use proxy desligado (DNS only)
              em registros CNAME.
            </p>
          </PropertyField>

          {customDomain.status !== "verified" ? (
            <Button
              type="button"
              variant="outline"
              className="border-slate-600 bg-slate-900/50 text-slate-200"
              disabled={isPending}
              onClick={handleVerify}
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Verificar agora"
              )}
            </Button>
          ) : null}
        </div>
      )}
    </PropertiesSection>
  );
}
