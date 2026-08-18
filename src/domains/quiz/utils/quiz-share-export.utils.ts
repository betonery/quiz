import type {
  BuilderSnapshot,
  QuizStep,
  QuizWidget,
} from "@/domains/quiz/types/builder.types";
import type {
  ConditionFunctionConfig,
  FlowFunctionNode,
  FlowLayout,
  WebhookFunctionConfig,
} from "@/domains/quiz/types/flow.types";
import { flowLayoutSchema } from "@/domains/quiz/types/flow.types";
import {
  SHARE_SNAPSHOT_VERSION,
  shareableQuizSnapshotSchema,
  type ShareableQuizSnapshot,
} from "@/domains/quiz/types/quiz-share.types";
import { defaultQuizSettings } from "@/domains/quiz/utils/quiz-settings.utils";

type BuildExportSnapshotInput = {
  sourceTitle: string;
  snapshot: BuilderSnapshot;
};

function sanitizeFlowLayout(flowLayout: FlowLayout): FlowLayout {
  return {
    ...flowLayout,
    functionNodes: flowLayout.functionNodes.map((node) =>
      sanitizeFlowFunctionNode(node),
    ),
  };
}

function sanitizeFlowFunctionNode(node: FlowFunctionNode): FlowFunctionNode {
  if (node.type !== "webhook" || !node.config) {
    return { ...node };
  }

  const config = node.config as WebhookFunctionConfig;
  return {
    ...node,
    config: {
      ...config,
      token: "",
    },
  };
}

function sanitizeSteps(steps: QuizStep[]): QuizStep[] {
  return steps.map((step) => ({
    ...step,
    quizId: "",
    workspaceId: "",
  }));
}

function sanitizeWidgets(widgets: QuizWidget[]): QuizWidget[] {
  return widgets.map((widget) => ({
    ...widget,
    workspaceId: "",
  }));
}

export function buildShareableSnapshot({
  sourceTitle,
  snapshot,
}: BuildExportSnapshotInput): ShareableQuizSnapshot {
  const shareable: ShareableQuizSnapshot = {
    schemaVersion: SHARE_SNAPSHOT_VERSION,
    exportedAt: new Date().toISOString(),
    sourceTitle: sourceTitle.trim() || "Funil sem título",
    steps: sanitizeSteps(snapshot.steps),
    widgets: sanitizeWidgets(snapshot.widgets),
    design: snapshot.design,
    flowLayout: flowLayoutSchema.parse(sanitizeFlowLayout(snapshot.flowLayout)),
    variables: snapshot.variables.map((variable) => ({ ...variable })),
    settings: {
      integrations: {},
      testIntegrationsInPreview: false,
    },
  };

  const parsed = shareableQuizSnapshotSchema.safeParse(shareable);
  if (!parsed.success) {
    throw new Error(
      "Não foi possível preparar o snapshot para compartilhamento",
    );
  }

  return parsed.data;
}

export function parseShareableSnapshot(
  raw: unknown,
): ShareableQuizSnapshot | null {
  const parsed = shareableQuizSnapshotSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function extractShareTokenFromInput(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    if (trimmed.includes("/share/")) {
      const url = trimmed.startsWith("http")
        ? new URL(trimmed)
        : new URL(trimmed, "https://quiz.local");
      const parts = url.pathname.split("/").filter(Boolean);
      const shareIndex = parts.indexOf("share");
      if (shareIndex >= 0 && parts[shareIndex + 1]) {
        return parts[shareIndex + 1] ?? null;
      }
    }
  } catch {
    // fall through to raw token
  }

  if (/^[A-Za-z0-9_-]{16,64}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

export function getSanitizedSettingsForShare() {
  return { ...defaultQuizSettings };
}

export type { ConditionFunctionConfig, WebhookFunctionConfig };
