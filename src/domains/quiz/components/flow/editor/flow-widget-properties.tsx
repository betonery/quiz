"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBuilderStore } from "@/domains/quiz/store/builder.store";
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
import { AudioWidgetProperties } from "@/domains/quiz/widgets/audio/audio-widget-properties";
import { ButtonWidgetProperties } from "@/domains/quiz/widgets/button/button-widget-properties";
import { FaqWidgetProperties } from "@/domains/quiz/widgets/faq/faq-widget-properties";
import { SpacerWidgetProperties } from "@/domains/quiz/widgets/spacer/spacer-widget-properties";
import { BenefitsWidgetProperties } from "@/domains/quiz/widgets/benefits/benefits-widget-properties";
import { TrustBadgeWidgetProperties } from "@/domains/quiz/widgets/trust-badge/trust-badge-widget-properties";
import { WhatsappWidgetProperties } from "@/domains/quiz/widgets/whatsapp/whatsapp-widget-properties";
import { PricingWidgetProperties } from "@/domains/quiz/widgets/pricing/pricing-widget-properties";
import { CountdownWidgetProperties } from "@/domains/quiz/widgets/countdown/countdown-widget-properties";
import { ResultBlockWidgetProperties } from "@/domains/quiz/widgets/result-block/result-block-widget-properties";
import { BeforeAfterWidgetProperties } from "@/domains/quiz/widgets/before-after/before-after-widget-properties";
import { ComparisonTableWidgetProperties } from "@/domains/quiz/widgets/comparison-table/comparison-table-widget-properties";
import { LogoBarWidgetProperties } from "@/domains/quiz/widgets/logo-bar/logo-bar-widget-properties";
import { AlertWidgetProperties } from "@/domains/quiz/widgets/alert/alert-widget-properties";
import { RatingWidgetProperties } from "@/domains/quiz/widgets/rating/rating-widget-properties";
import { EmbedWidgetProperties } from "@/domains/quiz/widgets/embed/embed-widget-properties";
import { ScriptWidgetProperties } from "@/domains/quiz/widgets/script/script-widget-properties";
import { ChartsWidgetProperties } from "@/domains/quiz/widgets/charts/charts-widget-properties";
import { CarouselWidgetProperties } from "@/domains/quiz/widgets/carousel/carousel-widget-properties";
import { ImageWidgetProperties } from "@/domains/quiz/widgets/image/image-widget-properties";
import { InputWidgetProperties } from "@/domains/quiz/widgets/input/input-widget-properties";
import { LevelWidgetProperties } from "@/domains/quiz/widgets/level/level-widget-properties";
import { LoadingWidgetProperties } from "@/domains/quiz/widgets/loading/loading-widget-properties";
import { OptionsWidgetProperties } from "@/domains/quiz/widgets/options/options-widget-properties";
import { RedirectWidgetProperties } from "@/domains/quiz/widgets/redirect/redirect-widget-properties";
import { TestimonialsWidgetProperties } from "@/domains/quiz/widgets/testimonials/testimonials-widget-properties";
import { TextWidgetProperties } from "@/domains/quiz/widgets/text/text-widget-properties";
import { VideoWidgetProperties } from "@/domains/quiz/widgets/video/video-widget-properties";

function getWidgetLabel(widget: QuizWidget): string {
  const labels: Record<QuizWidget["type"], string> = {
    text: "Texto",
    input: "Entrada",
    options: "Opções",
    button: "Botão",
    image: "Imagem",
    carousel: "Carrossel",
    audio: "Áudio",
    video: "Vídeo",
    level: "Nível",
    loading: "Carregamento",
    redirect: "Redirecionar",
    testimonials: "Depoimento",
    charts: "Gráficos",
    faq: "FAQ",
    spacer: "Espaçador",
    benefits: "Benefícios",
    "trust-badge": "Selo de confiança",
    whatsapp: "WhatsApp",
    pricing: "Preço / oferta",
    countdown: "Contagem regressiva",
    "result-block": "Resultado",
    "before-after": "Antes/depois",
    "comparison-table": "Tabela comparativa",
    "logo-bar": "Barra de logos",
    alert: "Alerta",
    rating: "Avaliação",
    embed: "Embed",
    script: "Script",
  };
  return labels[widget.type];
}

type FlowWidgetPropertiesProps = {
  widget: QuizWidget;
};

export function FlowWidgetProperties({ widget }: FlowWidgetPropertiesProps) {
  const updateWidget = useBuilderStore((s) => s.updateWidget);
  const setFeedback = useBuilderStore((s) => s.setFeedback);
  const selectWidget = useBuilderStore((s) => s.selectWidget);

  return (
    <div className="flex h-full flex-col bg-[#0a0f1a]">
      <div className="flex items-center gap-2 border-b border-slate-700/50 px-4 py-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1.5 text-slate-300 hover:bg-slate-800 hover:text-slate-100"
          onClick={() => selectWidget(null)}
        >
          <ArrowLeft className="size-4" />
          Voltar
        </Button>
        <span className="text-sm font-semibold text-slate-200">
          {getWidgetLabel(widget)}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {widget.type === "text" && (
          <TextWidgetProperties
            config={widget.config as TextWidgetConfig}
            onChange={(config) => updateWidget(widget.id, config)}
            onFeedback={setFeedback}
          />
        )}

        {widget.type === "button" && (
          <ButtonWidgetProperties
            config={widget.config as ButtonWidgetConfig}
            onChange={(config) => updateWidget(widget.id, config)}
            onFeedback={setFeedback}
          />
        )}

        {widget.type === "input" && (
          <InputWidgetProperties
            config={widget.config as InputWidgetConfig}
            onChange={(config) => updateWidget(widget.id, config)}
            onFeedback={setFeedback}
          />
        )}

        {widget.type === "options" && (
          <OptionsWidgetProperties
            config={widget.config as OptionsWidgetConfig}
            onChange={(config) => updateWidget(widget.id, config)}
            onFeedback={setFeedback}
          />
        )}

        {widget.type === "image" && (
          <ImageWidgetProperties
            config={widget.config as ImageWidgetConfig}
            onChange={(config) => updateWidget(widget.id, config)}
          />
        )}

        {widget.type === "carousel" && (
          <CarouselWidgetProperties
            config={widget.config as CarouselWidgetConfig}
            onChange={(config) => updateWidget(widget.id, config)}
          />
        )}

        {widget.type === "audio" && (
          <AudioWidgetProperties
            config={widget.config as AudioWidgetConfig}
            onChange={(config) => updateWidget(widget.id, config)}
          />
        )}

        {widget.type === "video" && (
          <VideoWidgetProperties
            config={widget.config as VideoWidgetConfig}
            onChange={(config) => updateWidget(widget.id, config)}
          />
        )}

        {widget.type === "level" && (
          <LevelWidgetProperties
            config={widget.config as LevelWidgetConfig}
            onChange={(config) => updateWidget(widget.id, config)}
          />
        )}

        {widget.type === "loading" && (
          <LoadingWidgetProperties
            config={widget.config as LoadingWidgetConfig}
            onChange={(config) => updateWidget(widget.id, config)}
          />
        )}

        {widget.type === "redirect" && (
          <RedirectWidgetProperties
            config={widget.config as RedirectWidgetConfig}
            onChange={(config) => updateWidget(widget.id, config)}
          />
        )}

        {widget.type === "testimonials" && (
          <TestimonialsWidgetProperties
            config={widget.config as TestimonialsWidgetConfig}
            onChange={(config) => updateWidget(widget.id, config)}
          />
        )}

        {widget.type === "charts" && (
          <ChartsWidgetProperties
            config={widget.config as ChartsWidgetConfig}
            onChange={(config) => updateWidget(widget.id, config)}
          />
        )}

        {widget.type === "faq" && (
          <FaqWidgetProperties
            config={widget.config as FaqWidgetConfig}
            onChange={(config) => updateWidget(widget.id, config)}
          />
        )}

        {widget.type === "spacer" && (
          <SpacerWidgetProperties
            config={widget.config as SpacerWidgetConfig}
            onChange={(config) => updateWidget(widget.id, config)}
          />
        )}

        {widget.type === "benefits" && (
          <BenefitsWidgetProperties
            config={widget.config as BenefitsWidgetConfig}
            onChange={(config) => updateWidget(widget.id, config)}
          />
        )}

        {widget.type === "trust-badge" && (
          <TrustBadgeWidgetProperties
            config={widget.config as TrustBadgeWidgetConfig}
            onChange={(config) => updateWidget(widget.id, config)}
          />
        )}

        {widget.type === "whatsapp" && (
          <WhatsappWidgetProperties
            config={widget.config as WhatsappWidgetConfig}
            onChange={(config) => updateWidget(widget.id, config)}
          />
        )}

        {widget.type === "pricing" && (
          <PricingWidgetProperties
            config={widget.config as PricingWidgetConfig}
            onChange={(config) => updateWidget(widget.id, config)}
          />
        )}

        {widget.type === "countdown" && (
          <CountdownWidgetProperties
            widgetId={widget.id}
            config={widget.config as CountdownWidgetConfig}
            onChange={(config) => updateWidget(widget.id, config)}
          />
        )}

        {widget.type === "result-block" && (
          <ResultBlockWidgetProperties
            config={widget.config as ResultBlockWidgetConfig}
            onChange={(config) => updateWidget(widget.id, config)}
          />
        )}

        {widget.type === "before-after" && (
          <BeforeAfterWidgetProperties
            config={widget.config as BeforeAfterWidgetConfig}
            onChange={(config) => updateWidget(widget.id, config)}
          />
        )}

        {widget.type === "comparison-table" && (
          <ComparisonTableWidgetProperties
            config={widget.config as ComparisonTableWidgetConfig}
            onChange={(config) => updateWidget(widget.id, config)}
          />
        )}

        {widget.type === "logo-bar" && (
          <LogoBarWidgetProperties
            config={widget.config as LogoBarWidgetConfig}
            onChange={(config) => updateWidget(widget.id, config)}
          />
        )}

        {widget.type === "alert" && (
          <AlertWidgetProperties
            config={widget.config as AlertWidgetConfig}
            onChange={(config) => updateWidget(widget.id, config)}
          />
        )}

        {widget.type === "rating" && (
          <RatingWidgetProperties
            config={widget.config as RatingWidgetConfig}
            onChange={(config) => updateWidget(widget.id, config)}
          />
        )}

        {widget.type === "embed" && (
          <EmbedWidgetProperties
            config={widget.config as EmbedWidgetConfig}
            onChange={(config) => updateWidget(widget.id, config)}
          />
        )}

        {widget.type === "script" && (
          <ScriptWidgetProperties
            config={widget.config as ScriptWidgetConfig}
            onChange={(config) => updateWidget(widget.id, config)}
          />
        )}
      </div>
    </div>
  );
}
