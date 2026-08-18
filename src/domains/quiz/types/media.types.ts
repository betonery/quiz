import { z } from "zod";
import { generateId } from "@/domains/quiz/utils/generate-id";

export const mediaSourceTypeSchema = z.enum(["url", "file"]);
export type MediaSourceType = z.infer<typeof mediaSourceTypeSchema>;

export const mediaImageSourceSchema = z.object({
  sourceType: mediaSourceTypeSchema,
  url: z.string().optional(),
  filePath: z.string().optional(),
});

export type MediaImageSource = z.infer<typeof mediaImageSourceSchema>;

export const mediaAudioSourceSchema = z.object({
  sourceType: mediaSourceTypeSchema,
  url: z.string().optional(),
  filePath: z.string().optional(),
});

export type MediaAudioSource = z.infer<typeof mediaAudioSourceSchema>;

export const mediaAvatarSourceSchema = mediaImageSourceSchema;
export type MediaAvatarSource = MediaImageSource;

export const mediaWidthSchema = z.enum(["full", "sm", "md", "lg", "xl"]);
export type MediaWidth = z.infer<typeof mediaWidthSchema>;

export const mediaBorderRadiusSchema = z.enum(["sm", "md", "lg", "xl"]);
export type MediaBorderRadius = z.infer<typeof mediaBorderRadiusSchema>;

export const carouselSlideImageTypeSchema = z.enum([
  "emoji",
  "url",
  "file",
  "none",
]);
export type CarouselSlideImageType = z.infer<
  typeof carouselSlideImageTypeSchema
>;

export const carouselSlideSchema = z.object({
  id: z.string(),
  text: z.string(),
  imageType: carouselSlideImageTypeSchema,
  emoji: z.string().optional(),
  url: z.string().optional(),
  filePath: z.string().optional(),
});

export type CarouselSlide = z.infer<typeof carouselSlideSchema>;

export const carouselLayoutSchema = z.enum(["image_text", "image", "text"]);
export type CarouselLayout = z.infer<typeof carouselLayoutSchema>;

export const videoAspectSchema = z.enum(["standard", "vertical"]);
export type VideoAspect = z.infer<typeof videoAspectSchema>;

export const CAROUSEL_MAX_SLIDES = 20;
export const TESTIMONIALS_MAX_ITEMS = 20;

export const testimonialItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  handle: z.string(),
  text: z.string(),
  rating: z.number().min(1).max(5),
  imageType: carouselSlideImageTypeSchema,
  emoji: z.string().optional(),
  url: z.string().optional(),
  filePath: z.string().optional(),
});

export type TestimonialItem = z.infer<typeof testimonialItemSchema>;

export const testimonialsLayoutSchema = z.enum(["list", "slide", "grid"]);
export type TestimonialsLayout = z.infer<typeof testimonialsLayoutSchema>;

export const CHARTS_MAX_ITEMS = 12;

export const chartTypeSchema = z.enum(["bar", "circular"]);
export type ChartType = z.infer<typeof chartTypeSchema>;

export const chartColorSchema = z.enum([
  "theme",
  "red",
  "green",
  "blue",
  "yellow",
  "orange",
  "black",
]);
export type ChartColor = z.infer<typeof chartColorSchema>;

export const chartsLayoutSchema = z.enum(["list", "cols2", "cols3", "cols4"]);
export type ChartsLayout = z.infer<typeof chartsLayoutSchema>;

export const chartsDispositionSchema = z.enum(["chart_legend", "legend_chart"]);
export type ChartsDisposition = z.infer<typeof chartsDispositionSchema>;

export const chartLegendContentModeSchema = z.enum(["plain", "rich"]);
export type ChartLegendContentMode = z.infer<
  typeof chartLegendContentModeSchema
>;

export const chartItemSchema = z.object({
  id: z.string(),
  chartType: chartTypeSchema,
  color: chartColorSchema,
  value: z.number().min(0).max(100),
  legend: z.string(),
  legendContentMode: chartLegendContentModeSchema.default("plain"),
  legendRichContent: z.string().nullable().default(null),
});

export type ChartItem = z.infer<typeof chartItemSchema>;

export const FAQ_MAX_ITEMS = 20;

export const faqItemSchema = z.object({
  id: z.string(),
  question: z.string(),
  answer: z.string(),
});

export type FaqItem = z.infer<typeof faqItemSchema>;

export const defaultMediaImageSource: MediaImageSource = {
  sourceType: "url",
  url: "",
};

export const defaultMediaAudioSource: MediaAudioSource = {
  sourceType: "url",
  url: "",
};

export const defaultMediaAvatarSource: MediaAvatarSource = {
  sourceType: "url",
  url: "",
};

export function createDefaultCarouselSlide(
  text = "Slide",
  emoji = "✨",
): CarouselSlide {
  return {
    id: generateId(),
    text,
    imageType: "emoji",
    emoji,
  };
}

export function createDefaultTestimonialItem(
  name = "Mateus Vodan",
  handle = "@mateusvodan",
  text = "Lorem ipsum dolor sit amet",
  emoji = "🚀",
): TestimonialItem {
  return {
    id: generateId(),
    name,
    handle,
    text,
    rating: 5,
    imageType: "emoji",
    emoji,
  };
}

export function createDefaultChartItem(
  chartType: ChartType = "bar",
  value = 35,
  color: ChartColor = "theme",
): ChartItem {
  return {
    id: generateId(),
    chartType,
    color,
    value,
    legend: "Lorem ipsum dolor",
    legendContentMode: "plain",
    legendRichContent: null,
  };
}

export function createDefaultFaqItem(
  question = "Lorem ipsum dolor?",
  answer = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
): FaqItem {
  return {
    id: generateId(),
    question,
    answer,
  };
}

export const BENEFITS_MAX_ITEMS = 20;

export const benefitIconSchema = z.enum(["check", "x", "star", "dot"]);
export type BenefitIcon = z.infer<typeof benefitIconSchema>;

export const benefitItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  icon: benefitIconSchema,
});

export type BenefitItem = z.infer<typeof benefitItemSchema>;

export function createDefaultBenefitItem(
  text = "Benefício exclusivo do produto",
  icon: BenefitIcon = "check",
): BenefitItem {
  return {
    id: generateId(),
    text,
    icon,
  };
}

export const trustBadgePresetSchema = z.enum([
  "guarantee",
  "security",
  "delivery",
  "certificate",
  "custom",
]);
export type TrustBadgePreset = z.infer<typeof trustBadgePresetSchema>;

export const trustBadgeLayoutSchema = z.enum(["card", "inline"]);
export type TrustBadgeLayout = z.infer<typeof trustBadgeLayoutSchema>;

export const trustBadgeIconTypeSchema = z.enum(["preset", "emoji", "image"]);
export type TrustBadgeIconType = z.infer<typeof trustBadgeIconTypeSchema>;

export const RESULT_BLOCK_MAX_VARIANTS = 8;

export const resultBlockModeSchema = z.enum(["single", "by_score"]);
export type ResultBlockMode = z.infer<typeof resultBlockModeSchema>;

export const resultBlockLayoutSchema = z.enum(["card", "hero"]);
export type ResultBlockLayout = z.infer<typeof resultBlockLayoutSchema>;

export const resultBlockVariantSchema = z.object({
  id: z.string(),
  minScore: z.number().nullable(),
  maxScore: z.number().nullable(),
  title: z.string(),
  description: z.string(),
  imageSource: mediaImageSourceSchema,
  showImage: z.boolean(),
});

export type ResultBlockVariant = z.infer<typeof resultBlockVariantSchema>;

export function createDefaultResultBlockVariant(
  title = "Perfil equilibrado",
  description = "Você está no caminho certo para alcançar seus objetivos.",
  minScore: number | null = 0,
  maxScore: number | null = 100,
): ResultBlockVariant {
  return {
    id: generateId(),
    minScore,
    maxScore,
    title,
    description,
    imageSource: { ...defaultMediaImageSource },
    showImage: false,
  };
}

export const beforeAfterLayoutSchema = z.enum(["columns", "slider"]);
export type BeforeAfterLayout = z.infer<typeof beforeAfterLayoutSchema>;

export const beforeAfterSideSchema = z.object({
  imageType: carouselSlideImageTypeSchema,
  emoji: z.string().optional(),
  url: z.string().optional(),
  filePath: z.string().optional(),
  caption: z.string(),
});

export type BeforeAfterSide = z.infer<typeof beforeAfterSideSchema>;

export function createDefaultBeforeAfterSide(
  caption = "Antes",
  emoji = "😔",
): BeforeAfterSide {
  return {
    imageType: "emoji",
    emoji,
    caption,
  };
}

export const COMPARISON_TABLE_MAX_ROWS = 20;
export const COMPARISON_TABLE_MAX_COLUMNS = 3;

export const comparisonCellTypeSchema = z.enum(["check", "x", "text"]);
export type ComparisonCellType = z.infer<typeof comparisonCellTypeSchema>;

export const comparisonCellSchema = z.object({
  type: comparisonCellTypeSchema,
  text: z.string().nullable(),
});

export type ComparisonCell = z.infer<typeof comparisonCellSchema>;

export const comparisonColumnSchema = z.object({
  id: z.string(),
  label: z.string(),
  highlighted: z.boolean(),
});

export type ComparisonColumn = z.infer<typeof comparisonColumnSchema>;

export const comparisonRowSchema = z.object({
  id: z.string(),
  label: z.string(),
  cells: z.array(comparisonCellSchema),
});

export type ComparisonRow = z.infer<typeof comparisonRowSchema>;

export function createDefaultComparisonColumn(
  label: string,
  highlighted = false,
): ComparisonColumn {
  return {
    id: generateId(),
    label,
    highlighted,
  };
}

export function createDefaultComparisonRow(
  label: string,
  columnCount: number,
): ComparisonRow {
  return {
    id: generateId(),
    label,
    cells: Array.from({ length: columnCount }, () => ({
      type: "check" as const,
      text: null,
    })),
  };
}

export const LOGO_BAR_MAX_ITEMS = 12;

export const logoBarModeSchema = z.enum(["static", "carousel"]);
export type LogoBarMode = z.infer<typeof logoBarModeSchema>;

export const logoBarItemSchema = z.object({
  id: z.string(),
  imageSource: mediaImageSourceSchema,
  alt: z.string(),
});

export type LogoBarItem = z.infer<typeof logoBarItemSchema>;

export function createDefaultLogoBarItem(alt = "Logo parceiro"): LogoBarItem {
  return {
    id: generateId(),
    imageSource: { ...defaultMediaImageSource },
    alt,
  };
}

export const alertVariantSchema = z.enum([
  "info",
  "success",
  "warning",
  "promo",
]);
export type AlertVariant = z.infer<typeof alertVariantSchema>;

export const alertIconSchema = z.enum(["info", "check", "alert", "gift"]);
export type AlertIcon = z.infer<typeof alertIconSchema>;

export const ratingLayoutSchema = z.enum(["inline", "stacked"]);
export type RatingLayout = z.infer<typeof ratingLayoutSchema>;

export const embedAspectSchema = z.enum(["16:9", "4:3", "1:1", "custom"]);
export type EmbedAspect = z.infer<typeof embedAspectSchema>;
