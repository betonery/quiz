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
  PropertyCheckbox,
  PropertyField,
} from "@/domains/quiz/components/builder/property-panel-primitives";
import { VariableInsertField } from "@/domains/quiz/components/variables/variable-insert-field";
import { WidgetGeneralProperties } from "@/domains/quiz/components/builder/widget-general-properties";
import type { FaqWidgetConfig } from "@/domains/quiz/types/builder.types";
import {
  FAQ_MAX_ITEMS,
  createDefaultFaqItem,
  type FaqItem,
} from "@/domains/quiz/types/media.types";
import { cn } from "@/lib/utils";

type FaqWidgetPropertiesProps = {
  config: FaqWidgetConfig;
  onChange: (config: FaqWidgetConfig) => void;
};

function SortableFaqRow({
  item,
  onUpdate,
  onRemove,
  canRemove,
}: {
  item: FaqItem;
  onUpdate: (patch: Partial<FaqItem>) => void;
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

      <PropertyField label="Pergunta">
        <VariableInsertField
          value={item.question}
          onChange={(question) => onUpdate({ question })}
          placeholder="Lorem ipsum dolor?"
        />
      </PropertyField>

      <PropertyField label="Resposta">
        <VariableInsertField
          value={item.answer}
          onChange={(answer) => onUpdate({ answer })}
          placeholder="Lorem ipsum dolor sit amet..."
          multiline={true}
        />
      </PropertyField>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          className="flex size-8 items-center justify-center text-destructive disabled:opacity-40"
          aria-label="Remover pergunta"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function FaqWidgetProperties({
  config,
  onChange,
}: FaqWidgetPropertiesProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function patch(partial: Partial<FaqWidgetConfig>) {
    onChange({ ...config, ...partial });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = config.items.findIndex((item) => item.id === active.id);
    const newIndex = config.items.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    patch({ items: arrayMove(config.items, oldIndex, newIndex) });
  }

  function addItem() {
    if (config.items.length >= FAQ_MAX_ITEMS) return;
    patch({
      items: [...config.items, createDefaultFaqItem("Nova pergunta?", "")],
    });
  }

  return (
    <div className="space-y-4">
      <PropertiesSection title="Padrões">
        <PropertyCheckbox
          label="Primeira Pergunta Aberta"
          checked={config.firstItemOpen}
          onChange={(firstItemOpen) => patch({ firstItemOpen })}
        />
      </PropertiesSection>

      <PropertiesSection title="Perguntas e Respostas">
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
                <SortableFaqRow
                  key={item.id}
                  item={item}
                  canRemove={config.items.length > 1}
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
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        <Button
          type="button"
          variant="outline"
          className="mt-2 w-full"
          disabled={config.items.length >= FAQ_MAX_ITEMS}
          onClick={addItem}
        >
          <Plus className="size-4" />
          Adicionar Pergunta
        </Button>
      </PropertiesSection>

      <WidgetGeneralProperties
        layout={config}
        onChange={(layout) => onChange({ ...config, ...layout })}
      />
    </div>
  );
}
