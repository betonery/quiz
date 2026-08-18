"use client";

import { Copy, Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PropertiesSection,
  PropertyCheckbox,
  PropertyField,
} from "@/domains/quiz/components/builder/property-panel-primitives";
import { testWebhookFunctionAction } from "@/domains/quiz/actions/test-webhook-function.action";
import { useBuilderStore } from "@/domains/quiz/store/builder.store";
import type { WebhookFunctionConfig } from "@/domains/quiz/types/flow.types";
import type { WebhookDispatchResult } from "@/domains/quiz/utils/webhook-dispatch.utils";
import { cn } from "@/lib/utils";

type TestState = "idle" | "loading" | "success" | "error";

type FlowWebhookEditorBodyProps = {
  functionId: string;
  config: WebhookFunctionConfig;
  updateFlowFunctionNode: ReturnType<
    typeof useBuilderStore.getState
  >["updateFlowFunctionNode"];
};

export function FlowWebhookEditorBody({
  functionId,
  config,
  updateFlowFunctionNode,
}: FlowWebhookEditorBodyProps) {
  const variables = useBuilderStore((s) => s.variables);
  const quizId = useBuilderStore((s) => s.quizId);
  const workspaceSlug = useBuilderStore((s) => s.workspaceSlug);
  const setFeedback = useBuilderStore((s) => s.setFeedback);

  const [testState, setTestState] = useState<TestState>("idle");
  const [testResult, setTestResult] = useState<WebhookDispatchResult | null>(
    null,
  );
  const [showToken, setShowToken] = useState(false);

  const method = config.method ?? "POST";
  const selectedKeys = config.variableKeys ?? [];
  const tokenValue = config.token ?? "";

  async function handleCopyToken() {
    if (!tokenValue) {
      setFeedback("Não há token para copiar");
      return;
    }

    try {
      await navigator.clipboard.writeText(tokenValue);
      setFeedback("Token copiado");
    } catch {
      setFeedback("Não foi possível copiar o token");
    }
  }

  function toggleVariableKey(key: string, checked: boolean) {
    const next = checked
      ? [...selectedKeys, key]
      : selectedKeys.filter((item) => item !== key);
    updateFlowFunctionNode(functionId, {
      config: { ...config, variableKeys: next },
    });
  }

  async function handleTestWebhook() {
    if (!config.url.trim()) {
      setFeedback("Informe a URL do webhook antes de testar");
      return;
    }

    setTestState("loading");
    setTestResult(null);

    const response = await testWebhookFunctionAction(
      workspaceSlug,
      quizId,
      functionId,
      config,
    );

    if (!response.success) {
      setTestState("error");
      setTestResult({
        ok: false,
        status: null,
        error: response.error,
      });
      return;
    }

    setTestResult(response.result);
    setTestState(response.result.ok ? "success" : "error");
  }

  return (
    <div className="space-y-6">
      <PropertiesSection title="Webhook">
        <PropertyField label="URL do Webhook">
          <Input
            value={config.url}
            onChange={(e) =>
              updateFlowFunctionNode(functionId, {
                config: { ...config, url: e.target.value },
              })
            }
            placeholder="https://exemplo.com/webhook"
            className="border-slate-700 bg-slate-900/60 text-slate-100 shadow-none"
          />
        </PropertyField>

        <PropertyField label="Método">
          <select
            value={method}
            onChange={(e) =>
              updateFlowFunctionNode(functionId, {
                config: {
                  ...config,
                  method: e.target.value as WebhookFunctionConfig["method"],
                },
              })
            }
            className="flex h-9 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 text-sm text-slate-100 shadow-none"
          >
            <option value="POST">POST</option>
            <option value="GET">GET</option>
          </select>
        </PropertyField>

        <PropertyField label="Token (opcional)">
          <div className="relative">
            <Input
              type={showToken ? "text" : "password"}
              value={tokenValue}
              onChange={(e) =>
                updateFlowFunctionNode(functionId, {
                  config: { ...config, token: e.target.value },
                })
              }
              placeholder="Enviado no header X-Webhook-Token"
              className="border-slate-700 bg-slate-900/60 pr-20 text-slate-100 shadow-none"
            />
            <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-0.5">
              <button
                type="button"
                onClick={() => setShowToken((current) => !current)}
                className="flex size-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-800/80 hover:text-slate-200"
                aria-label={showToken ? "Ocultar token" : "Mostrar token"}
              >
                {showToken ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
              <button
                type="button"
                onClick={() => void handleCopyToken()}
                className="flex size-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-800/80 hover:text-slate-200"
                aria-label="Copiar token"
              >
                <Copy className="size-4" />
              </button>
            </div>
          </div>
        </PropertyField>

        <PropertyField label="Variáveis no payload">
          {variables.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma variável cadastrada no funil.
            </p>
          ) : (
            <div className="space-y-2">
              {variables.map((item) => (
                <PropertyCheckbox
                  key={item.key}
                  label={
                    item.label
                      ? `${item.key} — ${item.label}${item.valueType === "list" ? " (lista)" : ""}`
                      : `${item.key}${item.valueType === "list" ? " (lista)" : ""}`
                  }
                  checked={selectedKeys.includes(item.key)}
                  onChange={(checked) => toggleVariableKey(item.key, checked)}
                />
              ))}
            </div>
          )}
          {selectedKeys.some(
            (key) => !variables.some((item) => item.key === key),
          ) ? (
            <p className="mt-2 text-xs text-amber-500">
              Algumas variáveis selecionadas não existem mais no funil e serão
              ignoradas no payload.
            </p>
          ) : null}
        </PropertyField>
      </PropertiesSection>

      <PropertiesSection title="Testar Webhook">
        <Button
          type="button"
          className="w-full"
          disabled={testState === "loading"}
          onClick={() => void handleTestWebhook()}
        >
          {testState === "loading" ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Testando...
            </>
          ) : (
            "Testar Webhook"
          )}
        </Button>

        {testResult ? (
          <div
            className={cn(
              "mt-3 rounded-lg border px-3 py-2.5 text-sm",
              testState === "success"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                : "border-red-500/40 bg-red-500/10 text-red-200",
            )}
          >
            {testResult.status !== null ? (
              <p className="font-medium">
                Status HTTP: {testResult.status}
                {testResult.statusText ? ` ${testResult.statusText}` : ""}
              </p>
            ) : null}
            {testResult.error ? (
              <p className="mt-1 break-words">{testResult.error}</p>
            ) : testResult.bodyPreview ? (
              <p className="mt-1 break-words font-mono text-xs opacity-90">
                {testResult.bodyPreview}
              </p>
            ) : testState === "success" ? (
              <p className="mt-1">Webhook respondeu com sucesso.</p>
            ) : null}
          </div>
        ) : null}
      </PropertiesSection>
    </div>
  );
}
