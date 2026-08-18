import type {
  WidgetConfig,
  WidgetLayoutFields,
  WidgetType,
} from "@/domains/quiz/types/builder.types";
import {
  audioWidgetConfigSchema,
  buttonWidgetConfigSchema,
  carouselWidgetConfigSchema,
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
  defaultWidgetLayoutFields,
  benefitsWidgetConfigSchema,
  trustBadgeWidgetConfigSchema,
  whatsappWidgetConfigSchema,
  pricingWidgetConfigSchema,
  countdownWidgetConfigSchema,
  resultBlockWidgetConfigSchema,
  beforeAfterWidgetConfigSchema,
  comparisonTableWidgetConfigSchema,
  logoBarWidgetConfigSchema,
  alertWidgetConfigSchema,
  ratingWidgetConfigSchema,
  embedWidgetConfigSchema,
  scriptWidgetConfigSchema,
  imageWidgetConfigSchema,
  inputWidgetConfigSchema,
  optionsWidgetConfigSchema,
  levelWidgetConfigSchema,
  loadingWidgetConfigSchema,
  redirectWidgetConfigSchema,
  testimonialsWidgetConfigSchema,
  chartsWidgetConfigSchema,
  faqWidgetConfigSchema,
  spacerWidgetConfigSchema,
  textWidgetConfigSchema,
  videoWidgetConfigSchema,
} from "@/domains/quiz/types/builder.types";
import { migrateTextWidgetSource } from "@/domains/quiz/utils/text-rich-content.utils";
import { normalizeCountdownLegacyConfig } from "@/domains/quiz/utils/countdown-widget.utils";

export function generateComponentId(): string {
  return Math.random().toString(36).slice(2, 8);
}

export function withDefaultWidgetLayout<T extends Partial<WidgetLayoutFields>>(
  config: T,
): T & WidgetLayoutFields {
  return {
    ...defaultWidgetLayoutFields,
    ...config,
  };
}

const WIDGET_DEFAULTS: Record<WidgetType, WidgetConfig> = {
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

export function parseWidgetConfig(
  type: WidgetType,
  raw: unknown,
): WidgetConfig {
  const source =
    typeof raw === "object" && raw !== null
      ? (raw as Record<string, unknown>)
      : {};

  const merged = { ...WIDGET_DEFAULTS[type], ...source };

  if (type === "text") {
    const migrated = migrateTextWidgetSource(
      { ...WIDGET_DEFAULTS.text, ...source },
      source,
    );
    const parsed = textWidgetConfigSchema.safeParse(migrated);
    return parsed.success ? parsed.data : defaultTextWidgetConfig;
  }
  if (type === "input") {
    const parsed = inputWidgetConfigSchema.safeParse(merged);
    return parsed.success ? parsed.data : defaultInputWidgetConfig;
  }
  if (type === "options") {
    const parsed = optionsWidgetConfigSchema.safeParse(merged);
    return parsed.success ? parsed.data : defaultOptionsWidgetConfig;
  }
  if (type === "image") {
    const parsed = imageWidgetConfigSchema.safeParse(merged);
    return parsed.success ? parsed.data : defaultImageWidgetConfig;
  }
  if (type === "carousel") {
    const parsed = carouselWidgetConfigSchema.safeParse(merged);
    return parsed.success ? parsed.data : defaultCarouselWidgetConfig;
  }
  if (type === "audio") {
    const parsed = audioWidgetConfigSchema.safeParse(merged);
    return parsed.success ? parsed.data : defaultAudioWidgetConfig;
  }
  if (type === "video") {
    const parsed = videoWidgetConfigSchema.safeParse(merged);
    return parsed.success ? parsed.data : defaultVideoWidgetConfig;
  }
  if (type === "level") {
    const parsed = levelWidgetConfigSchema.safeParse(merged);
    return parsed.success ? parsed.data : defaultLevelWidgetConfig;
  }
  if (type === "loading") {
    const parsed = loadingWidgetConfigSchema.safeParse(merged);
    return parsed.success ? parsed.data : defaultLoadingWidgetConfig;
  }
  if (type === "redirect") {
    const parsed = redirectWidgetConfigSchema.safeParse(merged);
    return parsed.success ? parsed.data : defaultRedirectWidgetConfig;
  }
  if (type === "testimonials") {
    const parsed = testimonialsWidgetConfigSchema.safeParse(merged);
    return parsed.success ? parsed.data : defaultTestimonialsWidgetConfig;
  }
  if (type === "charts") {
    const parsed = chartsWidgetConfigSchema.safeParse(merged);
    return parsed.success ? parsed.data : defaultChartsWidgetConfig;
  }
  if (type === "faq") {
    const parsed = faqWidgetConfigSchema.safeParse(merged);
    return parsed.success ? parsed.data : defaultFaqWidgetConfig;
  }
  if (type === "spacer") {
    const parsed = spacerWidgetConfigSchema.safeParse(merged);
    return parsed.success ? parsed.data : defaultSpacerWidgetConfig;
  }
  if (type === "benefits") {
    const parsed = benefitsWidgetConfigSchema.safeParse(merged);
    return parsed.success ? parsed.data : defaultBenefitsWidgetConfig;
  }
  if (type === "trust-badge") {
    const parsed = trustBadgeWidgetConfigSchema.safeParse(merged);
    return parsed.success ? parsed.data : defaultTrustBadgeWidgetConfig;
  }
  if (type === "whatsapp") {
    const parsed = whatsappWidgetConfigSchema.safeParse(merged);
    return parsed.success ? parsed.data : defaultWhatsappWidgetConfig;
  }
  if (type === "pricing") {
    const parsed = pricingWidgetConfigSchema.safeParse(merged);
    return parsed.success ? parsed.data : defaultPricingWidgetConfig;
  }
  if (type === "countdown") {
    const normalized = normalizeCountdownLegacyConfig({
      ...WIDGET_DEFAULTS.countdown,
      ...source,
    });
    const parsed = countdownWidgetConfigSchema.safeParse(normalized);
    return parsed.success ? parsed.data : defaultCountdownWidgetConfig;
  }
  if (type === "result-block") {
    const parsed = resultBlockWidgetConfigSchema.safeParse(merged);
    return parsed.success ? parsed.data : defaultResultBlockWidgetConfig;
  }
  if (type === "before-after") {
    const parsed = beforeAfterWidgetConfigSchema.safeParse(merged);
    return parsed.success ? parsed.data : defaultBeforeAfterWidgetConfig;
  }
  if (type === "comparison-table") {
    const parsed = comparisonTableWidgetConfigSchema.safeParse(merged);
    return parsed.success ? parsed.data : defaultComparisonTableWidgetConfig;
  }
  if (type === "logo-bar") {
    const parsed = logoBarWidgetConfigSchema.safeParse(merged);
    return parsed.success ? parsed.data : defaultLogoBarWidgetConfig;
  }
  if (type === "alert") {
    const parsed = alertWidgetConfigSchema.safeParse(merged);
    return parsed.success ? parsed.data : defaultAlertWidgetConfig;
  }
  if (type === "rating") {
    const parsed = ratingWidgetConfigSchema.safeParse(merged);
    return parsed.success ? parsed.data : defaultRatingWidgetConfig;
  }
  if (type === "embed") {
    const parsed = embedWidgetConfigSchema.safeParse(merged);
    return parsed.success ? parsed.data : defaultEmbedWidgetConfig;
  }
  if (type === "script") {
    const parsed = scriptWidgetConfigSchema.safeParse(merged);
    return parsed.success ? parsed.data : defaultScriptWidgetConfig;
  }

  const parsed = buttonWidgetConfigSchema.safeParse(merged);
  return parsed.success ? parsed.data : defaultButtonWidgetConfig;
}
