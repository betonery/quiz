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
import { useBuilderStore } from "@/domains/quiz/store/builder.store";
import type { ComparisonTableWidgetConfig } from "@/domains/quiz/types/builder.types";
import {
  COMPARISON_TABLE_MAX_ROWS,
  createDefaultComparisonColumn,
  createDefaultComparisonRow,
  type ComparisonCell,
  type ComparisonRow,
} from "@/domains/quiz/types/media.types";
import { resolveComparisonTableColors } from "@/domains/quiz/utils/comparison-table-widget.utils";
import { cn } from "@/lib/utils";

type ComparisonTableWidgetPropertiesProps = {
  config: ComparisonTableWidgetConfig;
  onChange: (config: ComparisonTableWidgetConfig) => void;
};

function SortableRowEditor({
  row,
  columns,
  onUpdate,
  onRemove,
  canRemove,
}: {
  row: ComparisonRow;
  columns: ComparisonTableWidgetConfig["columns"];
  onUpdate: (row: ComparisonRow) => void;
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
  } = useSortable({ id: row.id });

  function updateCell(index: number, patch: Partial<ComparisonCell>) {
    onUpdate({
      ...row,
      cells: row.cells.map((cell, cellIndex) =>
        cellIndex === index ? { ...cell, ...patch } : cell,
      ),
    });
  }

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
      <PropertyField label="Linha">
        <VariableInsertField
          value={row.label}
          onChange={(label) => onUpdate({ ...row, label })}
        />
      </PropertyField>
      {columns.map((column, index) => (
        <div
          key={column.id}
          className="space-y-2 rounded-md border border-border/60 p-2"
        >
          <p className="text-xs font-medium text-muted-foreground">
            {column.label}
          </p>
          <PropertySelect
            value={row.cells[index]?.type ?? "check"}
            onChange={(type) =>
              updateCell(index, {
                type: type as ComparisonCell["type"],
                text: row.cells[index]?.text ?? null,
              })
            }
          >
            <option value="check">Check</option>
            <option value="x">X</option>
            <option value="text">Texto</option>
          </PropertySelect>
          {row.cells[index]?.type === "text" ? (
            <VariableInsertField
              value={row.cells[index]?.text ?? ""}
              onChange={(text) => updateCell(index, { text: text || null })}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function ComparisonTableWidgetProperties({
  config,
  onChange,
}: ComparisonTableWidgetPropertiesProps) {
  const design = useBuilderStore((s) => s.design);
  const resolvedColors = resolveComparisonTableColors(config, design);
  const sensors = useSensors(useSensor(PointerSensor));

  function patch(partial: Partial<ComparisonTableWidgetConfig>) {
    onChange({ ...config, ...partial });
  }

  function setHighlightedColumn(columnId: string) {
    patch({
      columns: config.columns.map((column) => ({
        ...column,
        highlighted: column.id === columnId,
      })),
    });
  }

  function resizeColumns(nextCount: number) {
    const current = config.columns.slice(0, nextCount);
    while (current.length < nextCount) {
      current.push(
        createDefaultComparisonColumn(`Coluna ${current.length + 1}`),
      );
    }
    patch({
      columns: current,
      rows: config.rows.map((row) => ({
        ...row,
        cells: Array.from(
          { length: nextCount },
          (_, index) =>
            row.cells[index] ?? {
              type: "check" as const,
              text: null,
            },
        ),
      })),
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = config.rows.findIndex((row) => row.id === active.id);
    const newIndex = config.rows.findIndex((row) => row.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    patch({ rows: arrayMove(config.rows, oldIndex, newIndex) });
  }

  return (
    <div className="space-y-4">
      <PropertiesSection title="Colunas">
        <PropertyField label="Quantidade">
          <PropertySelect
            value={String(config.columns.length)}
            onChange={(value) => resizeColumns(Number(value))}
          >
            <option value="2">2 colunas</option>
            <option value="3">3 colunas</option>
          </PropertySelect>
        </PropertyField>
        {config.columns.map((column) => (
          <div
            key={column.id}
            className="space-y-2 rounded-lg border border-border p-3"
          >
            <PropertyField label="Nome da coluna">
              <Input
                value={column.label}
                onChange={(event) =>
                  patch({
                    columns: config.columns.map((entry) =>
                      entry.id === column.id
                        ? { ...entry, label: event.target.value }
                        : entry,
                    ),
                  })
                }
                className="bg-background shadow-sm"
              />
            </PropertyField>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="highlight-column"
                checked={column.highlighted}
                onChange={() => setHighlightedColumn(column.id)}
              />
              Coluna recomendada
            </label>
          </div>
        ))}
        <PropertyField label="Mostrar labels das linhas">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={config.showRowLabels}
              onChange={(event) =>
                patch({ showRowLabels: event.target.checked })
              }
            />
            Sim
          </label>
        </PropertyField>
        {config.showRowLabels ? (
          <PropertyField label="Célula superior esquerda">
            <VariableInsertField
              value={config.cornerLabel}
              onChange={(cornerLabel) => patch({ cornerLabel })}
              placeholder="Ex.: Comparação"
            />
          </PropertyField>
        ) : null}
      </PropertiesSection>

      <PropertiesSection title="Linhas">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={config.rows.map((row) => row.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {config.rows.map((row) => (
                <SortableRowEditor
                  key={row.id}
                  row={row}
                  columns={config.columns}
                  canRemove={config.rows.length > 1}
                  onUpdate={(nextRow) =>
                    patch({
                      rows: config.rows.map((entry) =>
                        entry.id === row.id ? nextRow : entry,
                      ),
                    })
                  }
                  onRemove={() =>
                    patch({
                      rows: config.rows.filter((entry) => entry.id !== row.id),
                    })
                  }
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        {config.rows.length < COMPARISON_TABLE_MAX_ROWS ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 w-full"
            onClick={() =>
              patch({
                rows: [
                  ...config.rows,
                  createDefaultComparisonRow(
                    "Nova linha",
                    config.columns.length,
                  ),
                ],
              })
            }
          >
            <Plus className="mr-2 size-4" />
            Adicionar linha
          </Button>
        ) : null}
      </PropertiesSection>

      <PropertiesSection title="Estilo">
        <div className="grid grid-cols-2 gap-3">
          <PropertyColorSwatchReset
            label="Header"
            value={resolvedColors.header}
            onChange={(headerColor) => patch({ headerColor })}
            onReset={() => patch({ headerColor: null })}
          />
          <PropertyColorSwatchReset
            label="Linhas"
            value={resolvedColors.rowLabel}
            onChange={(rowLabelColor) => patch({ rowLabelColor })}
            onReset={() => patch({ rowLabelColor: null })}
          />
          <PropertyColorSwatchReset
            label="Check"
            value={resolvedColors.check}
            onChange={(checkColor) => patch({ checkColor })}
            onReset={() => patch({ checkColor: null })}
          />
          <PropertyColorSwatchReset
            label="X"
            value={resolvedColors.x}
            onChange={(xColor) => patch({ xColor })}
            onReset={() => patch({ xColor: null })}
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
