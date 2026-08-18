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
import type { LogoBarWidgetConfig } from "@/domains/quiz/types/builder.types";
import {
  LOGO_BAR_MAX_ITEMS,
  createDefaultLogoBarItem,
  type LogoBarItem,
} from "@/domains/quiz/types/media.types";
import {
  clampLogoBarItemHeight,
  resolveLogoBarColors,
} from "@/domains/quiz/utils/logo-bar-widget.utils";
import { cn } from "@/lib/utils";

type LogoBarWidgetPropertiesProps = {
  config: LogoBarWidgetConfig;
  onChange: (config: LogoBarWidgetConfig) => void;
};

function SortableLogoRow({
  item,
  onUpdate,
  onRemove,
  canRemove,
}: {
  item: LogoBarItem;
  onUpdate: (patch: Partial<LogoBarItem>) => void;
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
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "space-y-3 rounded-lg border border-border bg-background p-3",
        isDragging && "opacity-60",
      )}
    >
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="cursor-grab text-muted-foreground active:cursor-grabbing"
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
      <PropertyField label="Alt text">
        <Input
          value={item.alt}
          onChange={(event) => onUpdate({ alt: event.target.value })}
          className="bg-background shadow-sm"
        />
      </PropertyField>
      <MediaSourcePicker
        mode="image"
        subfolder="media"
        value={item.imageSource}
        onChange={(patch) =>
          onUpdate({ imageSource: { ...item.imageSource, ...patch } })
        }
      />
    </div>
  );
}

export function LogoBarWidgetProperties({
  config,
  onChange,
}: LogoBarWidgetPropertiesProps) {
  const design = useBuilderStore((s) => s.design);
  const resolvedColors = resolveLogoBarColors(config, design);
  const sensors = useSensors(useSensor(PointerSensor));

  function patch(partial: Partial<LogoBarWidgetConfig>) {
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
      <PropertiesSection title="Conteúdo">
        <PropertyField label="Mostrar título">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={config.showTitle}
              onChange={(event) => patch({ showTitle: event.target.checked })}
            />
            Sim
          </label>
        </PropertyField>
        {config.showTitle ? (
          <PropertyField label="Título">
            <VariableInsertField
              value={config.title ?? ""}
              onChange={(title) => patch({ title: title || null })}
            />
          </PropertyField>
        ) : null}
        <PropertyField label="Modo">
          <PropertySelect
            value={config.mode}
            onChange={(mode) =>
              patch({ mode: mode as LogoBarWidgetConfig["mode"] })
            }
          >
            <option value="static">Faixa estática</option>
            <option value="carousel">Carrossel</option>
          </PropertySelect>
        </PropertyField>
        <PropertyField label="Altura dos logos (px)">
          <Input
            type="number"
            min={24}
            max={80}
            value={config.itemHeightPx}
            onChange={(event) => {
              const next = Number(event.target.value);
              if (!Number.isFinite(next)) return;
              patch({ itemHeightPx: clampLogoBarItemHeight(next) });
            }}
            className="bg-background shadow-sm"
          />
        </PropertyField>
        <PropertyField label="Escala de cinza">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={config.grayscale}
              onChange={(event) => patch({ grayscale: event.target.checked })}
            />
            Sim
          </label>
        </PropertyField>
        {config.mode === "carousel" ? (
          <>
            <PropertyField label="Autoplay">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={config.autoplay}
                  onChange={(event) =>
                    patch({ autoplay: event.target.checked })
                  }
                />
                Sim
              </label>
            </PropertyField>
            {config.autoplay ? (
              <PropertyField label="Velocidade (ms)">
                <Input
                  type="number"
                  min={1000}
                  max={30000}
                  step={500}
                  value={config.autoplayDelayMs}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    if (!Number.isFinite(next)) return;
                    patch({
                      autoplayDelayMs: Math.min(30000, Math.max(1000, next)),
                    });
                  }}
                  className="bg-background shadow-sm"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Valores menores = rolagem mais rápida. O carrossel roda de
                  forma contínua e linear.
                </p>
              </PropertyField>
            ) : null}
          </>
        ) : null}
      </PropertiesSection>

      <PropertiesSection title="Logos">
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
                <SortableLogoRow
                  key={item.id}
                  item={item}
                  canRemove={config.items.length > 1}
                  onUpdate={(itemPatch) =>
                    patch({
                      items: config.items.map((entry) =>
                        entry.id === item.id
                          ? { ...entry, ...itemPatch }
                          : entry,
                      ),
                    })
                  }
                  onRemove={() =>
                    patch({
                      items: config.items.filter(
                        (entry) => entry.id !== item.id,
                      ),
                    })
                  }
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        {config.items.length < LOGO_BAR_MAX_ITEMS ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 w-full"
            onClick={() =>
              patch({ items: [...config.items, createDefaultLogoBarItem()] })
            }
          >
            <Plus className="mr-2 size-4" />
            Adicionar logo
          </Button>
        ) : null}
      </PropertiesSection>

      <PropertiesSection title="Estilo">
        <PropertyColorSwatchReset
          label="Título"
          value={resolvedColors.title}
          onChange={(titleColor) => patch({ titleColor })}
          onReset={() => patch({ titleColor: null })}
        />
      </PropertiesSection>

      <WidgetGeneralProperties
        layout={config}
        onChange={(layout) => onChange({ ...config, ...layout })}
      />
    </div>
  );
}
