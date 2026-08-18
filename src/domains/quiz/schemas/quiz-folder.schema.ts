import { z } from "zod";

export const createQuizFolderSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nome da pasta é obrigatório")
    .max(80, "Nome deve ter no máximo 80 caracteres"),
});

export const renameQuizFolderSchema = createQuizFolderSchema;

export const moveQuizToFolderSchema = z.object({
  folderId: z.string().uuid("Pasta inválida").nullable(),
});

export type CreateQuizFolderInput = z.infer<typeof createQuizFolderSchema>;
export type RenameQuizFolderInput = z.infer<typeof renameQuizFolderSchema>;
export type MoveQuizToFolderInput = z.infer<typeof moveQuizToFolderSchema>;
