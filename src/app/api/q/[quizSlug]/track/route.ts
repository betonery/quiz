import { NextResponse } from "next/server";
import { loadPublishedQuiz } from "@/domains/quiz/services/quiz-public.service";
import type { QuizAnalyticsEvent } from "@/domains/quiz/types/statistics.types";
import {
  getClientIp,
  rateLimit,
  tooManyRequestsResponse,
} from "@/lib/rate-limit";
import { createAdminClient } from "@/services/supabase/admin";

type TrackRequestBody = {
  event?: QuizAnalyticsEvent;
  stepId?: string;
};

const VALID_EVENTS = new Set<QuizAnalyticsEvent>([
  "view",
  "start",
  "complete",
  "step_view",
]);

export async function POST(
  request: Request,
  context: { params: Promise<{ quizSlug: string }> },
) {
  const { quizSlug } = await context.params;

  const rl = rateLimit(`track:${getClientIp(request)}`, 120, 60_000);
  if (!rl.success) {
    return tooManyRequestsResponse(rl.resetAt);
  }

  let body: TrackRequestBody;
  try {
    body = (await request.json()) as TrackRequestBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "JSON inválido" },
      { status: 400 },
    );
  }

  const event = body.event;
  if (!event || !VALID_EVENTS.has(event)) {
    return NextResponse.json(
      { ok: false, error: "event inválido" },
      { status: 400 },
    );
  }

  const publishedResult = await loadPublishedQuiz(quizSlug);
  if (publishedResult.kind === "subscription_inactive") {
    return NextResponse.json({ ok: true });
  }
  if (publishedResult.kind !== "success") {
    return NextResponse.json(
      { ok: false, error: "Funil não encontrado" },
      { status: 404 },
    );
  }

  const stepId =
    body.stepId && typeof body.stepId === "string" ? body.stepId.trim() : null;

  if (event === "step_view" && !stepId) {
    return NextResponse.json(
      { ok: false, error: "stepId é obrigatório para step_view" },
      { status: 400 },
    );
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.rpc("record_quiz_analytics", {
      p_quiz_id: publishedResult.data.quiz.id,
      p_event: event,
      p_step_id: stepId,
    });

    if (error) {
      console.error("[track]", error.message);
      return NextResponse.json({ ok: false }, { status: 500 });
    }
  } catch (error) {
    console.error("[track]", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
