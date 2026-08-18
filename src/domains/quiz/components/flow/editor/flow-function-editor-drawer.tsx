"use client";

import { FunctionSquare, GitBranch, Link, Webhook, X } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConditionFunctionEditorBody } from "@/domains/quiz/components/flow/editor/flow-condition-editor-body";
import { FlowWebhookEditorBody } from "@/domains/quiz/components/flow/editor/flow-webhook-editor-body";
import { FlowEditorOverlay } from "@/domains/quiz/components/flow/editor/flow-editor-overlay";
import {
  PropertiesSection,
  PropertyCheckbox,
  PropertyField,
} from "@/domains/quiz/components/builder/property-panel-primitives";
import { VariableExpressionPreview } from "@/domains/quiz/components/variables/variable-expression-preview";
import { LinkUrlPreview } from "@/domains/quiz/components/variables/link-url-preview";
import { VariableInsertField } from "@/domains/quiz/components/variables/variable-insert-field";
import { VariableKeyCombobox } from "@/domains/quiz/components/variables/variable-key-combobox";
import { useBuilderStore } from "@/domains/quiz/store/builder.store";
import {
  DEFAULT_LINK_URL,
  type ConditionFunctionConfig,
  type LinkFunctionConfig,
  type SetVariableFunctionConfig,
  type WebhookFunctionConfig,
} from "@/domains/quiz/types/flow.types";
import { cn } from "@/lib/utils";

function normalizeLinkUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return DEFAULT_LINK_URL;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function FlowFunctionEditorDrawer() {
  const flowEditorFunctionId = useBuilderStore((s) => s.flowEditorFunctionId);
  const flowLayout = useBuilderStore((s) => s.flowLayout);
  const closeFlowEditor = useBuilderStore((s) => s.closeFlowEditor);
  const updateFlowFunctionNode = useBuilderStore(
    (s) => s.updateFlowFunctionNode,
  );

  const functionNode = flowLayout.functionNodes.find(
    (fn) => fn.id === flowEditorFunctionId,
  );

  useEffect(() => {
    if (!flowEditorFunctionId) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeFlowEditor();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [flowEditorFunctionId, closeFlowEditor]);

  if (!flowEditorFunctionId || !functionNode) return null;
  if (
    functionNode.type !== "set_variable" &&
    functionNode.type !== "link" &&
    functionNode.type !== "condition" &&
    functionNode.type !== "webhook"
  ) {
    return null;
  }

  const HeaderIcon =
    functionNode.type === "link"
      ? Link
      : functionNode.type === "condition"
        ? GitBranch
        : functionNode.type === "webhook"
          ? Webhook
          : FunctionSquare;

  return (
    <FlowEditorOverlay onClose={closeFlowEditor}>
      <div
        className={cn(
          "flex h-full w-full max-w-md flex-col overflow-hidden",
          "rounded-l-xl border border-slate-700/70 bg-[#0c1220] shadow-2xl",
        )}
      >
        <header className="flex shrink-0 items-center gap-3 border-b border-slate-700/60 px-4 py-3.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-800/80">
            <HeaderIcon className="size-4 text-slate-300" />
          </div>
          <Input
            value={functionNode.label}
            onChange={(e) =>
              updateFlowFunctionNode(functionNode.id, {
                label: e.target.value,
              })
            }
            className="h-9 min-w-0 flex-1 border-slate-700 bg-slate-900/60 font-medium text-slate-100 shadow-none"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0 border-slate-600 bg-slate-900/50 text-slate-200 hover:bg-slate-800"
            onClick={() => closeFlowEditor()}
            aria-label="Fechar"
          >
            <X className="size-4" />
          </Button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {functionNode.type === "link" ? (
            <LinkFunctionEditorBody
              functionId={functionNode.id}
              config={
                (functionNode.config as LinkFunctionConfig | undefined) ?? {
                  url: DEFAULT_LINK_URL,
                  openInNewWindow: false,
                }
              }
              updateFlowFunctionNode={updateFlowFunctionNode}
            />
          ) : functionNode.type === "condition" ? (
            <ConditionFunctionEditorBody
              functionId={functionNode.id}
              config={
                (functionNode.config as
                  | ConditionFunctionConfig
                  | undefined) ?? {
                  branches: [],
                }
              }
            />
          ) : functionNode.type === "webhook" ? (
            <FlowWebhookEditorBody
              functionId={functionNode.id}
              config={
                (functionNode.config as WebhookFunctionConfig | undefined) ?? {
                  url: "",
                  method: "POST",
                  token: "",
                  variableKeys: [],
                }
              }
              updateFlowFunctionNode={updateFlowFunctionNode}
            />
          ) : (
            <SetVariableFunctionEditorBody
              functionId={functionNode.id}
              config={
                (functionNode.config as
                  | SetVariableFunctionConfig
                  | undefined) ?? {
                  variableKey: "",
                  expression: "",
                }
              }
              functionLabel={functionNode.label}
              updateFlowFunctionNode={updateFlowFunctionNode}
            />
          )}
        </div>

        <footer className="flex shrink-0 justify-end border-t border-slate-700/60 px-4 py-3.5">
          <Button
            type="button"
            variant="outline"
            className="gap-2 border-slate-600 bg-slate-900/50 text-slate-200 hover:bg-slate-800"
            onClick={() => closeFlowEditor()}
          >
            <X className="size-4" />
            Fechar
          </Button>
        </footer>
      </div>
    </FlowEditorOverlay>
  );
}

type LinkFunctionEditorBodyProps = {
  functionId: string;
  config: LinkFunctionConfig;
  updateFlowFunctionNode: ReturnType<
    typeof useBuilderStore.getState
  >["updateFlowFunctionNode"];
};

function LinkFunctionEditorBody({
  functionId,
  config,
  updateFlowFunctionNode,
}: LinkFunctionEditorBodyProps) {
  const variables = useBuilderStore((s) => s.variables);
  const url = config.url || DEFAULT_LINK_URL;
  const openInNewWindow = config.openInNewWindow ?? false;

  return (
    <PropertiesSection title="Link">
      <PropertyField label="URL de Destino">
        <VariableInsertField
          value={url}
          onChange={(nextUrl) =>
            updateFlowFunctionNode(functionId, {
              config: { ...config, url: nextUrl },
            })
          }
          onBlur={() =>
            updateFlowFunctionNode(functionId, {
              config: { ...config, url: normalizeLinkUrl(url) },
            })
          }
          placeholder="https://meusite.com/login?email={{email}}&nome={{nome}}"
          inputClassName="border-slate-700 bg-slate-900/60 text-slate-100 shadow-none"
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          Use {"{{chave}}"} nos parâmetros da URL para enviar valores das
          variáveis do funil. Exemplo:{" "}
          <code className="font-mono text-[11px]">
            ?email={"{{email}}"}&amp;nome={"{{nome}}"}
          </code>
        </p>
      </PropertyField>

      <LinkUrlPreview url={url} variables={variables} />

      <PropertyCheckbox
        label="Abrir em uma nova janela"
        checked={openInNewWindow}
        onChange={(checked) =>
          updateFlowFunctionNode(functionId, {
            config: { ...config, openInNewWindow: checked },
          })
        }
      />
    </PropertiesSection>
  );
}

type SetVariableFunctionEditorBodyProps = {
  functionId: string;
  config: SetVariableFunctionConfig;
  functionLabel: string;
  updateFlowFunctionNode: ReturnType<
    typeof useBuilderStore.getState
  >["updateFlowFunctionNode"];
};

function SetVariableFunctionEditorBody({
  functionId,
  config,
  functionLabel,
  updateFlowFunctionNode,
}: SetVariableFunctionEditorBodyProps) {
  const variables = useBuilderStore((s) => s.variables);

  return (
    <PropertiesSection title="Variável">
      <PropertyField label="Procurar ou Criar Variável">
        <VariableKeyCombobox
          value={config.variableKey}
          labelHint={functionLabel}
          onChange={(variableKey) =>
            updateFlowFunctionNode(functionId, {
              config: { ...config, variableKey },
            })
          }
        />
      </PropertyField>

      <PropertyField label="Valor / Expressão">
        <VariableInsertField
          multiline
          rows={5}
          value={config.expression}
          onChange={(expression) =>
            updateFlowFunctionNode(functionId, {
              config: { ...config, expression },
            })
          }
          inputClassName="min-h-[120px] border-slate-700 bg-slate-900/60 text-slate-100 shadow-none"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Exemplos: <code className="font-mono">4</code>,{" "}
          <code className="font-mono">{"{{soma}} + 3"}</code>,{" "}
          <code className="font-mono">{"{{soma}} * 2"}</code>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Use um nó Variável por caminho de opção. Deixe o campo Variável do
          widget de opções vazio quando o fluxo atualiza o acumulador.
        </p>
      </PropertyField>

      <VariableExpressionPreview
        expression={config.expression}
        variables={variables}
      />
    </PropertiesSection>
  );
}
