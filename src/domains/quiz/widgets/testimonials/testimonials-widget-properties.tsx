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
import { GripVertical, Plus, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PropertiesSection,
  PropertyCheckbox,
  PropertyField,
  PropertySelect,
} from "@/domains/quiz/components/builder/property-panel-primitives";
import { VariableInsertField } from "@/domains/quiz/components/variables/variable-insert-field";
import { WidgetGeneralProperties } from "@/domains/quiz/components/builder/widget-general-properties";
import {
  TESTIMONIALS_MAX_ITEMS,
  createDefaultTestimonialItem,
  type TestimonialItem,
} from "@/domains/quiz/types/media.types";
import type { TestimonialsWidgetConfig } from "@/domains/quiz/types/builder.types";
import { clampTestimonialRating } from "@/domains/quiz/utils/testimonials-widget.utils";
import { MediaSourcePicker } from "@/domains/quiz/widgets/shared/media-source-picker";
import { cn } from "@/lib/utils";

type TestimonialsWidgetPropertiesProps = {
  config: TestimonialsWidgetConfig;
  onChange: (config: TestimonialsWidgetConfig) => void;
};

function StarRatingPicker({
  rating,
  onChange,
}: {
  rating: number;
  onChange: (rating: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, index) => {
        const value = index + 1;
        return (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            className="rounded p-0.5 transition hover:scale-110"
            aria-label={`${value} estrelas`}
          >
            <Star
              className={cn(
                "size-4",
                value <= rating
                  ? "fill-amber-400 text-amber-400"
                  : "fill-transparent text-slate-400",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

function SortableTestimonialRow({
  item,
  onUpdate,
  onRemove,
  canRemove,
}: {
  item: TestimonialItem;
  onUpdate: (patch: Partial<TestimonialItem>) => void;
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

      <div className="flex justify-center">
        <MediaSourcePicker
          mode="carousel-slide"
          value={{
            id: item.id,
            text: item.text,
            imageType: item.imageType,
            emoji: item.emoji,
            url: item.url,
            filePath: item.filePath,
          }}
          subfolder="testimonials"
          onChange={onUpdate}
        />
      </div>

      <PropertyField label="Nome">
        <VariableInsertField
          value={item.name}
          onChange={(name) => onUpdate({ name })}
          placeholder="Mateus Vodan"
        />
      </PropertyField>

      <PropertyField label="Usuário">
        <VariableInsertField
          value={item.handle}
          onChange={(handle) => onUpdate({ handle })}
          placeholder="@mateusvodan"
        />
      </PropertyField>

      <PropertyField label="Conteúdo">
        <VariableInsertField
          value={item.text}
          onChange={(text) => onUpdate({ text })}
          placeholder="Lorem ipsum dolor sit amet"
          multiline={true}
        />
      </PropertyField>

      <PropertyField label="Avaliação">
        <StarRatingPicker
          rating={item.rating}
          onChange={(rating) =>
            onUpdate({ rating: clampTestimonialRating(rating) })
          }
        />
      </PropertyField>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          className="flex size-8 items-center justify-center text-destructive disabled:opacity-40"
          aria-label="Remover depoimento"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function TestimonialsWidgetProperties({
  config,
  onChange,
}: TestimonialsWidgetPropertiesProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function patch(partial: Partial<TestimonialsWidgetConfig>) {
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
    if (config.items.length >= TESTIMONIALS_MAX_ITEMS) return;
    patch({
      items: [
        ...config.items,
        createDefaultTestimonialItem(
          "Novo depoimento",
          "@usuario",
          "Texto do depoimento",
        ),
      ],
    });
  }

  return (
    <div className="space-y-4">
      <PropertiesSection title="Layout">
        <PropertyField label="Layout">
          <PropertySelect
            value={config.layout}
            onChange={(value) =>
              patch({ layout: value as TestimonialsWidgetConfig["layout"] })
            }
          >
            <option value="list">Em Lista</option>
            <option value="slide">Slide</option>
            <option value="grid">Grade</option>
          </PropertySelect>
        </PropertyField>
      </PropertiesSection>

      <PropertiesSection title="Depoimentos">
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
                <SortableTestimonialRow
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
          disabled={config.items.length >= TESTIMONIALS_MAX_ITEMS}
          onClick={addItem}
        >
          <Plus className="size-4" />
          Adicionar depoimento
        </Button>
      </PropertiesSection>

      {config.layout === "slide" && (
        <PropertiesSection title="Slide">
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
      )}

      <WidgetGeneralProperties
        layout={config}
        onChange={(layout) => onChange({ ...config, ...layout })}
      />
    </div>
  );
}
