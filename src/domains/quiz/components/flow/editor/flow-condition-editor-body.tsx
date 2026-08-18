"use client";

import { FilterX, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PropertiesSection,
  PropertyField,
} from "@/domains/quiz/components/builder/property-panel-primitives";
import { VariableKeyCombobox } from "@/domains/quiz/components/variables/variable-key-combobox";
import { useBuilderStore } from "@/domains/quiz/store/builder.store";
import type {
  ConditionBranch,
  ConditionFunctionConfig,
  ConditionOperator,
} from "@/domains/quiz/types/flow.types";
import {
  CONDITION_OPERATORS,
  formatOperatorLabel,
  operatorRequiresValue,
} from "@/domains/quiz/utils/condition-evaluation.utils";

type ConditionFunctionEditorBodyProps = {
  functionId: string;
  config: ConditionFunctionConfig;
};

export function ConditionFunctionEditorBody({
  functionId,
  config,
}: ConditionFunctionEditorBodyProps) {
  const addConditionBranch = useBuilderStore((s) => s.addConditionBranch);
  const removeConditionBranch = useBuilderStore((s) => s.removeConditionBranch);
  const addConditionComparison = useBuilderStore(
    (s) => s.addConditionComparison,
  );
  const updateConditionComparison = useBuilderStore(
    (s) => s.updateConditionComparison,
  );
  const removeConditionComparison = useBuilderStore(
    (s) => s.removeConditionComparison,
  );

  return (
    <PropertiesSection title="Conteúdo">
      {config.branches.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-600/60 bg-slate-900/30 px-4 py-8 text-center">
          <FilterX className="mx-auto mb-3 size-8 text-slate-500" />
          <p className="text-sm text-slate-400">Nenhuma condição adicionada</p>
          <p className="mt-1 text-xs text-slate-500">
            Adicione condições para criar regras lógicas para o seu fluxo
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {config.branches.map((branch, branchIndex) => (
            <ConditionBranchEditor
              key={branch.id}
              functionId={functionId}
              branch={branch}
              branchIndex={branchIndex}
              onRemove={() => removeConditionBranch(functionId, branch.id)}
              onAddComparison={(join) =>
                addConditionComparison(functionId, branch.id, join)
              }
              onUpdateComparison={(comparisonId, patch) =>
                updateConditionComparison(
                  functionId,
                  branch.id,
                  comparisonId,
                  patch,
                )
              }
              onRemoveComparison={(comparisonId) =>
                removeConditionComparison(functionId, branch.id, comparisonId)
              }
            />
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        className="mt-4 w-full gap-2 border-slate-600 bg-slate-900/50 text-slate-200 hover:bg-slate-800"
        onClick={() => addConditionBranch(functionId)}
      >
        <Plus className="size-4" />
        Adicionar Condição
      </Button>
    </PropertiesSection>
  );
}

type ConditionBranchEditorProps = {
  functionId: string;
  branch: ConditionBranch;
  branchIndex: number;
  onRemove: () => void;
  onAddComparison: (join: "and" | "or") => void;
  onUpdateComparison: (
    comparisonId: string,
    patch: Partial<{
      variableKey: string;
      operator: ConditionOperator;
      value: string;
      joinWithPrevious: "and" | "or";
    }>,
  ) => void;
  onRemoveComparison: (comparisonId: string) => void;
};

function ConditionBranchEditor({
  branch,
  branchIndex,
  onRemove,
  onAddComparison,
  onUpdateComparison,
  onRemoveComparison,
}: ConditionBranchEditorProps) {
  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-900/40 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-200">
          Grupo de Condição #{branchIndex + 1}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 text-slate-400 hover:text-red-400"
          onClick={onRemove}
          aria-label="Remover condição"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      <div className="space-y-3">
        {branch.comparisons.map((comparison, comparisonIndex) => (
          <div
            key={comparison.id}
            className="rounded-lg border border-slate-700/50 bg-slate-900/60 p-3"
          >
            {comparisonIndex > 0 && (
              <div className="mb-3">
                <label className="mb-1 block text-xs text-slate-400">
                  Conector
                </label>
                <select
                  value={comparison.joinWithPrevious ?? "and"}
                  onChange={(e) =>
                    onUpdateComparison(comparison.id, {
                      joinWithPrevious: e.target.value as "and" | "or",
                    })
                  }
                  className="h-9 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 text-sm text-slate-100"
                >
                  <option value="and">E</option>
                  <option value="or">OU</option>
                </select>
              </div>
            )}

            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Comparação #{comparisonIndex + 1}
              </span>
              {branch.comparisons.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6 text-slate-400 hover:text-red-400"
                  onClick={() => onRemoveComparison(comparison.id)}
                  aria-label="Remover comparação"
                >
                  <Trash2 className="size-3" />
                </Button>
              )}
            </div>

            <PropertyField label="Variável">
              <VariableKeyCombobox
                value={comparison.variableKey}
                allowCreate={false}
                placeholder="Selecionar variável..."
                onChange={(variableKey) =>
                  onUpdateComparison(comparison.id, { variableKey })
                }
              />
            </PropertyField>

            <PropertyField label="Operador">
              <select
                value={comparison.operator}
                onChange={(e) =>
                  onUpdateComparison(comparison.id, {
                    operator: e.target.value as ConditionOperator,
                  })
                }
                className="h-9 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 text-sm text-slate-100"
              >
                {CONDITION_OPERATORS.map((operator) => (
                  <option key={operator} value={operator}>
                    {formatOperatorLabel(operator)}
                  </option>
                ))}
              </select>
            </PropertyField>

            {operatorRequiresValue(comparison.operator) && (
              <PropertyField label="Valor">
                <Input
                  value={comparison.value ?? ""}
                  onChange={(e) =>
                    onUpdateComparison(comparison.id, {
                      value: e.target.value,
                    })
                  }
                  className="border-slate-700 bg-slate-900/60 text-slate-100 shadow-none"
                />
              </PropertyField>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1 border-slate-600 bg-slate-900/50 text-slate-200 hover:bg-slate-800"
          onClick={() => onAddComparison("and")}
        >
          <Plus className="size-3.5" />
          Adicionar Comparação
        </Button>
      </div>
    </div>
  );
}
