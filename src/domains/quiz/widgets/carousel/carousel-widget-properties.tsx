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
import { GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PropertiesSection,
  PropertyCheckbox,
  PropertyColorSwatchReset,
  PropertyField,
  PropertySelect,
} from "@/domains/quiz/components/builder/property-panel-primitives";
import { VariableInsertField } from "@/domains/quiz/components/variables/variable-insert-field";
import { WidgetGeneralProperties } from "@/domains/quiz/components/builder/widget-general-properties";
import {
  CAROUSEL_MAX_SLIDES,
  createDefaultCarouselSlide,
  type CarouselSlide,
} from "@/domains/quiz/types/media.types";
import type { CarouselWidgetConfig } from "@/domains/quiz/types/builder.types";
import { useBuilderStore } from "@/domains/quiz/store/builder.store";
import { resolveCarouselColors } from "@/domains/quiz/utils/media-widget-colors.utils";
import { MEDIA_BORDER_RADIUS_LABELS } from "@/domains/quiz/utils/media-widget-styles.utils";
import { MediaSourcePicker } from "@/domains/quiz/widgets/shared/media-source-picker";
import { cn } from "@/lib/utils";

type CarouselWidgetPropertiesProps = {
  config: CarouselWidgetConfig;
  onChange: (config: CarouselWidgetConfig) => void;
};

function SortableSlideRow({
  slide,
  onUpdate,
  onRemove,
  canRemove,
}: {
  slide: CarouselSlide;
  onUpdate: (patch: Partial<CarouselSlide>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const [editingText, setEditingText] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "rounded-lg border border-border bg-background p-2",
        isDragging && "opacity-60",
      )}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex size-8 shrink-0 cursor-grab items-center justify-center text-muted-foreground active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label="Reordenar"
        >
          <GripVertical className="size-4" />
        </button>

        <MediaSourcePicker
          mode="carousel-slide"
          value={slide}
          subfolder="carousel"
          compact
          onChange={onUpdate}
        />

        {editingText ? (
          <div className="min-w-0 flex-1">
            <VariableInsertField
              value={slide.text}
              onChange={(text) => onUpdate({ text })}
              showVariablePicker={false}
              inputClassName="h-8 text-sm"
              placeholder="Texto do slide"
              autoFocus
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditingText(true)}
            className="flex min-w-0 flex-1 items-center gap-1 truncate text-left text-sm"
          >
            <span className="truncate">{slide.text || "Texto do slide"}</span>
            <Pencil className="size-3 shrink-0 text-muted-foreground" />
          </button>
        )}

        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          className="flex size-8 shrink-0 items-center justify-center text-destructive disabled:opacity-40"
          aria-label="Remover slide"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function CarouselWidgetProperties({
  config,
  onChange,
}: CarouselWidgetPropertiesProps) {
  const design = useBuilderStore((s) => s.design);
  const resolvedColors = resolveCarouselColors(config, design);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function patch(partial: Partial<CarouselWidgetConfig>) {
    onChange({ ...config, ...partial });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = config.slides.findIndex((s) => s.id === active.id);
    const newIndex = config.slides.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    patch({ slides: arrayMove(config.slides, oldIndex, newIndex) });
  }

  function addSlide() {
    if (config.slides.length >= CAROUSEL_MAX_SLIDES) return;
    patch({
      slides: [
        ...config.slides,
        createDefaultCarouselSlide(`Slide ${config.slides.length + 1}`, "⭐"),
      ],
    });
  }

  return (
    <div className="space-y-4">
      <PropertiesSection title="Layout">
        <PropertyField label="Exibição">
          <PropertySelect
            value={config.layout}
            onChange={(value) =>
              patch({ layout: value as CarouselWidgetConfig["layout"] })
            }
          >
            <option value="image_text">Imagem e texto</option>
            <option value="image">Imagem</option>
            <option value="text">Texto</option>
          </PropertySelect>
        </PropertyField>
      </PropertiesSection>

      <PropertiesSection title="Argumentos">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={config.slides.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {config.slides.map((slide) => (
                <SortableSlideRow
                  key={slide.id}
                  slide={slide}
                  canRemove={config.slides.length > 1}
                  onUpdate={(slidePatch) =>
                    patch({
                      slides: config.slides.map((s) =>
                        s.id === slide.id ? { ...s, ...slidePatch } : s,
                      ),
                    })
                  }
                  onRemove={() =>
                    patch({
                      slides: config.slides.filter((s) => s.id !== slide.id),
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
          disabled={config.slides.length >= CAROUSEL_MAX_SLIDES}
          onClick={addSlide}
        >
          <Plus className="size-4" />
          Adicionar slide
        </Button>
      </PropertiesSection>

      <PropertiesSection title="Interação">
        <PropertyCheckbox
          label="Loop"
          checked={config.loop}
          onChange={(loop) => patch({ loop })}
        />
        <PropertyCheckbox
          label="AutoPlay"
          checked={config.autoplay}
          onChange={(autoplay) => patch({ autoplay })}
        />
        <PropertyCheckbox
          label="Paginação"
          checked={config.showPagination}
          onChange={(showPagination) => patch({ showPagination })}
        />
        {config.autoplay && (
          <PropertyField label="Delay do AutoPlay (segundos)">
            <Input
              type="number"
              min={1}
              max={30}
              value={config.autoplayDelayMs / 1000}
              onChange={(e) => {
                const seconds = Number(e.target.value);
                if (!Number.isFinite(seconds)) return;
                patch({
                  autoplayDelayMs: Math.min(
                    30000,
                    Math.max(1000, Math.round(seconds * 1000)),
                  ),
                });
              }}
              className="bg-background shadow-sm"
            />
          </PropertyField>
        )}
      </PropertiesSection>

      <PropertiesSection title="Personalização">
        <div className="grid grid-cols-2 gap-3">
          <PropertyColorSwatchReset
            label="Setas"
            value={resolvedColors.arrow}
            onChange={(arrowColor) => patch({ arrowColor })}
            onReset={() => patch({ arrowColor: null })}
          />
          <PropertyColorSwatchReset
            label="Paginação"
            value={resolvedColors.pagination}
            onChange={(paginationColor) => patch({ paginationColor })}
            onReset={() => patch({ paginationColor: null })}
          />
        </div>
        <PropertyField label="Borda das imagens">
          <div className="grid grid-cols-2 gap-2">
            {(
              Object.entries(MEDIA_BORDER_RADIUS_LABELS) as [
                CarouselWidgetConfig["imageBorderRadius"],
                string,
              ][]
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => patch({ imageBorderRadius: value })}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm transition-colors",
                  config.imageBorderRadius === value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background hover:bg-muted",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </PropertyField>
      </PropertiesSection>

      <WidgetGeneralProperties
        layout={config}
        onChange={(layout) => onChange({ ...config, ...layout })}
      />
    </div>
  );
}
