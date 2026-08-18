"use client";

import type {
  AudioWidgetConfig,
  ButtonWidgetConfig,
  CarouselWidgetConfig,
  ImageWidgetConfig,
  InputWidgetConfig,
  OptionsWidgetConfig,
  LevelWidgetConfig,
  LoadingWidgetConfig,
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
  BeforeAfterWidgetConfig,
  ComparisonTableWidgetConfig,
  LogoBarWidgetConfig,
  AlertWidgetConfig,
  RatingWidgetConfig,
  EmbedWidgetConfig,
  ScriptWidgetConfig,
  QuizWidget,
  TextWidgetConfig,
  VideoWidgetConfig,
} from "@/domains/quiz/types/builder.types";
import type { QuizDesignSettings } from "@/domains/quiz/types/design.types";
import type { OptionItem } from "@/domains/quiz/types/builder.types";
import { parseOptionsAnswer } from "@/domains/quiz/utils/options-validation.utils";
import { AudioWidgetRenderer } from "@/domains/quiz/widgets/audio/audio-widget-renderer";
import { ButtonWidgetRenderer } from "@/domains/quiz/widgets/button/button-widget-renderer";
import { FaqWidgetRenderer } from "@/domains/quiz/widgets/faq/faq-widget-renderer";
import { SpacerWidgetRenderer } from "@/domains/quiz/widgets/spacer/spacer-widget-renderer";
import { BenefitsWidgetRenderer } from "@/domains/quiz/widgets/benefits/benefits-widget-renderer";
import { TrustBadgeWidgetRenderer } from "@/domains/quiz/widgets/trust-badge/trust-badge-widget-renderer";
import { WhatsappWidgetRenderer } from "@/domains/quiz/widgets/whatsapp/whatsapp-widget-renderer";
import { PricingWidgetRenderer } from "@/domains/quiz/widgets/pricing/pricing-widget-renderer";
import { CountdownWidgetRenderer } from "@/domains/quiz/widgets/countdown/countdown-widget-renderer";
import { ResultBlockWidgetRenderer } from "@/domains/quiz/widgets/result-block/result-block-widget-renderer";
import { BeforeAfterWidgetRenderer } from "@/domains/quiz/widgets/before-after/before-after-widget-renderer";
import { ComparisonTableWidgetRenderer } from "@/domains/quiz/widgets/comparison-table/comparison-table-widget-renderer";
import { AlertWidgetRenderer } from "@/domains/quiz/widgets/alert/alert-widget-renderer";
import { RatingWidgetRenderer } from "@/domains/quiz/widgets/rating/rating-widget-renderer";
import { EmbedWidgetRenderer } from "@/domains/quiz/widgets/embed/embed-widget-renderer";
import { ScriptWidgetRenderer } from "@/domains/quiz/widgets/script/script-widget-renderer";
import { ChartsWidgetRenderer } from "@/domains/quiz/widgets/charts/charts-widget-renderer";
import { ImageWidgetRenderer } from "@/domains/quiz/widgets/image/image-widget-renderer";
import { InputWidgetRenderer } from "@/domains/quiz/widgets/input/input-widget-renderer";
import { LevelWidgetRenderer } from "@/domains/quiz/widgets/level/level-widget-renderer";
import { LoadingWidgetRenderer } from "@/domains/quiz/widgets/loading/loading-widget-renderer";
import { OptionsWidgetRenderer } from "@/domains/quiz/widgets/options/options-widget-renderer";
import { RedirectWidgetRenderer } from "@/domains/quiz/widgets/redirect/redirect-widget-renderer";
import { TextWidgetRenderer } from "@/domains/quiz/widgets/text/text-widget-renderer";
import { VideoWidgetRenderer } from "@/domains/quiz/widgets/video/video-widget-renderer";
import dynamic from "next/dynamic";

// Widgets baseados em embla-carousel (carrossel/depoimentos/barra de logos)
// raramente aparecem na primeira etapa. Carregá-los sob demanda mantém o
// embla-carousel fora do First Load JS do funil, reduzindo o bundle inicial.
// `ssr` permanece habilitado para que o conteúdo continue no HTML inicial (FCP).
const CarouselWidgetRenderer = dynamic(() =>
  import("@/domains/quiz/widgets/carousel/carousel-widget-renderer").then(
    (m) => m.CarouselWidgetRenderer,
  ),
);
const TestimonialsWidgetRenderer = dynamic(() =>
  import("@/domains/quiz/widgets/testimonials/testimonials-widget-renderer").then(
    (m) => m.TestimonialsWidgetRenderer,
  ),
);
const LogoBarWidgetRenderer = dynamic(() =>
  import("@/domains/quiz/widgets/logo-bar/logo-bar-widget-renderer").then(
    (m) => m.LogoBarWidgetRenderer,
  ),
);

type WidgetRendererByTypeProps = {
  widget: QuizWidget;
  design: QuizDesignSettings;
  mode?: "edit" | "preview" | "player";
  variables?: Record<string, unknown>;
  highlightVariables?: boolean;
  readOnly?: boolean;
  answers?: Record<string, string>;
  errors?: Record<string, string | null>;
  onAnswerChange?: (widgetId: string, value: string) => void;
  onOptionsChange?: (widgetId: string, value: string | string[]) => void;
  onOptionSelect?: (
    widgetId: string,
    option: OptionItem,
    config: OptionsWidgetConfig,
  ) => void;
  onButtonClick?: (widgetId: string) => void;
  onRedirectTrigger?: (widgetId: string) => void;
  onCountdownExpire?: (widgetId: string) => void;
  quizSlug?: string;
  // Sinaliza conteúdo acima da dobra (primeira etapa) para priorizar o LCP.
  priority?: boolean;
};

export function WidgetRendererByType({
  widget,
  design,
  mode = "edit",
  variables,
  highlightVariables = false,
  readOnly = false,
  answers = {},
  errors = {},
  onAnswerChange,
  onOptionsChange,
  onOptionSelect,
  onButtonClick,
  onRedirectTrigger,
  onCountdownExpire,
  quizSlug,
  priority = false,
}: WidgetRendererByTypeProps) {
  const isPlayer = mode === "player";

  switch (widget.type) {
    case "text":
      return (
        <TextWidgetRenderer
          config={widget.config as TextWidgetConfig}
          variables={isPlayer ? variables : undefined}
          highlightVariables={highlightVariables}
          className={
            isPlayer ? "[font-family:var(--quiz-font-body)]" : undefined
          }
          style={
            isPlayer && (widget.config as TextWidgetConfig).color === "#0f172a"
              ? { color: design.colors.titles }
              : undefined
          }
        />
      );
    case "input":
      return (
        <InputWidgetRenderer
          config={widget.config as InputWidgetConfig}
          design={design}
          value={answers[widget.id] ?? ""}
          onChange={
            onAnswerChange
              ? (value) => onAnswerChange(widget.id, value)
              : undefined
          }
          error={errors[widget.id] ?? null}
          readOnly={readOnly || !isPlayer}
          highlightVariables={highlightVariables}
        />
      );
    case "options":
      return (
        <OptionsWidgetRenderer
          config={widget.config as OptionsWidgetConfig}
          design={design}
          value={isPlayer ? parseOptionsAnswer(answers[widget.id]) : undefined}
          onChange={
            onOptionsChange
              ? (value) => onOptionsChange(widget.id, value)
              : undefined
          }
          onOptionSelect={
            onOptionSelect
              ? (option) =>
                  onOptionSelect(
                    widget.id,
                    option,
                    widget.config as OptionsWidgetConfig,
                  )
              : undefined
          }
          error={errors[widget.id] ?? null}
          readOnly={readOnly || !isPlayer}
          highlightVariables={highlightVariables}
        />
      );
    case "image":
      return (
        <ImageWidgetRenderer
          config={widget.config as ImageWidgetConfig}
          priority={priority}
        />
      );
    case "video":
      return (
        <VideoWidgetRenderer config={widget.config as VideoWidgetConfig} />
      );
    case "carousel":
      return (
        <CarouselWidgetRenderer
          config={widget.config as CarouselWidgetConfig}
          design={design}
          variables={variables}
        />
      );
    case "audio":
      return (
        <AudioWidgetRenderer
          config={widget.config as AudioWidgetConfig}
          design={design}
        />
      );
    case "level":
      return (
        <LevelWidgetRenderer
          config={widget.config as LevelWidgetConfig}
          design={design}
          variables={variables}
          animate={true}
          highlightVariables={highlightVariables}
        />
      );
    case "loading":
      return (
        <LoadingWidgetRenderer
          config={widget.config as LoadingWidgetConfig}
          design={design}
          variables={variables}
          animate={true}
          highlightVariables={highlightVariables}
        />
      );
    case "redirect":
      return (
        <RedirectWidgetRenderer
          config={widget.config as RedirectWidgetConfig}
          mode={mode}
          onTrigger={
            onRedirectTrigger ? () => onRedirectTrigger(widget.id) : undefined
          }
        />
      );
    case "testimonials":
      return (
        <TestimonialsWidgetRenderer
          config={widget.config as TestimonialsWidgetConfig}
          design={design}
          variables={variables}
        />
      );
    case "charts":
      return (
        <ChartsWidgetRenderer
          config={widget.config as ChartsWidgetConfig}
          design={design}
          variables={variables}
          animate={isPlayer}
        />
      );
    case "faq":
      return (
        <FaqWidgetRenderer
          config={widget.config as FaqWidgetConfig}
          design={design}
          variables={variables}
        />
      );
    case "spacer":
      return (
        <SpacerWidgetRenderer
          config={widget.config as SpacerWidgetConfig}
          mode={mode}
        />
      );
    case "benefits":
      return (
        <BenefitsWidgetRenderer
          config={widget.config as BenefitsWidgetConfig}
          design={design}
          variables={isPlayer ? variables : undefined}
          highlightVariables={highlightVariables}
        />
      );
    case "trust-badge":
      return (
        <TrustBadgeWidgetRenderer
          config={widget.config as TrustBadgeWidgetConfig}
          design={design}
          variables={isPlayer ? variables : undefined}
          highlightVariables={highlightVariables}
        />
      );
    case "whatsapp":
      return (
        <WhatsappWidgetRenderer
          config={widget.config as WhatsappWidgetConfig}
          design={design}
          variables={isPlayer ? variables : undefined}
          highlightVariables={highlightVariables}
          mode={mode}
        />
      );
    case "pricing":
      return (
        <PricingWidgetRenderer
          config={widget.config as PricingWidgetConfig}
          design={design}
          variables={isPlayer ? variables : undefined}
          highlightVariables={highlightVariables}
          mode={mode}
        />
      );
    case "countdown":
      return (
        <CountdownWidgetRenderer
          config={widget.config as CountdownWidgetConfig}
          design={design}
          widgetId={widget.id}
          quizSlug={quizSlug}
          variables={isPlayer ? variables : undefined}
          highlightVariables={highlightVariables}
          mode={mode}
          onExpire={
            onCountdownExpire ? () => onCountdownExpire(widget.id) : undefined
          }
        />
      );
    case "result-block":
      return (
        <ResultBlockWidgetRenderer
          config={widget.config as ResultBlockWidgetConfig}
          design={design}
          variables={isPlayer ? variables : undefined}
          highlightVariables={highlightVariables}
        />
      );
    case "before-after":
      return (
        <BeforeAfterWidgetRenderer
          config={widget.config as BeforeAfterWidgetConfig}
          design={design}
          variables={isPlayer ? variables : undefined}
          highlightVariables={highlightVariables}
          mode={mode}
        />
      );
    case "comparison-table":
      return (
        <ComparisonTableWidgetRenderer
          config={widget.config as ComparisonTableWidgetConfig}
          design={design}
          variables={isPlayer ? variables : undefined}
          highlightVariables={highlightVariables}
        />
      );
    case "logo-bar":
      return (
        <LogoBarWidgetRenderer
          config={widget.config as LogoBarWidgetConfig}
          design={design}
          variables={isPlayer ? variables : undefined}
          highlightVariables={highlightVariables}
        />
      );
    case "alert":
      return (
        <AlertWidgetRenderer
          config={widget.config as AlertWidgetConfig}
          design={design}
          variables={isPlayer ? variables : undefined}
          highlightVariables={highlightVariables}
        />
      );
    case "rating":
      return (
        <RatingWidgetRenderer
          config={widget.config as RatingWidgetConfig}
          design={design}
          variables={isPlayer ? variables : undefined}
          highlightVariables={highlightVariables}
        />
      );
    case "embed":
      return (
        <EmbedWidgetRenderer
          config={widget.config as EmbedWidgetConfig}
          mode={mode}
        />
      );
    case "script":
      return (
        <ScriptWidgetRenderer
          config={widget.config as ScriptWidgetConfig}
          mode={mode}
          widgetId={widget.id}
        />
      );
    case "button":
    default:
      return (
        <ButtonWidgetRenderer
          config={widget.config as ButtonWidgetConfig}
          onClick={onButtonClick ? () => onButtonClick(widget.id) : undefined}
          highlightVariables={highlightVariables}
        />
      );
  }
}
