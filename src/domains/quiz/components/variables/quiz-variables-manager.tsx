"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PropertiesSection,
  PropertyField,
} from "@/domains/quiz/components/builder/property-panel-primitives";
import { useBuilderStore } from "@/domains/quiz/store/builder.store";
import { getVariableUsages } from "@/domains/quiz/utils/variable-registry.utils";
import { cn } from "@/lib/utils";

type QuizVariablesManagerProps = {
  className?: string;
  variant?: "light" | "dark";
};

export function QuizVariablesManager({
  className,
  variant = "light",
}: QuizVariablesManagerProps) {
  const variables = useBuilderStore((s) => s.variables);
  const widgets = useBuilderStore((s) => s.widgets);
  const flowLayout = useBuilderStore((s) => s.flowLayout);
  const updateQuizVariableLabel = useBuilderStore(
    (s) => s.updateQuizVariableLabel,
  );
  const renameQuizVariable = useBuilderStore((s) => s.renameQuizVariable);
  const deleteQuizVariable = useBuilderStore((s) => s.deleteQuizVariable);
  const setFeedback = useBuilderStore((s) => s.setFeedback);

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draftKey, setDraftKey] = useState("");
  const [draftLabel, setDraftLabel] = useState("");

  const isDark = variant === "dark";

  function startEdit(key: string, label?: string) {
    setEditingKey(key);
    setDraftKey(key);
    setDraftLabel(label ?? "");
  }

  function cancelEdit() {
    setEditingKey(null);
    setDraftKey("");
    setDraftLabel("");
  }

  function saveEdit(originalKey: string) {
    const trimmedKey = draftKey.trim();
    const trimmedLabel = draftLabel.trim();

    if (trimmedKey !== originalKey) {
      const error = renameQuizVariable(originalKey, trimmedKey);
      if (error) {
        setFeedback(error);
        return;
      }
    }

    updateQuizVariableLabel(trimmedKey, trimmedLabel);
    setFeedback(null);
    cancelEdit();
  }

  function handleDelete(key: string) {
    const usages = getVariableUsages(key, widgets, flowLayout);
    const confirmed = window.confirm(
      usages.length > 0
        ? `A variável "${key}" está em uso e será removida dos widgets e nós do fluxo. Continuar?`
        : `Excluir a variável "${key}"?`,
    );
    if (!confirmed) return;

    const error = deleteQuizVariable(key);
    if (error) {
      setFeedback(error);
      return;
    }
    setFeedback(null);
    if (editingKey === key) cancelEdit();
  }

  return (
    <div className={cn("space-y-3", className)}>
      <PropertiesSection title="Variáveis do funil">
        {variables.length === 0 ? (
          <p
            className={cn(
              "text-sm",
              isDark ? "text-slate-400" : "text-muted-foreground",
            )}
          >
            Nenhuma variável criada. Ative &quot;Salvar resultado em uma
            variável&quot; em um widget de entrada ou opções.
          </p>
        ) : (
          <div className="space-y-2">
            {variables.map((item) => {
              const isEditing = editingKey === item.key;
              const usages = getVariableUsages(item.key, widgets, flowLayout);

              return (
                <div
                  key={item.key}
                  className={cn(
                    "rounded-lg border p-3",
                    isDark
                      ? "border-slate-700/60 bg-slate-900/50"
                      : "border-border bg-background",
                  )}
                >
                  {isEditing ? (
                    <div className="space-y-2">
                      <PropertyField label="Chave ({{chave}})">
                        <Input
                          value={draftKey}
                          onChange={(e) => setDraftKey(e.target.value)}
                          className={cn(
                            "shadow-sm",
                            isDark &&
                              "border-slate-700 bg-slate-950 text-slate-100",
                          )}
                        />
                      </PropertyField>
                      <PropertyField label="Nome">
                        <Input
                          value={draftLabel}
                          onChange={(e) => setDraftLabel(e.target.value)}
                          placeholder="Opcional"
                          className={cn(
                            "shadow-sm",
                            isDark &&
                              "border-slate-700 bg-slate-950 text-slate-100",
                          )}
                        />
                      </PropertyField>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="brand"
                          onClick={() => saveEdit(item.key)}
                        >
                          Salvar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={cancelEdit}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p
                          className={cn(
                            "font-mono text-sm font-medium",
                            isDark ? "text-slate-100" : "text-foreground",
                          )}
                        >
                          {item.key}
                        </p>
                        {item.label ? (
                          <p
                            className={cn(
                              "text-xs",
                              isDark
                                ? "text-slate-400"
                                : "text-muted-foreground",
                            )}
                          >
                            {item.label}
                          </p>
                        ) : null}
                        {usages.length > 0 ? (
                          <p
                            className={cn(
                              "mt-1 text-[11px]",
                              isDark
                                ? "text-slate-500"
                                : "text-muted-foreground",
                            )}
                          >
                            Em uso em {usages.length}{" "}
                            {usages.length === 1 ? "lugar" : "lugares"}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className={cn(
                            "size-8",
                            isDark && "text-slate-300 hover:bg-slate-800",
                          )}
                          aria-label="Editar variável"
                          onClick={() => startEdit(item.key, item.label)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className={cn(
                            "size-8 text-destructive hover:text-destructive",
                            isDark && "hover:bg-slate-800",
                          )}
                          aria-label="Excluir variável"
                          onClick={() => handleDelete(item.key)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </PropertiesSection>
    </div>
  );
}
