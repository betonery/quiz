import { z } from "zod";

export const renameWorkspaceSchema = z.object({
  workspaceId: z.string().uuid("Workspace inválido"),
  name: z
    .string()
    .trim()
    .min(2, "O nome precisa de pelo menos 2 caracteres")
    .max(60, "Nome muito longo"),
});

export type RenameWorkspaceInput = z.infer<typeof renameWorkspaceSchema>;

export const transferOwnershipSchema = z.object({
  workspaceId: z.string().uuid("Workspace inválido"),
  newOwnerId: z.string().uuid("Usuário inválido"),
});

export type TransferOwnershipInput = z.infer<typeof transferOwnershipSchema>;

export const workspaceMemberRoleSchema = z.object({
  workspaceId: z.string().uuid("Workspace inválido"),
  userId: z.string().uuid("Usuário inválido"),
  role: z.enum(["owner", "admin", "member"]),
});

export const workspaceMemberSchema = z.object({
  workspaceId: z.string().uuid("Workspace inválido"),
  userId: z.string().uuid("Usuário inválido"),
});

export const quizIdSchema = z.object({
  quizId: z.string().uuid("Funil inválido"),
});
