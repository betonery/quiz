import "server-only";

import { randomBytes } from "node:crypto";
import { loadQuizBuilder } from "@/domains/quiz/services/quiz-builder.service";
import { loadDesignSettings } from "@/domains/quiz/services/quiz-design.service";
import { saveDesignSettings } from "@/domains/quiz/services/quiz-design.service";
import { loadFlowLayout } from "@/domains/quiz/services/quiz-flow.service";
import { saveFlowLayout } from "@/domains/quiz/services/quiz-flow.service";
import { loadQuizVariables } from "@/domains/quiz/services/quiz-variables.service";
import { saveQuizVariables } from "@/domains/quiz/services/quiz-variables.service";
import { loadQuizSettings } from "@/domains/quiz/services/quiz-settings.service";
import { saveQuizSettings } from "@/domains/quiz/services/quiz-settings.service";
import { saveQuizBuilder } from "@/domains/quiz/services/quiz-builder.service";
import { getQuizById } from "@/domains/quiz/services/quiz.service";
import type { BuilderSnapshot } from "@/domains/quiz/types/builder.types";
import {
  isSupportedShareSchemaVersion,
  type QuizShareLink,
  type QuizSharePreview,
  type QuizShareSettings,
  type ShareableQuizSnapshot,
} from "@/domains/quiz/types/quiz-share.types";
import {
  buildShareableSnapshot,
  parseShareableSnapshot,
} from "@/domains/quiz/utils/quiz-share-export.utils";
import { cloneShareSnapshotForImport } from "@/domains/quiz/utils/quiz-share-import.utils";
import { createAdminClient } from "@/services/supabase/admin";
import { createClient } from "@/services/supabase/server";

const INVALID_SHARE_MESSAGE = "Link inválido ou compartilhamento desativado";

function generateShareToken(): string {
  return randomBytes(18).toString("base64url");
}

function mapShareLink(row: {
  id: string;
  quiz_id: string;
  workspace_id: string;
  share_token: string;
  enabled: boolean;
  schema_version: number;
  source_title: string;
  import_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}): QuizShareLink {
  return {
    id: row.id,
    quizId: row.quiz_id,
    workspaceId: row.workspace_id,
    shareToken: row.share_token,
    enabled: row.enabled,
    schemaVersion: row.schema_version,
    sourceTitle: row.source_title,
    importCount: row.import_count,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function loadFullBuilderSnapshot(
  quizId: string,
): Promise<BuilderSnapshot> {
  const { steps, widgets } = await loadQuizBuilder(quizId);
  const design = await loadDesignSettings(quizId);
  const flowLayout = await loadFlowLayout(quizId);
  const variables = await loadQuizVariables(quizId);
  const settings = await loadQuizSettings(quizId);

  return { steps, widgets, design, flowLayout, variables, settings };
}

export async function applyBuilderSnapshot(
  quizId: string,
  workspaceId: string,
  snapshot: BuilderSnapshot,
): Promise<void> {
  await saveQuizBuilder(quizId, workspaceId, snapshot.steps, snapshot.widgets);
  await saveDesignSettings(quizId, workspaceId, snapshot.design);
  await saveFlowLayout(quizId, workspaceId, snapshot.flowLayout);
  await saveQuizVariables(quizId, workspaceId, snapshot.variables);
  await saveQuizSettings(quizId, workspaceId, snapshot.settings);
}

export async function getQuizShareLinkForMember(
  quizId: string,
): Promise<QuizShareLink | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quiz_share_links")
    .select("*")
    .eq("quiz_id", quizId)
    .maybeSingle();

  if (error || !data) return null;
  return mapShareLink(data);
}

export async function buildExportSnapshot(
  quizId: string,
  workspaceId: string,
): Promise<ShareableQuizSnapshot> {
  const quiz = await getQuizById(workspaceId, quizId);
  if (!quiz) {
    throw new Error("Funil não encontrado");
  }

  const snapshot = await loadFullBuilderSnapshot(quizId);
  if (snapshot.steps.length === 0) {
    throw new Error("Adicione ao menos uma etapa antes de compartilhar");
  }

  return buildShareableSnapshot({
    sourceTitle: quiz.title,
    snapshot,
  });
}

async function upsertShareLink(params: {
  quizId: string;
  workspaceId: string;
  userId: string;
  shareToken: string;
  enabled: boolean;
  snapshot: ShareableQuizSnapshot;
  sourceTitle: string;
}): Promise<QuizShareLink> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quiz_share_links")
    .upsert(
      {
        quiz_id: params.quizId,
        workspace_id: params.workspaceId,
        share_token: params.shareToken,
        enabled: params.enabled,
        snapshot: params.snapshot,
        schema_version: params.snapshot.schemaVersion,
        source_title: params.sourceTitle,
        created_by: params.userId,
      },
      { onConflict: "quiz_id" },
    )
    .select("*")
    .single();

  if (error || !data) {
    throw new Error("Não foi possível salvar o compartilhamento");
  }

  return mapShareLink(data);
}

export async function enableQuizShare(
  quizId: string,
  workspaceId: string,
  userId: string,
): Promise<QuizShareLink> {
  const existing = await getQuizShareLinkForMember(quizId);
  const snapshot = await buildExportSnapshot(quizId, workspaceId);

  return upsertShareLink({
    quizId,
    workspaceId,
    userId,
    shareToken: existing?.shareToken ?? generateShareToken(),
    enabled: true,
    snapshot,
    sourceTitle: snapshot.sourceTitle,
  });
}

export async function disableQuizShare(quizId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("quiz_share_links")
    .update({ enabled: false })
    .eq("quiz_id", quizId);

  if (error) {
    throw new Error("Não foi possível desativar o compartilhamento");
  }
}

export async function refreshQuizShareSnapshot(
  quizId: string,
  workspaceId: string,
): Promise<QuizShareLink> {
  const existing = await getQuizShareLinkForMember(quizId);
  if (!existing) {
    throw new Error("Compartilhamento não configurado");
  }

  const snapshot = await buildExportSnapshot(quizId, workspaceId);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quiz_share_links")
    .update({
      snapshot,
      schema_version: snapshot.schemaVersion,
      source_title: snapshot.sourceTitle,
    })
    .eq("quiz_id", quizId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error("Não foi possível atualizar o snapshot compartilhado");
  }

  return mapShareLink(data);
}

export async function regenerateQuizShareToken(
  quizId: string,
  workspaceId: string,
  userId: string,
): Promise<QuizShareLink> {
  const snapshot = await buildExportSnapshot(quizId, workspaceId);
  return upsertShareLink({
    quizId,
    workspaceId,
    userId,
    shareToken: generateShareToken(),
    enabled: true,
    snapshot,
    sourceTitle: snapshot.sourceTitle,
  });
}

async function getShareLinkByTokenAdmin(token: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("quiz_share_links")
    .select("*")
    .eq("share_token", token)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function getSharePreviewByToken(
  token: string,
): Promise<QuizSharePreview | null> {
  const row = await getShareLinkByTokenAdmin(token);
  if (!row?.enabled) return null;

  const snapshot = parseShareableSnapshot(row.snapshot);
  if (!snapshot || !isSupportedShareSchemaVersion(snapshot.schemaVersion)) {
    return null;
  }

  return {
    sourceTitle: row.source_title,
    stepCount: snapshot.steps.length,
    schemaVersion: snapshot.schemaVersion,
  };
}

export async function getShareSnapshotByToken(
  token: string,
): Promise<ShareableQuizSnapshot | null> {
  const row = await getShareLinkByTokenAdmin(token);
  if (!row?.enabled) return null;

  const snapshot = parseShareableSnapshot(row.snapshot);
  if (!snapshot || !isSupportedShareSchemaVersion(snapshot.schemaVersion)) {
    return null;
  }

  return snapshot;
}

export async function recordShareImport(token: string): Promise<void> {
  const admin = createAdminClient();
  const row = await getShareLinkByTokenAdmin(token);
  if (!row) return;

  await admin
    .from("quiz_share_links")
    .update({ import_count: row.import_count + 1 })
    .eq("share_token", token);
}

export async function getQuizShareSettings(
  quizId: string,
  workspaceId: string,
  appOrigin: string,
): Promise<QuizShareSettings> {
  const snapshot = await loadFullBuilderSnapshot(quizId);
  const link = await getQuizShareLinkForMember(quizId);

  return {
    enabled: link?.enabled ?? false,
    shareToken: link?.shareToken ?? null,
    shareUrl: link?.enabled
      ? `${appOrigin.replace(/\/$/, "")}/share/${link.shareToken}`
      : null,
    sourceTitle: link?.sourceTitle ?? "",
    importCount: link?.importCount ?? 0,
    updatedAt: link?.updatedAt ?? null,
    canEnable: snapshot.steps.length > 0,
  };
}

export { INVALID_SHARE_MESSAGE, cloneShareSnapshotForImport };
