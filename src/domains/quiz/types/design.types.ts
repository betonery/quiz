import { z } from "zod";

export const logoTypeSchema = z.enum(["file", "url", "emoji"]);
export type LogoType = z.infer<typeof logoTypeSchema>;

export const stepTransitionSchema = z.enum([
  "fade_in",
  "slide",
  "zoom",
  "none",
]);
export type StepTransition = z.infer<typeof stepTransitionSchema>;

export const designHeaderSchema = z.object({
  logoType: logoTypeSchema,
  emoji: z.string().optional(),
  url: z.string().optional(),
  filePath: z.string().optional(),
});

export const designColorsSchema = z.object({
  primary: z.string(),
  background: z.string(),
  titles: z.string(),
  texts: z.string(),
  interactiveTexts: z.string(),
});

export const designTypographySchema = z.object({
  titleFont: z.string(),
  bodyFont: z.string(),
});

export const designAnimationSchema = z.object({
  stepTransition: stepTransitionSchema,
  delay: z.number().min(0),
  duration: z.number().min(0),
});

export const quizDesignSettingsSchema = z.object({
  header: designHeaderSchema,
  colors: designColorsSchema,
  typography: designTypographySchema,
  animation: designAnimationSchema,
});

export type DesignHeader = z.infer<typeof designHeaderSchema>;
export type DesignColors = z.infer<typeof designColorsSchema>;
export type DesignTypography = z.infer<typeof designTypographySchema>;
export type DesignAnimation = z.infer<typeof designAnimationSchema>;
export type QuizDesignSettings = z.infer<typeof quizDesignSettingsSchema>;

export const defaultQuizDesignSettings: QuizDesignSettings = {
  header: {
    logoType: "emoji",
    emoji: "😀",
  },
  colors: {
    primary: "#0f172a",
    background: "#ffffff",
    titles: "#0f172a",
    texts: "#64748b",
    interactiveTexts: "#0f172a",
  },
  typography: {
    titleFont: "Poppins",
    bodyFont: "Poppins",
  },
  animation: {
    stepTransition: "fade_in",
    delay: 0,
    duration: 0.3,
  },
};
