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
import {
  PropertiesSection,
  PropertyColorSwatchReset,
  PropertyField,
  PropertySelect,
} from "@/domains/quiz/components/builder/property-panel-primitives";
import { VariableInsertField } from "@/domains/quiz/components/variables/variable-insert-field";
import { WidgetGeneralProperties } from "@/domains/quiz/components/builder/widget-general-properties";
import { useBuilderStore } from "@/domains/quiz/store/builder.store";
import type { BenefitsWidgetConfig } from "@/domains/quiz/types/builder.types";
import {
  BENEFITS_MAX_ITEMS,
  createDefaultBenefitItem,
  type BenefitIcon,
  type BenefitItem,
} from "@/domains/quiz/types/media.types";
import { resolveBenefitsColors } from "@/domains/quiz/utils/benefits-widget.utils";
import { cn } from "@/lib/utils";

type BenefitsWidgetPropertiesProps = {
  config: BenefitsWidgetConfig;
  onChange: (config: BenefitsWidgetConfig) => void;
};

function SortableBenefitRow({
  item,
  onUpdate,
  onRemove,
  canRemove,
}: {
  item: BenefitItem;
  onUpdate: (patch: Partial<BenefitItem>) => void;
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
  } = useSortable({ id: item.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "space-y-3 rounded-lg border border-border bg-background p-3",
        isDragging && "opacity-60",
      )}
    >
      <div className="flex items-center justify-center">
        <button
          type="button"
          className="flex cursor-grab items-center justify-center text-muted-foreground active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label="Reordenar"
        >
          <GripVertical className="size-4" />
        </button>
      </div>

      <PropertyField label="Ícone">
        <PropertySelect
          value={item.icon}
          onChange={(value) => onUpdate({ icon: value as BenefitIcon })}
        >
          <option value="check">Check</option>
          <option value="x">X</option>
          <option value="star">Estrela</option>
          <option value="dot">Ponto</option>
        </PropertySelect>
      </PropertyField>

      <PropertyField label="Texto">
        <VariableInsertField
          value={item.text}
          onChange={(text) => onUpdate({ text })}
          placeholder="Descreva o benefício..."
        />
      </PropertyField>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          className="flex size-8 items-center justify-center text-destructive disabled:opacity-40"
          aria-label="Remover item"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function BenefitsWidgetProperties({
  config,
  onChange,
}: BenefitsWidgetPropertiesProps) {
  const design = useBuilderStore((s) => s.design);
  const resolvedColors = resolveBenefitsColors(config, design);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function patch(partial: Partial<BenefitsWidgetConfig>) {
    onChange({ ...config, ...partial });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = config.items.findIndex((item) => item.id === active.id);
    const newIndex = config.items.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    patch({ items: arrayMove(config.items, oldIndex, newIndex) });
  }

  return (
    <div className="space-y-4">
      <PropertiesSection title="Itens">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={config.items.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {config.items.map((item) => (
                <SortableBenefitRow
                  key={item.id}
                  item={item}
                  onUpdate={(itemPatch) =>
                    patch({
                      items: config.items.map((current) =>
                        current.id === item.id
                          ? { ...current, ...itemPatch }
                          : current,
                      ),
                    })
                  }
                  onRemove={() =>
                    patch({
                      items: config.items.filter(
                        (current) => current.id !== item.id,
                      ),
                    })
                  }
                  canRemove={config.items.length > 1}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <Button
          type="button"
          variant="outline"
          className="mt-3 w-full"
          disabled={config.items.length >= BENEFITS_MAX_ITEMS}
          onClick={() =>
            patch({ items: [...config.items, createDefaultBenefitItem()] })
          }
        >
          <Plus className="size-4" />
          Adicionar benefício
        </Button>
      </PropertiesSection>

      <PropertiesSection title="Estilo">
        <PropertyField label="Layout">
          <PropertySelect
            value={config.layout}
            onChange={(layout) =>
              patch({ layout: layout as BenefitsWidgetConfig["layout"] })
            }
          >
            <option value="compact">Compacto</option>
            <option value="cards">Cards</option>
          </PropertySelect>
        </PropertyField>
        <div className="grid grid-cols-2 gap-3">
          <PropertyColorSwatchReset
            label="Ícone"
            value={resolvedColors.icon}
            onChange={(iconColor) => patch({ iconColor })}
            onReset={() => patch({ iconColor: null })}
          />
          <PropertyColorSwatchReset
            label="Texto"
            value={resolvedColors.text}
            onChange={(textColor) => patch({ textColor })}
            onReset={() => patch({ textColor: null })}
          />
          {config.layout === "cards" ? (
            <PropertyColorSwatchReset
              label="Fundo card"
              value={resolvedColors.cardBackground}
              onChange={(cardBackgroundColor) => patch({ cardBackgroundColor })}
              onReset={() => patch({ cardBackgroundColor: null })}
            />
          ) : null}
        </div>
      </PropertiesSection>

      <WidgetGeneralProperties
        layout={config}
        onChange={(layout) => onChange({ ...config, ...layout })}
      />
    </div>
  );
}
