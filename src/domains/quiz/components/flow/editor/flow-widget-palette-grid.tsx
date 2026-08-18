"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  Type,
  MousePointerClick,
  TextCursorInput,
  ListChecks,
  HelpCircle,
  Image,
  BarChart3,
  Loader2,
  Video,
  Mic,
  Gauge,
  GalleryHorizontalEnd,
  ArrowRight,
  MessageSquareQuote,
  SeparatorHorizontal,
  ShieldCheck,
  Tags,
  Timer,
  MessageCircle,
  Megaphone,
  Sparkles,
  SplitSquareHorizontal,
  Table,
  Building2,
  Star,
  Frame,
  Code2,
} from "lucide-react";
import type { WidgetType } from "@/domains/quiz/types/builder.types";
import { cn } from "@/lib/utils";

type PaletteEntry = {
  type: WidgetType;
  label: string;
};

type PaletteCategory = {
  title: string;
  items: PaletteEntry[];
};

const PALETTE_CATEGORIES: PaletteCategory[] = [
  {
    title: "Texto",
    items: [
      { type: "text", label: "Texto" },
      { type: "faq", label: "FAQ" },
      { type: "benefits", label: "Benefícios" },
      { type: "spacer", label: "Espaçador" },
      { type: "alert", label: "Alerta" },
    ],
  },
  {
    title: "Mídia",
    items: [
      { type: "carousel", label: "Carrossel" },
      { type: "image", label: "Imagem" },
      { type: "audio", label: "Áudio" },
      { type: "video", label: "Vídeo" },
      { type: "before-after", label: "Antes/depois" },
      { type: "embed", label: "Embed" },
    ],
  },
  {
    title: "Relatórios",
    items: [
      { type: "level", label: "Nível" },
      { type: "loading", label: "Carregamento" },
      { type: "charts", label: "Gráficos" },
      { type: "result-block", label: "Resultado" },
    ],
  },
  {
    title: "Ação",
    items: [
      { type: "button", label: "Botão" },
      { type: "redirect", label: "Redirecionar" },
      { type: "script", label: "Script" },
      { type: "input", label: "Entrada" },
      { type: "options", label: "Opções" },
      { type: "whatsapp", label: "WhatsApp" },
    ],
  },
  {
    title: "Checkout",
    items: [
      { type: "testimonials", label: "Depoimento" },
      { type: "trust-badge", label: "Selo de confiança" },
      { type: "pricing", label: "Preço / oferta" },
      { type: "countdown", label: "Contagem regressiva" },
      { type: "comparison-table", label: "Tabela comparativa" },
      { type: "logo-bar", label: "Barra de logos" },
      { type: "rating", label: "Avaliação" },
    ],
  },
];

const ICONS: Partial<
  Record<string, React.ComponentType<{ className?: string }>>
> = {
  Texto: Type,
  FAQ: HelpCircle,
  Benefícios: ListChecks,
  Espaçador: SeparatorHorizontal,
  Botão: MousePointerClick,
  Entrada: TextCursorInput,
  Opções: ListChecks,
  Imagem: Image,
  Carrossel: GalleryHorizontalEnd,
  Áudio: Mic,
  Vídeo: Video,
  Nível: Gauge,
  Carregamento: Loader2,
  Gráficos: BarChart3,
  Redirecionar: ArrowRight,
  Depoimento: MessageSquareQuote,
  "Selo de confiança": ShieldCheck,
  "Preço / oferta": Tags,
  "Contagem regressiva": Timer,
  WhatsApp: MessageCircle,
  Alerta: Megaphone,
  Resultado: Sparkles,
  "Antes/depois": SplitSquareHorizontal,
  Embed: Frame,
  Script: Code2,
  "Tabela comparativa": Table,
  "Barra de logos": Building2,
  Avaliação: Star,
};

function DraggablePaletteItem({
  type,
  label,
}: {
  type: WidgetType;
  label: string;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `palette::${type}`,
      data: { type, source: "palette" },
    });

  const Icon = ICONS[label] ?? Type;

  return (
    <button
      ref={setNodeRef}
      type="button"
      {...listeners}
      {...attributes}
      className={cn(
        "flex w-full items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/70 px-2.5 py-2 text-left text-xs text-slate-200 transition-colors hover:border-primary/50 hover:bg-slate-800/80",
        isDragging && "opacity-50",
      )}
      style={{ transform: CSS.Translate.toString(transform) }}
    >
      <Icon className="size-4 shrink-0 text-slate-400" />
      <span className="min-w-0 truncate leading-tight">{label}</span>
    </button>
  );
}

export function FlowWidgetPaletteGrid() {
  return (
    <div className="h-full overflow-y-auto p-3">
      <div className="grid grid-cols-3 gap-3">
        {PALETTE_CATEGORIES.map((category) => (
          <section key={category.title} className="min-w-0 space-y-2">
            <h3 className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
              {category.title}
            </h3>
            <div className="flex flex-col gap-1.5">
              {category.items.map((item) => (
                <DraggablePaletteItem
                  key={`${category.title}-${item.label}`}
                  type={item.type}
                  label={item.label}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
