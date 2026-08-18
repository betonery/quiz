import { NextResponse } from "next/server";
import {
  loadPreviewQuiz,
  loadPublishedQuiz,
} from "@/domains/quiz/services/quiz-public.service";
import { getAuthoritativeWebhookConfig } from "@/domains/quiz/services/quiz-flow.service";
import {
  buildWebhookPayload,
  dispatchWebhookRequest,
} from "@/domains/quiz/utils/webhook-dispatch.utils";
import {
  getClientIp,
  rateLimit,
  tooManyRequestsResponse,
} from "@/lib/rate-limit";
import { createClient } from "@/services/supabase/server";

type WebhookRequestBody = {
  functionId?: string;
  variables?: Record<string, unknown>;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ quizSlug: string }> },
) {
  const { quizSlug } = await context.params;

  // Endpoint público que dispara requisições de saída — limita abuso/SSRF.
  const rl = rateLimit(`webhook:${getClientIp(request)}`, 30, 60_000);
  if (!rl.success) {
    return tooManyRequestsResponse(rl.resetAt);
  }

  let body: WebhookRequestBody;
  try {
    body = (await request.json()) as WebhookRequestBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "JSON inválido" },
      { status: 400 },
    );
  }

  const functionId = body.functionId?.trim();
  if (!functionId) {
    return NextResponse.json(
      { ok: false, error: "functionId é obrigatório" },
      { status: 400 },
    );
  }

  const variables =
    body.variables && typeof body.variables === "object" ? body.variables : {};

  const publishedResult = await loadPublishedQuiz(quizSlug);

  if (publishedResult.kind === "subscription_inactive") {
    return NextResponse.json(
      { ok: false, error: "Funil indisponível: assinatura inativa" },
      { status: 403 },
    );
  }

  let quizData =
    publishedResult.kind === "success" ? publishedResult.data : null;

  if (!quizData) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const previewResult = await loadPreviewQuiz(quizSlug, user.id);
      if (previewResult.kind === "subscription_inactive") {
        return NextResponse.json(
          { ok: false, error: "Funil indisponível: assinatura inativa" },
          { status: 403 },
        );
      }
      quizData = previewResult.kind === "success" ? previewResult.data : null;
    }
  }

  if (!quizData) {
    return NextResponse.json(
      { ok: false, error: "Funil não encontrado" },
      { status: 404 },
    );
  }

  // O snapshot público não contém segredos do webhook; recupera a config
  // autoritativa (URL/token) server-side via service role.
  const config = await getAuthoritativeWebhookConfig(
    quizData.quiz.id,
    functionId,
  );
  if (!config?.url?.trim()) {
    return NextResponse.json({ ok: true });
  }

  const payload = buildWebhookPayload({
    event: "quiz.webhook.lead",
    quizId: quizData.quiz.id,
    functionId,
    variableKeys: config.variableKeys ?? [],
    variables,
  });

  await dispatchWebhookRequest({
    url: config.url,
    method: config.method ?? "POST",
    token: config.token,
    payload: config.method === "GET" ? undefined : payload,
  });

  return NextResponse.json({ ok: true });
}
