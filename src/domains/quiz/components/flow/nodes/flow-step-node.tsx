"use client";

import {
  Handle,
  Position,
  useUpdateNodeInternals,
  type NodeProps,
} from "@xyflow/react";
import {
  BarChart3,
  ChevronRight,
  ArrowRight,
  Copy,
  GalleryHorizontalEnd,
  Gauge,
  HelpCircle,
  Loader2,
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
  Image as ImageIcon,
  ListChecks,
  Mic,
  MousePointerClick,
  Pencil,
  TextCursorInput,
  Trash2,
  Type,
  Video,
} from "lucide-react";
import { useEffect } from "react";
import { QuizHeaderLogo } from "@/domains/quiz/components/design/quiz-header-logo";
import {
  FlowNodeToolbar,
  FlowNodeToolbarButton,
} from "@/domains/quiz/components/flow/nodes/flow-node-toolbar";
import { useBuilderStore } from "@/domains/quiz/store/builder.store";
import type {
  ButtonWidgetConfig,
  CarouselWidgetConfig,
  InputWidgetConfig,
  LevelWidgetConfig,
  LoadingWidgetConfig,
  OptionsWidgetConfig,
  RedirectWidgetConfig,
  TestimonialsWidgetConfig,
  ChartsWidgetConfig,
  FaqWidgetConfig,
  SpacerWidgetConfig,
  BenefitsWidgetConfig,
  TrustBadgeWidgetConfig,
  WhatsappWidgetConfig,
  PricingWidgetConfig,
  CountdownWidgetConfig,
  ResultBlockWidgetConfig,
  ComparisonTableWidgetConfig,
  LogoBarWidgetConfig,
  AlertWidgetConfig,
  RatingWidgetConfig,
  ScriptWidgetConfig,
  QuizWidget,
  TextWidgetConfig,
} from "@/domains/quiz/types/builder.types";
import { richContentToPlainText } from "@/domains/quiz/utils/text-rich-content.utils";
import { getScriptPreviewLabel } from "@/domains/quiz/utils/script-widget.utils";
import {
  FLOW_STEP_NODE_WIDTH,
  FLOW_STEP_TARGET_HANDLE,
  buttonHandleId,
  optionHandleId,
  redirectHandleId,
  countdownHandleId,
} from "@/domains/quiz/types/flow.types";
import type { FlowStepNodeData } from "@/domains/quiz/utils/flow-graph.utils";
import { cn } from "@/lib/utils";

const WIDGET_ICONS = {
  text: Type,
  button: MousePointerClick,
  input: TextCursorInput,
  options: ListChecks,
  image: ImageIcon,
  carousel: GalleryHorizontalEnd,
  audio: Mic,
  video: Video,
  level: Gauge,
  loading: Loader2,
  redirect: ArrowRight,
  testimonials: MessageSquareQuote,
  charts: BarChart3,
  faq: HelpCircle,
  spacer: SeparatorHorizontal,
  benefits: ListChecks,
  "trust-badge": ShieldCheck,
  whatsapp: MessageCircle,
  pricing: Tags,
  countdown: Timer,
  "result-block": Sparkles,
  "before-after": SplitSquareHorizontal,
  "comparison-table": Table,
  "logo-bar": Building2,
  alert: Megaphone,
  rating: Star,
  embed: Frame,
  script: Code2,
} as const;

function getWidgetDisplayLabel(widget: QuizWidget): string {
  if (widget.type === "text") {
    const config = widget.config as TextWidgetConfig;
    const content =
      config.contentMode === "rich" && config.richContent
        ? richContentToPlainText(config.richContent)
        : config.content;
    return stripHtml(content) || "Texto";
  }
  if (widget.type === "button") {
    return (widget.config as ButtonWidgetConfig).label || "Botão";
  }
  if (widget.type === "input") {
    return (widget.config as InputWidgetConfig).label || "Entrada";
  }
  if (widget.type === "image") {
    return "Imagem";
  }
  if (widget.type === "carousel") {
    const count = (widget.config as CarouselWidgetConfig).slides.length;
    return `Carrossel (${count})`;
  }
  if (widget.type === "audio") {
    return "Áudio";
  }
  if (widget.type === "video") {
    return "Vídeo";
  }
  if (widget.type === "level") {
    const config = widget.config as LevelWidgetConfig;
    return config.title || "Nível";
  }
  if (widget.type === "loading") {
    const config = widget.config as LoadingWidgetConfig;
    return config.title || "Carregamento";
  }
  if (widget.type === "redirect") {
    const config = widget.config as RedirectWidgetConfig;
    return `Redirecionar · ${config.delaySeconds}s`;
  }
  if (widget.type === "testimonials") {
    const count = (widget.config as TestimonialsWidgetConfig).items.length;
    return `Depoimento (${count})`;
  }
  if (widget.type === "charts") {
    const count = (widget.config as ChartsWidgetConfig).items.length;
    return `Gráficos (${count})`;
  }
  if (widget.type === "faq") {
    const count = (widget.config as FaqWidgetConfig).items.length;
    return `FAQ (${count})`;
  }
  if (widget.type === "spacer") {
    const config = widget.config as SpacerWidgetConfig;
    return `Espaçador · ${config.heightPx}px`;
  }
  if (widget.type === "benefits") {
    const count = (widget.config as BenefitsWidgetConfig).items.length;
    return `Benefícios (${count})`;
  }
  if (widget.type === "trust-badge") {
    return (
      (widget.config as TrustBadgeWidgetConfig).title || "Selo de confiança"
    );
  }
  if (widget.type === "whatsapp") {
    return (widget.config as WhatsappWidgetConfig).buttonLabel || "WhatsApp";
  }
  if (widget.type === "pricing") {
    return (widget.config as PricingWidgetConfig).title || "Preço / oferta";
  }
  if (widget.type === "countdown") {
    const config = widget.config as CountdownWidgetConfig;
    return config.labelAbove || "Contagem regressiva";
  }
  if (widget.type === "result-block") {
    return (widget.config as ResultBlockWidgetConfig).title || "Resultado";
  }
  if (widget.type === "before-after") {
    return "Antes/depois";
  }
  if (widget.type === "comparison-table") {
    const count = (widget.config as ComparisonTableWidgetConfig).rows.length;
    return `Tabela (${count})`;
  }
  if (widget.type === "logo-bar") {
    const count = (widget.config as LogoBarWidgetConfig).items.length;
    return `Logos (${count})`;
  }
  if (widget.type === "alert") {
    return (widget.config as AlertWidgetConfig).title || "Alerta";
  }
  if (widget.type === "rating") {
    return (
      (widget.config as RatingWidgetConfig).totalReviewsText || "Avaliação"
    );
  }
  if (widget.type === "embed") {
    return "Embed";
  }
  if (widget.type === "script") {
    return getScriptPreviewLabel(
      (widget.config as ScriptWidgetConfig).embedCode,
    );
  }
  return "Opções";
}

const FLOW_HANDLE_CLASS = "flow-handle !border-primary !bg-[#0b121e]";

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, "").trim();
}

function FlowStepRow({
  icon: Icon,
  label,
  trailing,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  trailing?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full items-center gap-1.5 rounded-lg border border-slate-600/50 bg-[#111a2e] px-2 py-1.5",
        className,
      )}
    >
      <Icon className="size-3 shrink-0 text-slate-500" />
      <span className="min-w-0 flex-1 truncate text-[10px] leading-tight text-slate-300">
        {label}
      </span>
      {trailing}
    </div>
  );
}

function FlowSourceHandle({ id }: { id: string }) {
  return (
    <Handle
      type="source"
      id={id}
      position={Position.Right}
      className={cn(FLOW_HANDLE_CLASS, "!top-1/2")}
      isConnectable
    />
  );
}

function FlowWidgetRows({ widget }: { widget: QuizWidget }) {
  const Icon = WIDGET_ICONS[widget.type] ?? Type;

  if (widget.type === "options") {
    const config = widget.config as OptionsWidgetConfig;
    return (
      <>
        <FlowStepRow icon={Icon} label={getWidgetDisplayLabel(widget)} />
        {config.options.map((option) => (
          <div
            key={option.id}
            className="relative -mr-3 w-[calc(100%+0.75rem)] pr-3 pl-2"
          >
            <FlowStepRow
              icon={ListChecks}
              label={option.label || "Opção"}
              className="bg-[#0f1728]"
              trailing={
                <ChevronRight className="size-2.5 shrink-0 text-slate-500" />
              }
            />
            <FlowSourceHandle id={optionHandleId(widget.id, option.id)} />
          </div>
        ))}
      </>
    );
  }

  if (widget.type === "button") {
    return (
      <div className="relative -mr-3 w-[calc(100%+0.75rem)] pr-3">
        <FlowStepRow
          icon={Icon}
          label={getWidgetDisplayLabel(widget)}
          trailing={
            <ChevronRight className="size-2.5 shrink-0 text-slate-500" />
          }
        />
        <FlowSourceHandle id={buttonHandleId(widget.id)} />
      </div>
    );
  }

  if (widget.type === "redirect") {
    return (
      <div className="relative -mr-3 w-[calc(100%+0.75rem)] pr-3">
        <FlowStepRow
          icon={Icon}
          label={getWidgetDisplayLabel(widget)}
          trailing={
            <ChevronRight className="size-2.5 shrink-0 text-slate-500" />
          }
        />
        <FlowSourceHandle id={redirectHandleId(widget.id)} />
      </div>
    );
  }

  if (widget.type === "countdown") {
    const config = widget.config as CountdownWidgetConfig;
    if (!config.flowOutputEnabled) {
      return <FlowStepRow icon={Icon} label={getWidgetDisplayLabel(widget)} />;
    }

    return (
      <div className="relative -mr-3 w-[calc(100%+0.75rem)] pr-3">
        <FlowStepRow
          icon={Icon}
          label={getWidgetDisplayLabel(widget)}
          trailing={
            <ChevronRight className="size-2.5 shrink-0 text-slate-500" />
          }
        />
        <FlowSourceHandle id={countdownHandleId(widget.id)} />
      </div>
    );
  }

  return <FlowStepRow icon={Icon} label={getWidgetDisplayLabel(widget)} />;
}

export function FlowStepNode({ id, data, selected }: NodeProps) {
  const nodeData = data as FlowStepNodeData;
  const { step, widgets, design, stepIndex, totalSteps } = nodeData;
  const updateNodeInternals = useUpdateNodeInternals();
  const progress = totalSteps > 0 ? ((stepIndex + 1) / totalSteps) * 100 : 0;
  const steps = useBuilderStore((s) => s.steps);
  const openFlowStepEditor = useBuilderStore((s) => s.openFlowStepEditor);
  const duplicateStep = useBuilderStore((s) => s.duplicateStep);
  const deleteStep = useBuilderStore((s) => s.deleteStep);

  useEffect(() => {
    updateNodeInternals(id);
  }, [id, widgets, step.settings, updateNodeInternals]);

  return (
    <div
      className="group relative overflow-visible"
      style={{ width: FLOW_STEP_NODE_WIDTH }}
    >
      <FlowNodeToolbar visible={selected}>
        <FlowNodeToolbarButton
          label="Editar etapa"
          onClick={() => openFlowStepEditor(step.id)}
        >
          <Pencil className="size-3.5" />
        </FlowNodeToolbarButton>
        <FlowNodeToolbarButton
          label="Duplicar etapa"
          onClick={() => duplicateStep(step.id)}
        >
          <Copy className="size-3.5" />
        </FlowNodeToolbarButton>
        <FlowNodeToolbarButton
          label="Excluir etapa"
          variant="destructive"
          disabled={steps.length <= 1}
          onClick={() => deleteStep(step.id)}
        >
          <Trash2 className="size-3.5" />
        </FlowNodeToolbarButton>
      </FlowNodeToolbar>
      <div
        className={cn(
          "pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-r from-primary/0 via-primary/60 to-primary/0 opacity-0 transition-opacity duration-500",
          selected ? "opacity-100" : "group-hover:opacity-100",
        )}
        aria-hidden
      />

      <Handle
        type="target"
        id={FLOW_STEP_TARGET_HANDLE}
        position={Position.Left}
        className={cn(FLOW_HANDLE_CLASS, "!top-1/2")}
        isConnectable
      />

      <div
        className={cn(
          "relative overflow-visible rounded-2xl border bg-[#0b121e] shadow-md transition-[border-color,box-shadow] duration-300",
          selected
            ? "border-primary/45 shadow-[0_0_20px_rgba(59,130,246,0.15)]"
            : "border-slate-600/60 group-hover:border-primary/30 group-hover:shadow-[0_0_16px_rgba(59,130,246,0.1)]",
        )}
        style={{ width: FLOW_STEP_NODE_WIDTH }}
      >
        <div className="border-b border-slate-600/50 px-3 py-2">
          <p className="truncate text-center text-xs font-medium text-slate-100">
            {step.title}
          </p>
        </div>

        <div className="space-y-2 p-3">
          {step.settings.showLogo && (
            <div className="relative w-full rounded-lg border border-slate-600/50 bg-[#111a2e] px-2 py-2.5">
              <ImageIcon className="absolute top-2 left-2 size-3 text-slate-500" />
              <div className="flex justify-center">
                <QuizHeaderLogo
                  header={design.header}
                  className="max-h-6 max-w-[56px] text-base leading-none"
                />
              </div>
            </div>
          )}

          {step.settings.showProgress && (
            <div className="flex w-full items-center gap-1.5 rounded-lg border border-slate-600/50 bg-[#111a2e] px-2 py-1.5">
              <BarChart3 className="size-3 shrink-0 text-slate-500" />
              <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: design.colors.primary,
                  }}
                />
              </div>
            </div>
          )}

          {widgets.length === 0 ? (
            <p className="py-2 text-center text-[10px] text-slate-500">
              Etapa vazia
            </p>
          ) : (
            widgets.map((widget) => (
              <FlowWidgetRows key={widget.id} widget={widget} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
