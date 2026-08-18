import type {
  WidgetConfig,
  WidgetType,
} from "@/domains/quiz/types/builder.types";
import {
  defaultAudioWidgetConfig,
  defaultButtonWidgetConfig,
  defaultCarouselWidgetConfig,
  defaultImageWidgetConfig,
  defaultInputWidgetConfig,
  defaultOptionsWidgetConfig,
  defaultLevelWidgetConfig,
  defaultLoadingWidgetConfig,
  defaultRedirectWidgetConfig,
  defaultTestimonialsWidgetConfig,
  defaultChartsWidgetConfig,
  defaultBenefitsWidgetConfig,
  defaultTrustBadgeWidgetConfig,
  defaultWhatsappWidgetConfig,
  defaultPricingWidgetConfig,
  defaultCountdownWidgetConfig,
  defaultResultBlockWidgetConfig,
  defaultBeforeAfterWidgetConfig,
  defaultComparisonTableWidgetConfig,
  defaultLogoBarWidgetConfig,
  defaultAlertWidgetConfig,
  defaultRatingWidgetConfig,
  defaultEmbedWidgetConfig,
  defaultScriptWidgetConfig,
  defaultFaqWidgetConfig,
  defaultSpacerWidgetConfig,
  defaultTextWidgetConfig,
  defaultVideoWidgetConfig,
} from "@/domains/quiz/types/builder.types";
import { generateComponentId } from "@/domains/quiz/utils/widget-config.utils";

export type WidgetPaletteItem = {
  type: WidgetType;
  label: string;
};

export const WIDGET_PALETTE: WidgetPaletteItem[] = [
  { type: "audio", label: "Audio" },
  { type: "button", label: "Botão" },
  { type: "loading", label: "Carregamento" },
  { type: "carousel", label: "Carrosel" },
  { type: "testimonials", label: "Depoimentos" },
  { type: "charts", label: "Gráficos" },
  { type: "faq", label: "FAQ" },
  { type: "benefits", label: "Benefícios" },
  { type: "spacer", label: "Espaçador" },
  { type: "trust-badge", label: "Selo de confiança" },
  { type: "pricing", label: "Preço / oferta" },
  { type: "countdown", label: "Contagem regressiva" },
  { type: "whatsapp", label: "WhatsApp" },
  { type: "alert", label: "Alerta" },
  { type: "result-block", label: "Resultado" },
  { type: "before-after", label: "Antes/depois" },
  { type: "embed", label: "Embed" },
  { type: "comparison-table", label: "Tabela comparativa" },
  { type: "logo-bar", label: "Barra de logos" },
  { type: "rating", label: "Avaliação" },
  { type: "input", label: "Entrada" },
  { type: "image", label: "Imagem" },
  { type: "level", label: "Nível" },
  { type: "options", label: "Opções" },
  { type: "redirect", label: "Redirecionar" },
  { type: "script", label: "Script" },
  { type: "text", label: "Texto" },
  { type: "video", label: "Video" },
];

const DEFAULT_CONFIGS: Record<WidgetType, WidgetConfig> = {
  text: defaultTextWidgetConfig,
  button: defaultButtonWidgetConfig,
  input: defaultInputWidgetConfig,
  options: defaultOptionsWidgetConfig,
  image: defaultImageWidgetConfig,
  carousel: defaultCarouselWidgetConfig,
  audio: defaultAudioWidgetConfig,
  video: defaultVideoWidgetConfig,
  level: defaultLevelWidgetConfig,
  loading: defaultLoadingWidgetConfig,
  redirect: defaultRedirectWidgetConfig,
  testimonials: defaultTestimonialsWidgetConfig,
  charts: defaultChartsWidgetConfig,
  faq: defaultFaqWidgetConfig,
  benefits: defaultBenefitsWidgetConfig,
  spacer: defaultSpacerWidgetConfig,
  "trust-badge": defaultTrustBadgeWidgetConfig,
  whatsapp: defaultWhatsappWidgetConfig,
  pricing: defaultPricingWidgetConfig,
  countdown: defaultCountdownWidgetConfig,
  "result-block": defaultResultBlockWidgetConfig,
  "before-after": defaultBeforeAfterWidgetConfig,
  "comparison-table": defaultComparisonTableWidgetConfig,
  "logo-bar": defaultLogoBarWidgetConfig,
  alert: defaultAlertWidgetConfig,
  rating: defaultRatingWidgetConfig,
  embed: defaultEmbedWidgetConfig,
  script: defaultScriptWidgetConfig,
};

export function getDefaultWidgetConfig(type: WidgetType): WidgetConfig {
  return {
    ...DEFAULT_CONFIGS[type],
    componentId: generateComponentId(),
  };
}
