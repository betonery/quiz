"use client";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PropertiesSection,
  PropertyColorSwatchReset,
  PropertyField,
  PropertySelect,
} from "@/domains/quiz/components/builder/property-panel-primitives";
import { VariableInsertField } from "@/domains/quiz/components/variables/variable-insert-field";
import { WidgetGeneralProperties } from "@/domains/quiz/components/builder/widget-general-properties";
import { MediaSourcePicker } from "@/domains/quiz/widgets/shared/media-source-picker";
import { useBuilderStore } from "@/domains/quiz/store/builder.store";
import type { ResultBlockWidgetConfig } from "@/domains/quiz/types/builder.types";
import {
  RESULT_BLOCK_MAX_VARIANTS,
  createDefaultResultBlockVariant,
  type ResultBlockVariant,
} from "@/domains/quiz/types/media.types";
import { resolveResultBlockColors } from "@/domains/quiz/utils/result-block-widget.utils";
import { cn } from "@/lib/utils";

type ResultBlockWidgetPropertiesProps = {
  config: ResultBlockWidgetConfig;
  onChange: (config: ResultBlockWidgetConfig) => void;
};

function SortableVariantRow({
  variant,
  onUpdate,
  onRemove,
  canRemove,
}: {
  variant: ResultBlockVariant;
  onUpdate: (patch: Partial<ResultBlockVariant>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: variant.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "space-y-3 rounded-lg border border-border bg-background p-3",
        isDragging && "opacity-60",
      )}
    >
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="cursor-grab"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={!canRemove}
          onClick={onRemove}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <PropertyField label="Score mín.">
          <Input
            type="number"
            value={variant.minScore ?? ""}
            onChange={(event) =>
              onUpdate({
                minScore:
                  event.target.value === "" ? null : Number(event.target.value),
              })
            }
            className="bg-background shadow-sm"
          />
        </PropertyField>
        <PropertyField label="Score máx.">
          <Input
            type="number"
            value={variant.maxScore ?? ""}
            onChange={(event) =>
              onUpdate({
                maxScore:
                  event.target.value === "" ? null : Number(event.target.value),
              })
            }
            className="bg-background shadow-sm"
          />
        </PropertyField>
      </div>
      <PropertyField label="Título">
        <VariableInsertField
          value={variant.title}
          onChange={(title) => onUpdate({ title })}
        />
      </PropertyField>
      <PropertyField label="Descrição">
        <VariableInsertField
          value={variant.description}
          onChange={(description) => onUpdate({ description })}
          multiline
        />
      </PropertyField>
      <PropertyField label="Mostrar imagem">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={variant.showImage}
            onChange={(event) => onUpdate({ showImage: event.target.checked })}
          />
          Sim
        </label>
      </PropertyField>
      {variant.showImage ? (
        <MediaSourcePicker
          mode="image"
          subfolder="media"
          value={variant.imageSource}
          onChange={(patch) =>
            onUpdate({ imageSource: { ...variant.imageSource, ...patch } })
          }
        />
      ) : null}
    </div>
  );
}

export function ResultBlockWidgetProperties({
  config,
  onChange,
}: ResultBlockWidgetPropertiesProps) {
  const design = useBuilderStore((s) => s.design);
  const variables = useBuilderStore((s) => s.variables);
  const resolvedColors = resolveResultBlockColors(config, design);
  const sensors = useSensors(useSensor(PointerSensor));

  function patch(partial: Partial<ResultBlockWidgetConfig>) {
    onChange({ ...config, ...partial });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = config.variants.findIndex((item) => item.id === active.id);
    const newIndex = config.variants.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    patch({ variants: arrayMove(config.variants, oldIndex, newIndex) });
  }

  return (
    <div className="space-y-4">
      <PropertiesSection title="Modo">
        <PropertyField label="Tipo">
          <PropertySelect
            value={config.mode}
            onChange={(mode) =>
              patch({ mode: mode as ResultBlockWidgetConfig["mode"] })
            }
          >
            <option value="single">Bloco único (variáveis)</option>
            <option value="by_score">Por faixa de score</option>
          </PropertySelect>
        </PropertyField>
        <PropertyField label="Layout">
          <PropertySelect
            value={config.layout}
            onChange={(layout) =>
              patch({ layout: layout as ResultBlockWidgetConfig["layout"] })
            }
          >
            <option value="card">Card</option>
            <option value="hero">Hero</option>
          </PropertySelect>
        </PropertyField>
        {config.mode === "by_score" ? (
          <>
            <PropertyField label="Variável de score">
              <PropertySelect
                value={config.scoreVariableKey ?? ""}
                onChange={(scoreVariableKey) =>
                  patch({ scoreVariableKey: scoreVariableKey || null })
                }
              >
                <option value="">Selecione</option>
                {variables.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label ?? item.key}
                  </option>
                ))}
              </PropertySelect>
            </PropertyField>
            <PropertyField label="Badge de score">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={config.showScoreBadge}
                  onChange={(event) =>
                    patch({ showScoreBadge: event.target.checked })
                  }
                />
                Sim
              </label>
            </PropertyField>
          </>
        ) : null}
      </PropertiesSection>

      {config.mode === "single" ? (
        <PropertiesSection title="Conteúdo">
          <PropertyField label="Título">
            <VariableInsertField
              value={config.title}
              onChange={(title) => patch({ title })}
            />
          </PropertyField>
          <PropertyField label="Descrição">
            <VariableInsertField
              value={config.description}
              onChange={(description) => patch({ description })}
              multiline
            />
          </PropertyField>
          <PropertyField label="Mostrar imagem">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={config.showImage}
                onChange={(event) => patch({ showImage: event.target.checked })}
              />
              Sim
            </label>
          </PropertyField>
          {config.showImage ? (
            <MediaSourcePicker
              mode="image"
              subfolder="media"
              value={config.imageSource}
              onChange={(imagePatch) =>
                patch({ imageSource: { ...config.imageSource, ...imagePatch } })
              }
            />
          ) : null}
        </PropertiesSection>
      ) : (
        <PropertiesSection title="Variantes por score">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={config.variants.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {config.variants.map((variant) => (
                  <SortableVariantRow
                    key={variant.id}
                    variant={variant}
                    canRemove={config.variants.length > 1}
                    onUpdate={(variantPatch) =>
                      patch({
                        variants: config.variants.map((entry) =>
                          entry.id === variant.id
                            ? { ...entry, ...variantPatch }
                            : entry,
                        ),
                      })
                    }
                    onRemove={() => {
                      const next = config.variants.filter(
                        (entry) => entry.id !== variant.id,
                      );
                      patch({
                        variants: next,
                        defaultVariantId:
                          config.defaultVariantId === variant.id
                            ? (next[0]?.id ?? config.defaultVariantId)
                            : config.defaultVariantId,
                      });
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          {config.variants.length < RESULT_BLOCK_MAX_VARIANTS ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 w-full"
              onClick={() => {
                const created = createDefaultResultBlockVariant();
                patch({
                  variants: [...config.variants, created],
                  defaultVariantId: config.defaultVariantId || created.id,
                });
              }}
            >
              <Plus className="mr-2 size-4" />
              Adicionar faixa
            </Button>
          ) : null}
          <PropertyField label="Variante padrão">
            <PropertySelect
              value={config.defaultVariantId}
              onChange={(defaultVariantId) => patch({ defaultVariantId })}
            >
              {config.variants.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variant.title}
                </option>
              ))}
            </PropertySelect>
          </PropertyField>
        </PropertiesSection>
      )}

      <PropertiesSection title="Estilo">
        <div className="grid grid-cols-2 gap-3">
          <PropertyColorSwatchReset
            label="Fundo"
            value={resolvedColors.background}
            onChange={(backgroundColor) => patch({ backgroundColor })}
            onReset={() => patch({ backgroundColor: null })}
          />
          <PropertyColorSwatchReset
            label="Borda"
            value={resolvedColors.border}
            onChange={(borderColor) => patch({ borderColor })}
            onReset={() => patch({ borderColor: null })}
          />
          <PropertyColorSwatchReset
            label="Título"
            value={resolvedColors.title}
            onChange={(titleColor) => patch({ titleColor })}
            onReset={() => patch({ titleColor: null })}
          />
          <PropertyColorSwatchReset
            label="Descrição"
            value={resolvedColors.description}
            onChange={(descriptionColor) => patch({ descriptionColor })}
            onReset={() => patch({ descriptionColor: null })}
          />
        </div>
      </PropertiesSection>

      <WidgetGeneralProperties
        layout={config}
        onChange={(layout) => onChange({ ...config, ...layout })}
      />
    </div>
  );
}
