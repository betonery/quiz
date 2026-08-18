import { z } from "zod";

export const RESERVED_QUIZ_SLUGS = new Set([
  "api",
  "auth",
  "dashboard",
  "invite",
  "login",
  "register",
  "q",
  "quizzes",
  "settings",
  "integrations",
  "billing",
  "analytics",
  "_next",
  "favicon.ico",
]);

export const quizSlugSchema = z
  .string()
  .trim()
  .min(3, "Slug deve ter pelo menos 3 caracteres")
  .max(60, "Slug deve ter no máximo 60 caracteres")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use apenas letras minúsculas, números e hífens",
  )
  .refine((slug) => !RESERVED_QUIZ_SLUGS.has(slug), "Este slug está reservado");

export const updateQuizSlugSchema = z.object({
  quizId: z.string().uuid(),
  workspaceSlug: z.string().min(1),
  slug: quizSlugSchema,
});

export const checkQuizSlugSchema = z.object({
  slug: quizSlugSchema,
  excludeQuizId: z.string().uuid().optional(),
});
