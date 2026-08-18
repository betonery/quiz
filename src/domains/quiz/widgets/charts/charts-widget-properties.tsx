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
  PropertyField,
  PropertySelect,
} from "@/domains/quiz/components/builder/property-panel-primitives";
import { WidgetGeneralProperties } from "@/domains/quiz/components/builder/widget-general-properties";
import type { ChartsWidgetConfig } from "@/domains/quiz/types/builder.types";
import {
  CHARTS_MAX_ITEMS,
  createDefaultChartItem,
  type ChartColor,
  type ChartItem,
  type ChartType,
} from "@/domains/quiz/types/media.types";
import {
  CHART_COLOR_LABELS,
  CHART_TYPE_LABELS,
  clampChartValue,
} from "@/domains/quiz/utils/charts-widget.utils";
import { ChartLegendRichEditor } from "@/domains/quiz/widgets/charts/chart-legend-rich-editor";
import { cn } from "@/lib/utils";

type ChartsWidgetPropertiesProps = {
  config: ChartsWidgetConfig;
  onChange: (config: ChartsWidgetConfig) => void;
};

function SortableChartRow({
  item,
  onUpdate,
  onRemove,
  canRemove,
}: {
  item: ChartItem;
  onUpdate: (patch: Partial<ChartItem>) => void;
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

      <div className="grid grid-cols-3 gap-2">
        <PropertyField label="Tipo">
          <PropertySelect
            value={item.chartType}
            onChange={(value) => onUpdate({ chartType: value as ChartType })}
          >
            {Object.entries(CHART_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </PropertySelect>
        </PropertyField>

        <PropertyField label="Cor">
          <PropertySelect
            value={item.color}
            onChange={(value) => onUpdate({ color: value as ChartColor })}
          >
            {Object.entries(CHART_COLOR_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </PropertySelect>
        </PropertyField>

        <PropertyField label="Valor">
          <Input
            type="number"
            min={0}
            max={100}
            value={item.value}
            onChange={(e) => {
              const next = Number(e.target.value);
              if (!Number.isFinite(next)) return;
              onUpdate({ value: clampChartValue(next) });
            }}
            className="bg-background shadow-sm"
          />
        </PropertyField>
      </div>

      <PropertyField label="Legenda">
        <ChartLegendRichEditor item={item} onChange={onUpdate} />
      </PropertyField>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          className="flex size-8 items-center justify-center text-destructive disabled:opacity-40"
          aria-label="Remover gráfico"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function ChartsWidgetProperties({
  config,
  onChange,
}: ChartsWidgetPropertiesProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function patch(partial: Partial<ChartsWidgetConfig>) {
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
    if (config.items.length >= CHARTS_MAX_ITEMS) return;
    patch({
      items: [...config.items, createDefaultChartItem("bar", 25, "green")],
    });
  }

  return (
    <div className="space-y-4">
      <PropertiesSection title="Layout">
        <PropertyField label="Layout">
          <PropertySelect
            value={config.layout}
            onChange={(value) =>
              patch({ layout: value as ChartsWidgetConfig["layout"] })
            }
          >
            <option value="list">Em Lista</option>
            <option value="cols2">2 Colunas</option>
            <option value="cols3">3 Colunas</option>
            <option value="cols4">4 Colunas</option>
          </PropertySelect>
        </PropertyField>
        <PropertyField label="Disposição">
          <PropertySelect
            value={config.disposition}
            onChange={(value) =>
              patch({
                disposition: value as ChartsWidgetConfig["disposition"],
              })
            }
          >
            <option value="chart_legend">Gráfico | Legenda</option>
            <option value="legend_chart">Legenda | Gráfico</option>
          </PropertySelect>
        </PropertyField>
      </PropertiesSection>

      <PropertiesSection title="Gráficos">
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
                <SortableChartRow
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
          disabled={config.items.length >= CHARTS_MAX_ITEMS}
          onClick={addItem}
        >
          <Plus className="size-4" />
          Adicionar gráfico
        </Button>
      </PropertiesSection>

      <WidgetGeneralProperties
        layout={config}
        onChange={(layout) => onChange({ ...config, ...layout })}
      />
    </div>
  );
}
