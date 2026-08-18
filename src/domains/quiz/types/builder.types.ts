import { z } from "zod";
import { generateId } from "@/domains/quiz/utils/generate-id";
import {
  CAROUSEL_MAX_SLIDES,
  CHARTS_MAX_ITEMS,
  FAQ_MAX_ITEMS,
  BENEFITS_MAX_ITEMS,
  TESTIMONIALS_MAX_ITEMS,
  benefitItemSchema,
  createDefaultBenefitItem,
  carouselLayoutSchema,
  carouselSlideSchema,
  chartItemSchema,
  chartsDispositionSchema,
  chartsLayoutSchema,
  createDefaultCarouselSlide,
  createDefaultChartItem,
  createDefaultFaqItem,
  createDefaultTestimonialItem,
  faqItemSchema,
  testimonialItemSchema,
  testimonialsLayoutSchema,
  trustBadgeIconTypeSchema,
  trustBadgeLayoutSchema,
  trustBadgePresetSchema,
  resultBlockModeSchema,
  resultBlockLayoutSchema,
  resultBlockVariantSchema,
  RESULT_BLOCK_MAX_VARIANTS,
  createDefaultResultBlockVariant,
  beforeAfterLayoutSchema,
  beforeAfterSideSchema,
  createDefaultBeforeAfterSide,
  comparisonColumnSchema,
  comparisonRowSchema,
  COMPARISON_TABLE_MAX_ROWS,
  createDefaultComparisonColumn,
  createDefaultComparisonRow,
  logoBarModeSchema,
  logoBarItemSchema,
  LOGO_BAR_MAX_ITEMS,
  createDefaultLogoBarItem,
  alertVariantSchema,
  alertIconSchema,
  ratingLayoutSchema,
  embedAspectSchema,
  defaultMediaAudioSource,
  defaultMediaAvatarSource,
  defaultMediaImageSource,
  mediaAudioSourceSchema,
  mediaAvatarSourceSchema,
  mediaBorderRadiusSchema,
  mediaImageSourceSchema,
  mediaWidthSchema,
  videoAspectSchema,
} from "@/domains/quiz/types/media.types";

export const widgetTypeSchema = z.enum([
  "text",
  "button",
  "input",
  "options",
  "image",
  "carousel",
  "audio",
  "video",
  "level",
  "loading",
  "redirect",
  "testimonials",
  "charts",
  "faq",
  "spacer",
  "benefits",
  "trust-badge",
  "whatsapp",
  "pricing",
  "countdown",
  "result-block",
  "before-after",
  "comparison-table",
  "logo-bar",
  "alert",
  "rating",
  "embed",
  "script",
]);
export type WidgetType = z.infer<typeof widgetTypeSchema>;

export const stepSettingsSchema = z.object({
  showLogo: z.boolean(),
  showProgress: z.boolean(),
  allowBack: z.boolean(),
});

export type StepSettings = z.infer<typeof stepSettingsSchema>;

export const defaultStepSettings: StepSettings = {
  showLogo: true,
  showProgress: true,
  allowBack: true,
};

export const widgetLayoutFieldsSchema = z.object({
  componentId: z.string().optional(),
  maxWidth: z.number().min(20).max(100),
  horizontalAlign: z.enum(["start", "center", "end"]),
});

export type WidgetLayoutFields = z.infer<typeof widgetLayoutFieldsSchema>;

export const defaultWidgetLayoutFields: WidgetLayoutFields = {
  maxWidth: 100,
  horizontalAlign: "start",
};

export const textContentModeSchema = z.enum(["plain", "rich"]);
export type TextContentMode = z.infer<typeof textContentModeSchema>;

export const textWidgetConfigSchema = z
  .object({
    content: z.string(),
    contentMode: textContentModeSchema.default("plain"),
    richContent: z.string().nullable().default(null),
    fontSizePx: z.number().min(12).max(72).default(16),
    letterSpacingPx: z.number().min(-2).max(20).default(0),
    fontWeight: z.enum(["normal", "semibold", "bold"]),
    color: z.string(),
    align: z.enum(["left", "center", "right"]),
  })
  .merge(widgetLayoutFieldsSchema);

export type TextWidgetConfig = z.infer<typeof textWidgetConfigSchema>;

export const defaultTextWidgetConfig: TextWidgetConfig = {
  content: "Seu texto aqui",
  contentMode: "plain",
  richContent: null,
  fontSizePx: 16,
  letterSpacingPx: 0,
  fontWeight: "normal",
  color: "#0f172a",
  align: "left",
  ...defaultWidgetLayoutFields,
};

export const buttonVariantSchema = z.enum([
  "solid",
  "outline",
  "ghost",
  "soft",
  "critical",
  "custom",
]);
export type ButtonVariant = z.infer<typeof buttonVariantSchema>;

export const buttonAnimationSchema = z.enum([
  "none",
  "pulse",
  "shake",
  "bounce",
  "glow",
  "wiggle",
]);
export type ButtonAnimation = z.infer<typeof buttonAnimationSchema>;

export const buttonWidgetConfigSchema = z
  .object({
    label: z.string(),
    action: z.literal("next_step"),
    destinationStepId: z.string().nullable(),
    variant: buttonVariantSchema.default("solid"),
    backgroundColor: z.string(),
    textColor: z.string(),
    borderColor: z.string(),
    animation: buttonAnimationSchema.default("none"),
  })
  .merge(widgetLayoutFieldsSchema);

export type ButtonWidgetConfig = z.infer<typeof buttonWidgetConfigSchema>;

export const defaultButtonWidgetConfig: ButtonWidgetConfig = {
  label: "Continuar",
  action: "next_step",
  destinationStepId: null,
  variant: "solid",
  backgroundColor: "#0f172a",
  textColor: "#ffffff",
  borderColor: "#0f172a",
  animation: "none",
  ...defaultWidgetLayoutFields,
};

export const quizVariableValueTypeSchema = z.enum(["string", "list"]);
export type QuizVariableValueType = z.infer<typeof quizVariableValueTypeSchema>;

export const quizVariableSchema = z.object({
  key: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
  label: z.string().optional(),
  valueType: quizVariableValueTypeSchema.optional().default("string"),
});

export type QuizVariable = z.infer<typeof quizVariableSchema>;

export const defaultQuizVariables: QuizVariable[] = [];

export const inputTypeSchema = z.enum([
  "text",
  "email",
  "phone",
  "password",
  "number",
]);
export type InputType = z.infer<typeof inputTypeSchema>;

export const inputSizeSchema = z.enum(["sm", "md", "lg"]);
export type InputSize = z.infer<typeof inputSizeSchema>;

export const inputWidgetConfigSchema = z
  .object({
    showLabel: z.boolean(),
    label: z.string(),
    placeholder: z.string(),
    required: z.boolean(),
    inputType: inputTypeSchema,
    placeholderAlign: z.enum(["left", "center", "right"]),
    fontSize: inputSizeSchema,
    paddingSize: inputSizeSchema,
    placeholderColor: z.string().nullable(),
    backgroundColor: z.string().nullable(),
    borderColor: z.string().nullable(),
    variableKey: z.string().default(""),
  })
  .merge(widgetLayoutFieldsSchema);

export type InputWidgetConfig = z.infer<typeof inputWidgetConfigSchema>;

export const defaultInputWidgetConfig: InputWidgetConfig = {
  showLabel: true,
  label: "Seu e-mail",
  placeholder: "Digite aqui...",
  required: true,
  inputType: "email",
  placeholderAlign: "left",
  fontSize: "md",
  paddingSize: "md",
  placeholderColor: null,
  backgroundColor: null,
  borderColor: null,
  variableKey: "",
  ...defaultWidgetLayoutFields,
};

export const optionImageTypeSchema = z.enum(["emoji", "url", "file", "none"]);
export type OptionImageType = z.infer<typeof optionImageTypeSchema>;

export const optionItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  imageType: optionImageTypeSchema,
  emoji: z.string().optional(),
  url: z.string().optional(),
  filePath: z.string().optional(),
  destinationStepId: z.string().nullable(),
  validateFields: z.boolean(),
});

export type OptionItem = z.infer<typeof optionItemSchema>;

export const optionsLayoutSchema = z.enum(["list", "cols2", "cols3", "cols4"]);
export const optionsDirectionSchema = z.enum(["horizontal", "vertical"]);
export const optionsDispositionSchema = z.enum([
  "image_text",
  "text_image",
  "text_only",
]);
export const optionsBorderRadiusSchema = z.enum(["sm", "md", "lg", "xl"]);
export const optionsShadowSchema = z.enum(["none", "sm", "md", "lg"]);
export const optionsSpacingSchema = z.enum(["sm", "md", "lg", "xl"]);
export const optionsDetailSchema = z.enum(["none", "confirmation"]);
export const optionsVariantSchema = z.enum(["simple", "outlined"]);
export const optionsImageSizeSchema = z.enum(["sm", "md", "lg", "xl"]);
export type OptionsImageSize = z.infer<typeof optionsImageSizeSchema>;

export const OPTIONS_MAX_COUNT = 14;

export const optionsWidgetConfigSchema = z
  .object({
    layout: optionsLayoutSchema,
    direction: optionsDirectionSchema,
    disposition: optionsDispositionSchema,
    imageSize: optionsImageSizeSchema,
    options: z.array(optionItemSchema).min(1).max(OPTIONS_MAX_COUNT),
    multipleChoice: z.boolean(),
    required: z.boolean(),
    autoAdvance: z.boolean(),
    borderRadius: optionsBorderRadiusSchema,
    shadow: optionsShadowSchema,
    spacing: optionsSpacingSchema,
    detail: optionsDetailSchema,
    variant: optionsVariantSchema,
    backgroundColor: z.string().nullable(),
    textColor: z.string().nullable(),
    borderColor: z.string().nullable(),
    selectedBackgroundColor: z.string().nullable(),
    selectedBorderColor: z.string().nullable(),
    selectedTextColor: z.string().nullable(),
    variableKey: z.string().default(""),
  })
  .merge(widgetLayoutFieldsSchema)
  .transform((data) =>
    data.multipleChoice && data.autoAdvance
      ? { ...data, autoAdvance: false }
      : data,
  );

export type OptionsWidgetConfig = z.infer<typeof optionsWidgetConfigSchema>;

function createDefaultOptionItem(label: string, emoji: string): OptionItem {
  return {
    id: generateId(),
    label,
    imageType: "emoji",
    emoji,
    destinationStepId: null,
    validateFields: true,
  };
}

export const defaultOptionsWidgetConfig: OptionsWidgetConfig = {
  layout: "list",
  direction: "horizontal",
  disposition: "image_text",
  imageSize: "md",
  options: [
    createDefaultOptionItem("Opção 1", "👋"),
    createDefaultOptionItem("Opção 2", "😢"),
  ],
  multipleChoice: false,
  required: true,
  autoAdvance: false,
  borderRadius: "xl",
  shadow: "md",
  spacing: "xl",
  detail: "confirmation",
  variant: "simple",
  backgroundColor: null,
  textColor: null,
  borderColor: null,
  selectedBackgroundColor: null,
  selectedBorderColor: null,
  selectedTextColor: null,
  variableKey: "",
  ...defaultWidgetLayoutFields,
};

export const imageWidgetConfigSchema = z
  .object({
    source: mediaImageSourceSchema,
    width: mediaWidthSchema,
    borderRadius: mediaBorderRadiusSchema,
  })
  .merge(widgetLayoutFieldsSchema);

export type ImageWidgetConfig = z.infer<typeof imageWidgetConfigSchema>;

export const defaultImageWidgetConfig: ImageWidgetConfig = {
  source: { ...defaultMediaImageSource },
  width: "full",
  borderRadius: "lg",
  ...defaultWidgetLayoutFields,
};

export const carouselWidgetConfigSchema = z
  .object({
    layout: carouselLayoutSchema,
    slides: z.array(carouselSlideSchema).min(1).max(CAROUSEL_MAX_SLIDES),
    loop: z.boolean(),
    autoplay: z.boolean(),
    showPagination: z.boolean(),
    autoplayDelayMs: z.number().min(1000).max(30000),
    arrowColor: z.string().nullable(),
    paginationColor: z.string().nullable(),
    imageBorderRadius: mediaBorderRadiusSchema,
  })
  .merge(widgetLayoutFieldsSchema);

export type CarouselWidgetConfig = z.infer<typeof carouselWidgetConfigSchema>;

export const defaultCarouselWidgetConfig: CarouselWidgetConfig = {
  layout: "image_text",
  slides: [
    createDefaultCarouselSlide("Primeiro slide", "✨"),
    createDefaultCarouselSlide("Segundo slide", "🚀"),
  ],
  loop: true,
  autoplay: false,
  showPagination: true,
  autoplayDelayMs: 2000,
  arrowColor: null,
  paginationColor: null,
  imageBorderRadius: "lg",
  ...defaultWidgetLayoutFields,
};

export const audioWidgetConfigSchema = z
  .object({
    source: mediaAudioSourceSchema,
    sentAtLabel: z.string(),
    showAvatar: z.boolean().default(true),
    avatar: mediaAvatarSourceSchema,
    bubbleColor: z.string().nullable(),
    playButtonColor: z.string().nullable(),
    progressColor: z.string().nullable(),
    timeColor: z.string().nullable(),
  })
  .merge(widgetLayoutFieldsSchema);

export type AudioWidgetConfig = z.infer<typeof audioWidgetConfigSchema>;

export const defaultAudioWidgetConfig: AudioWidgetConfig = {
  source: { ...defaultMediaAudioSource },
  sentAtLabel: "14:32",
  showAvatar: true,
  avatar: { ...defaultMediaAvatarSource },
  bubbleColor: null,
  playButtonColor: null,
  progressColor: null,
  timeColor: null,
  ...defaultWidgetLayoutFields,
};

export const videoWidgetConfigSchema = z
  .object({
    embedCode: z.string(),
    aspect: videoAspectSchema,
  })
  .merge(widgetLayoutFieldsSchema);

export type VideoWidgetConfig = z.infer<typeof videoWidgetConfigSchema>;

export const defaultVideoWidgetConfig: VideoWidgetConfig = {
  embedCode: "",
  aspect: "standard",
  ...defaultWidgetLayoutFields,
};

export const levelSpacingSchema = z.enum(["none", "sm", "md", "lg"]);
export type LevelSpacing = z.infer<typeof levelSpacingSchema>;

export const levelStyleSchema = z.enum(["default"]);
export type LevelStyle = z.infer<typeof levelStyleSchema>;

export const levelWidgetConfigSchema = z
  .object({
    title: z.string(),
    subtitle: z.string(),
    percentage: z.number().min(0).max(100),
    indicatorText: z.string(),
    legends: z.string(),
    spacing: levelSpacingSchema,
    style: levelStyleSchema,
    showMeter: z.boolean(),
    showProgress: z.boolean(),
    fillColor: z.string().nullable(),
    textColor: z.string().nullable(),
    borderColor: z.string().nullable(),
  })
  .merge(widgetLayoutFieldsSchema);

export type LevelWidgetConfig = z.infer<typeof levelWidgetConfigSchema>;

export const defaultLevelWidgetConfig: LevelWidgetConfig = {
  title: "Nível",
  subtitle: "Lorem ipsum",
  percentage: 69,
  indicatorText: "Você está aqui",
  legends: "Começando,Inicio,Médio,Alto,Muito alto",
  spacing: "none",
  style: "default",
  showMeter: true,
  showProgress: true,
  fillColor: null,
  textColor: null,
  borderColor: null,
  ...defaultWidgetLayoutFields,
};

export const loadingWidgetConfigSchema = z
  .object({
    durationSeconds: z.number().min(1).max(120),
    limitPercent: z.number().min(0).max(100),
    title: z.string(),
    description: z.string(),
    showTitle: z.boolean(),
    showMeter: z.boolean(),
    fillColor: z.string().nullable(),
    textColor: z.string().nullable(),
    trackColor: z.string().nullable(),
  })
  .merge(widgetLayoutFieldsSchema);

export type LoadingWidgetConfig = z.infer<typeof loadingWidgetConfigSchema>;

export const defaultLoadingWidgetConfig: LoadingWidgetConfig = {
  durationSeconds: 5,
  limitPercent: 60,
  title: "Carregando...",
  description: "Lorem ipsum dolor sit amet.",
  showTitle: true,
  showMeter: true,
  fillColor: null,
  textColor: null,
  trackColor: null,
  ...defaultWidgetLayoutFields,
};

export const redirectWidgetConfigSchema = z
  .object({
    delaySeconds: z.number().min(1).max(120),
  })
  .merge(widgetLayoutFieldsSchema);

export type RedirectWidgetConfig = z.infer<typeof redirectWidgetConfigSchema>;

export const defaultRedirectWidgetConfig: RedirectWidgetConfig = {
  delaySeconds: 3,
  ...defaultWidgetLayoutFields,
};

export const testimonialsWidgetConfigSchema = z
  .object({
    layout: testimonialsLayoutSchema,
    items: z.array(testimonialItemSchema).min(1).max(TESTIMONIALS_MAX_ITEMS),
    loop: z.boolean(),
    autoplay: z.boolean(),
    showPagination: z.boolean(),
    autoplayDelayMs: z.number().min(1000).max(30000),
  })
  .merge(widgetLayoutFieldsSchema);

export type TestimonialsWidgetConfig = z.infer<
  typeof testimonialsWidgetConfigSchema
>;

export const defaultTestimonialsWidgetConfig: TestimonialsWidgetConfig = {
  layout: "list",
  items: [createDefaultTestimonialItem()],
  loop: true,
  autoplay: false,
  showPagination: true,
  autoplayDelayMs: 5000,
  ...defaultWidgetLayoutFields,
};

export const chartsWidgetConfigSchema = z
  .object({
    layout: chartsLayoutSchema,
    disposition: chartsDispositionSchema,
    items: z.array(chartItemSchema).min(1).max(CHARTS_MAX_ITEMS),
  })
  .merge(widgetLayoutFieldsSchema);

export type ChartsWidgetConfig = z.infer<typeof chartsWidgetConfigSchema>;

export const defaultChartsWidgetConfig: ChartsWidgetConfig = {
  layout: "cols2",
  disposition: "chart_legend",
  items: [
    createDefaultChartItem("bar", 35, "theme"),
    createDefaultChartItem("circular", 50, "blue"),
  ],
  ...defaultWidgetLayoutFields,
};

export const faqWidgetConfigSchema = z
  .object({
    firstItemOpen: z.boolean(),
    items: z.array(faqItemSchema).min(1).max(FAQ_MAX_ITEMS),
  })
  .merge(widgetLayoutFieldsSchema);

export type FaqWidgetConfig = z.infer<typeof faqWidgetConfigSchema>;

export const defaultFaqWidgetConfig: FaqWidgetConfig = {
  firstItemOpen: true,
  items: [
    createDefaultFaqItem(),
    createDefaultFaqItem(
      "Como funciona o produto?",
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    ),
  ],
  ...defaultWidgetLayoutFields,
};

export const spacerWidgetConfigSchema = z
  .object({
    heightPx: z.number().min(1).max(500),
    backgroundColor: z.string().nullable(),
  })
  .merge(widgetLayoutFieldsSchema);

export type SpacerWidgetConfig = z.infer<typeof spacerWidgetConfigSchema>;

export const defaultSpacerWidgetConfig: SpacerWidgetConfig = {
  heightPx: 24,
  backgroundColor: null,
  ...defaultWidgetLayoutFields,
};

export const benefitsLayoutSchema = z.enum(["compact", "cards"]);
export type BenefitsLayout = z.infer<typeof benefitsLayoutSchema>;

export const benefitsWidgetConfigSchema = z
  .object({
    layout: benefitsLayoutSchema,
    items: z.array(benefitItemSchema).min(1).max(BENEFITS_MAX_ITEMS),
    iconColor: z.string().nullable(),
    textColor: z.string().nullable(),
    cardBackgroundColor: z.string().nullable(),
  })
  .merge(widgetLayoutFieldsSchema);

export type BenefitsWidgetConfig = z.infer<typeof benefitsWidgetConfigSchema>;

export const defaultBenefitsWidgetConfig: BenefitsWidgetConfig = {
  layout: "compact",
  items: [
    createDefaultBenefitItem("Acesso imediato ao conteúdo"),
    createDefaultBenefitItem("Suporte exclusivo por WhatsApp"),
    createDefaultBenefitItem("Garantia incondicional de 7 dias"),
  ],
  iconColor: null,
  textColor: null,
  cardBackgroundColor: null,
  ...defaultWidgetLayoutFields,
};

export const trustBadgeWidgetConfigSchema = z
  .object({
    preset: trustBadgePresetSchema,
    layout: trustBadgeLayoutSchema,
    iconType: trustBadgeIconTypeSchema,
    emoji: z.string().nullable(),
    imageSource: mediaImageSourceSchema,
    title: z.string(),
    subtitle: z.string(),
    backgroundColor: z.string().nullable(),
    borderColor: z.string().nullable(),
    iconColor: z.string().nullable(),
    titleColor: z.string().nullable(),
    subtitleColor: z.string().nullable(),
  })
  .merge(widgetLayoutFieldsSchema);

export type TrustBadgeWidgetConfig = z.infer<
  typeof trustBadgeWidgetConfigSchema
>;

export const defaultTrustBadgeWidgetConfig: TrustBadgeWidgetConfig = {
  preset: "guarantee",
  layout: "card",
  iconType: "preset",
  emoji: "🛡️",
  imageSource: { ...defaultMediaImageSource },
  title: "Garantia de 7 dias",
  subtitle: "Devolução do seu dinheiro",
  backgroundColor: null,
  borderColor: null,
  iconColor: null,
  titleColor: null,
  subtitleColor: null,
  ...defaultWidgetLayoutFields,
};

export const whatsappWidgetConfigSchema = z
  .object({
    phoneNumber: z.string().min(8).max(20),
    message: z.string(),
    buttonLabel: z.string(),
    openInNewTab: z.boolean(),
    backgroundColor: z.string().nullable(),
    textColor: z.string().nullable(),
    iconColor: z.string().nullable(),
    showIcon: z.boolean(),
  })
  .merge(widgetLayoutFieldsSchema);

export type WhatsappWidgetConfig = z.infer<typeof whatsappWidgetConfigSchema>;

export const defaultWhatsappWidgetConfig: WhatsappWidgetConfig = {
  phoneNumber: "11999999999",
  message: "Olá! Vim pelo funil e gostaria de mais informações.",
  buttonLabel: "Falar no WhatsApp",
  openInNewTab: true,
  backgroundColor: null,
  textColor: null,
  iconColor: null,
  showIcon: true,
  ...defaultWidgetLayoutFields,
};

export const pricingWidgetConfigSchema = z
  .object({
    title: z.string().nullable(),
    subtitle: z.string().nullable(),
    priceCents: z.number().min(0),
    comparePriceCents: z.number().nullable(),
    showComparePrice: z.boolean(),
    badgeText: z.string().nullable(),
    badgeBackgroundColor: z.string().nullable(),
    badgeTextColor: z.string().nullable(),
    showInstallments: z.boolean(),
    installmentCount: z.number().min(2).max(24).nullable(),
    installmentCents: z.number().nullable(),
    ctaLabel: z.string().nullable(),
    ctaUrl: z.string().nullable(),
    ctaOpenInNewTab: z.boolean(),
    highlightColor: z.string().nullable(),
    backgroundColor: z.string().nullable(),
    titleColor: z.string().nullable(),
    priceColor: z.string().nullable(),
    comparePriceColor: z.string().nullable(),
    subtitleColor: z.string().nullable(),
  })
  .merge(widgetLayoutFieldsSchema);

export type PricingWidgetConfig = z.infer<typeof pricingWidgetConfigSchema>;

export const defaultPricingWidgetConfig: PricingWidgetConfig = {
  title: "Oferta especial",
  subtitle: "Acesso completo ao produto",
  priceCents: 49700,
  comparePriceCents: 99700,
  showComparePrice: true,
  badgeText: "50% OFF",
  badgeBackgroundColor: null,
  badgeTextColor: null,
  showInstallments: true,
  installmentCount: 12,
  installmentCents: null,
  ctaLabel: "Quero garantir minha vaga",
  ctaUrl: null,
  ctaOpenInNewTab: true,
  highlightColor: null,
  backgroundColor: null,
  titleColor: null,
  priceColor: null,
  comparePriceColor: null,
  subtitleColor: null,
  ...defaultWidgetLayoutFields,
};

export const countdownModeSchema = z.enum(["session", "fixed"]);
export type CountdownMode = z.infer<typeof countdownModeSchema>;

export const countdownWidgetConfigSchema = z
  .object({
    mode: countdownModeSchema,
    sessionDurationSeconds: z.number().min(1).max(86400),
    targetDateIso: z.string().nullable(),
    labelAbove: z.string(),
    labelBelow: z.string().nullable(),
    showDays: z.boolean(),
    flowOutputEnabled: z.boolean(),
    expiredMessage: z.string().nullable(),
    digitBackgroundColor: z.string().nullable(),
    digitTextColor: z.string().nullable(),
    labelColor: z.string().nullable(),
    separatorColor: z.string().nullable(),
    accentColor: z.string().nullable(),
  })
  .merge(widgetLayoutFieldsSchema);

export type CountdownWidgetConfig = z.infer<typeof countdownWidgetConfigSchema>;

export const defaultCountdownWidgetConfig: CountdownWidgetConfig = {
  mode: "session",
  sessionDurationSeconds: 900,
  targetDateIso: null,
  labelAbove: "Oferta expira em:",
  labelBelow: null,
  showDays: false,
  flowOutputEnabled: false,
  expiredMessage: "Esta oferta expirou.",
  digitBackgroundColor: null,
  digitTextColor: null,
  labelColor: null,
  separatorColor: null,
  accentColor: null,
  ...defaultWidgetLayoutFields,
};

export const alertWidgetConfigSchema = z
  .object({
    variant: alertVariantSchema,
    title: z.string(),
    body: z.string(),
    showIcon: z.boolean(),
    icon: alertIconSchema.nullable(),
    backgroundColor: z.string().nullable(),
    borderColor: z.string().nullable(),
    titleColor: z.string().nullable(),
    bodyColor: z.string().nullable(),
    iconColor: z.string().nullable(),
  })
  .merge(widgetLayoutFieldsSchema);

export type AlertWidgetConfig = z.infer<typeof alertWidgetConfigSchema>;

export const defaultAlertWidgetConfig: AlertWidgetConfig = {
  variant: "promo",
  title: "Bônus exclusivo!",
  body: "Garanta acesso imediato ao material complementar por tempo limitado.",
  showIcon: true,
  icon: null,
  backgroundColor: null,
  borderColor: null,
  titleColor: null,
  bodyColor: null,
  iconColor: null,
  ...defaultWidgetLayoutFields,
};

export const ratingWidgetConfigSchema = z
  .object({
    score: z.number().min(0).max(5),
    useVariableScore: z.boolean(),
    scoreVariableKey: z.string().nullable(),
    totalReviewsText: z.string(),
    subtitle: z.string().nullable(),
    showHalfStars: z.boolean(),
    layout: ratingLayoutSchema,
    starColor: z.string().nullable(),
    scoreColor: z.string().nullable(),
    subtitleColor: z.string().nullable(),
  })
  .merge(widgetLayoutFieldsSchema);

export type RatingWidgetConfig = z.infer<typeof ratingWidgetConfigSchema>;

export const defaultRatingWidgetConfig: RatingWidgetConfig = {
  score: 4.9,
  useVariableScore: false,
  scoreVariableKey: null,
  totalReviewsText: "2.847 avaliações",
  subtitle: "Nota média dos alunos",
  showHalfStars: true,
  layout: "stacked",
  starColor: null,
  scoreColor: null,
  subtitleColor: null,
  ...defaultWidgetLayoutFields,
};

export const logoBarWidgetConfigSchema = z
  .object({
    mode: logoBarModeSchema,
    items: z.array(logoBarItemSchema).min(1).max(LOGO_BAR_MAX_ITEMS),
    title: z.string().nullable(),
    showTitle: z.boolean().default(true),
    grayscale: z.boolean(),
    itemHeightPx: z.number().min(24).max(80),
    autoplay: z.boolean(),
    autoplayDelayMs: z.number().min(1000).max(30000),
    titleColor: z.string().nullable(),
  })
  .merge(widgetLayoutFieldsSchema);

export type LogoBarWidgetConfig = z.infer<typeof logoBarWidgetConfigSchema>;

export const defaultLogoBarWidgetConfig: LogoBarWidgetConfig = {
  mode: "static",
  items: [
    createDefaultLogoBarItem("Parceiro 1"),
    createDefaultLogoBarItem("Parceiro 2"),
    createDefaultLogoBarItem("Parceiro 3"),
  ],
  title: "Visto em",
  showTitle: true,
  grayscale: true,
  itemHeightPx: 40,
  autoplay: true,
  autoplayDelayMs: 3000,
  titleColor: null,
  ...defaultWidgetLayoutFields,
};

export const resultBlockWidgetConfigSchema = z
  .object({
    mode: resultBlockModeSchema,
    scoreVariableKey: z.string().nullable(),
    title: z.string(),
    description: z.string(),
    imageSource: mediaImageSourceSchema,
    showImage: z.boolean(),
    variants: z.array(resultBlockVariantSchema).max(RESULT_BLOCK_MAX_VARIANTS),
    defaultVariantId: z.string(),
    showScoreBadge: z.boolean(),
    layout: resultBlockLayoutSchema,
    backgroundColor: z.string().nullable(),
    borderColor: z.string().nullable(),
    titleColor: z.string().nullable(),
    descriptionColor: z.string().nullable(),
    badgeColor: z.string().nullable(),
    badgeTextColor: z.string().nullable(),
  })
  .merge(widgetLayoutFieldsSchema);

export type ResultBlockWidgetConfig = z.infer<
  typeof resultBlockWidgetConfigSchema
>;

const defaultResultBlockVariant = createDefaultResultBlockVariant();

export const defaultResultBlockWidgetConfig: ResultBlockWidgetConfig = {
  mode: "single",
  scoreVariableKey: "pontuacao",
  title: "Seu perfil: {{perfil}}",
  description:
    "Com base nas suas respostas, identificamos o perfil ideal para o seu momento.",
  imageSource: { ...defaultMediaImageSource },
  showImage: false,
  variants: [defaultResultBlockVariant],
  defaultVariantId: defaultResultBlockVariant.id,
  showScoreBadge: true,
  layout: "card",
  backgroundColor: null,
  borderColor: null,
  titleColor: null,
  descriptionColor: null,
  badgeColor: null,
  badgeTextColor: null,
  ...defaultWidgetLayoutFields,
};

export const beforeAfterWidgetConfigSchema = z
  .object({
    layout: beforeAfterLayoutSchema,
    before: beforeAfterSideSchema,
    after: beforeAfterSideSchema,
    beforeLabel: z.string(),
    afterLabel: z.string(),
    disclaimer: z.string().nullable(),
    sliderInitialPosition: z.number().min(0).max(100),
    imageBorderRadius: mediaBorderRadiusSchema,
    labelColor: z.string().nullable(),
    disclaimerColor: z.string().nullable(),
    accentColor: z.string().nullable(),
  })
  .merge(widgetLayoutFieldsSchema);

export type BeforeAfterWidgetConfig = z.infer<
  typeof beforeAfterWidgetConfigSchema
>;

export const defaultBeforeAfterWidgetConfig: BeforeAfterWidgetConfig = {
  layout: "columns",
  before: createDefaultBeforeAfterSide("Antes", "😔"),
  after: createDefaultBeforeAfterSide("Depois", "😊"),
  beforeLabel: "Antes",
  afterLabel: "Depois",
  disclaimer: "Resultados podem variar de pessoa para pessoa.",
  sliderInitialPosition: 50,
  imageBorderRadius: "lg",
  labelColor: null,
  disclaimerColor: null,
  accentColor: null,
  ...defaultWidgetLayoutFields,
};

export const comparisonTableWidgetConfigSchema = z
  .object({
    columns: z.array(comparisonColumnSchema).min(2).max(3),
    rows: z.array(comparisonRowSchema).min(1).max(COMPARISON_TABLE_MAX_ROWS),
    showRowLabels: z.boolean(),
    cornerLabel: z.string().default(""),
    headerColor: z.string().nullable(),
    rowLabelColor: z.string().nullable(),
    highlightColumnColor: z.string().nullable(),
    checkColor: z.string().nullable(),
    xColor: z.string().nullable(),
    borderColor: z.string().nullable(),
    textColor: z.string().nullable(),
  })
  .merge(widgetLayoutFieldsSchema);

export type ComparisonTableWidgetConfig = z.infer<
  typeof comparisonTableWidgetConfigSchema
>;

const defaultComparisonColumns = [
  createDefaultComparisonColumn("Básico"),
  createDefaultComparisonColumn("Premium", true),
];

export const defaultComparisonTableWidgetConfig: ComparisonTableWidgetConfig = {
  columns: defaultComparisonColumns,
  rows: [
    createDefaultComparisonRow("Acesso completo", 2),
    createDefaultComparisonRow("Suporte prioritário", 2),
    createDefaultComparisonRow("Bônus exclusivos", 2),
    createDefaultComparisonRow("Certificado", 2),
  ],
  showRowLabels: true,
  cornerLabel: "",
  headerColor: null,
  rowLabelColor: null,
  highlightColumnColor: null,
  checkColor: null,
  xColor: null,
  borderColor: null,
  textColor: null,
  ...defaultWidgetLayoutFields,
};

export const embedWidgetConfigSchema = z
  .object({
    embedInput: z.string(),
    aspectRatio: embedAspectSchema,
    customHeightPx: z.number().min(200).max(1200).nullable(),
    title: z.string().nullable(),
    allowFullscreen: z.boolean(),
  })
  .merge(widgetLayoutFieldsSchema);

export type EmbedWidgetConfig = z.infer<typeof embedWidgetConfigSchema>;

export const defaultEmbedWidgetConfig: EmbedWidgetConfig = {
  embedInput: "",
  aspectRatio: "16:9",
  customHeightPx: null,
  title: null,
  allowFullscreen: true,
  ...defaultWidgetLayoutFields,
};

export const scriptWidgetConfigSchema = z
  .object({
    embedCode: z.string().default(""),
  })
  .merge(widgetLayoutFieldsSchema);

export type ScriptWidgetConfig = z.infer<typeof scriptWidgetConfigSchema>;

export const defaultScriptWidgetConfig: ScriptWidgetConfig = {
  embedCode: "",
  ...defaultWidgetLayoutFields,
};

export type WidgetConfig =
  | TextWidgetConfig
  | ButtonWidgetConfig
  | InputWidgetConfig
  | OptionsWidgetConfig
  | ImageWidgetConfig
  | CarouselWidgetConfig
  | AudioWidgetConfig
  | VideoWidgetConfig
  | LevelWidgetConfig
  | LoadingWidgetConfig
  | RedirectWidgetConfig
  | TestimonialsWidgetConfig
  | ChartsWidgetConfig
  | FaqWidgetConfig
  | SpacerWidgetConfig
  | BenefitsWidgetConfig
  | TrustBadgeWidgetConfig
  | WhatsappWidgetConfig
  | PricingWidgetConfig
  | CountdownWidgetConfig
  | ResultBlockWidgetConfig
  | BeforeAfterWidgetConfig
  | ComparisonTableWidgetConfig
  | LogoBarWidgetConfig
  | AlertWidgetConfig
  | RatingWidgetConfig
  | EmbedWidgetConfig
  | ScriptWidgetConfig;

export type QuizStep = {
  id: string;
  quizId: string;
  workspaceId: string;
  title: string;
  position: number;
  settings: StepSettings;
};

export type QuizWidget = {
  id: string;
  stepId: string;
  workspaceId: string;
  type: WidgetType;
  position: number;
  config: WidgetConfig;
};

export type BuilderState = {
  quizId: string;
  workspaceSlug: string;
  steps: QuizStep[];
  widgets: QuizWidget[];
  activeStepId: string | null;
  selectedWidgetId: string | null;
  isDirty: boolean;
};

export type BuilderActionResult =
  | { success: true }
  | { success: false; error: string };

export type BuilderSnapshot = {
  steps: QuizStep[];
  widgets: QuizWidget[];
  design: import("@/domains/quiz/types/design.types").QuizDesignSettings;
  flowLayout: import("@/domains/quiz/types/flow.types").FlowLayout;
  variables: QuizVariable[];
  settings: import("@/domains/quiz/types/quiz-settings.types").QuizSettings;
};

export type BuilderTab = "flow" | "design" | "statistics" | "settings";
