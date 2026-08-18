import { z } from "zod";

export const createQuizSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Nome do funil é obrigatório")
    .max(120, "Nome deve ter no máximo 120 caracteres"),
  folderId: z.string().uuid("Pasta inválida").nullable().optional(),
});

export type CreateQuizInput = z.infer<typeof createQuizSchema>;
