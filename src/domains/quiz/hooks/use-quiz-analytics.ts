"use client";

import { useEffect, useRef } from "react";
import type { QuizAnalyticsEvent } from "@/domains/quiz/types/statistics.types";

type UseQuizAnalyticsOptions = {
  quizSlug?: string;
  enabled?: boolean;
  activeStepId?: string;
};

function getSessionKey(quizSlug: string, suffix: string) {
  return `adquiz:analytics:${quizSlug}:${suffix}`;
}

async function sendAnalyticsEvent(
  quizSlug: string,
  event: QuizAnalyticsEvent,
  stepId?: string,
) {
  try {
    await fetch(`/api/q/${encodeURIComponent(quizSlug)}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, stepId }),
      keepalive: true,
    });
  } catch {
    // Falha silenciosa — analytics não deve bloquear o funil
  }
}

export function useQuizAnalytics({
  quizSlug,
  enabled = false,
  activeStepId,
}: UseQuizAnalyticsOptions) {
  const trackedStepsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled || !quizSlug) return;

    const viewKey = getSessionKey(quizSlug, "view");
    if (!sessionStorage.getItem(viewKey)) {
      sessionStorage.setItem(viewKey, "1");
      void sendAnalyticsEvent(quizSlug, "view");
      void sendAnalyticsEvent(quizSlug, "start");
    }
  }, [enabled, quizSlug]);

  useEffect(() => {
    if (!enabled || !quizSlug || !activeStepId) return;
    if (trackedStepsRef.current.has(activeStepId)) return;

    trackedStepsRef.current.add(activeStepId);
    void sendAnalyticsEvent(quizSlug, "step_view", activeStepId);
  }, [activeStepId, enabled, quizSlug]);
}

export function trackQuizCompletion(quizSlug?: string, enabled = false) {
  if (!enabled || !quizSlug) return;

  const completeKey = getSessionKey(quizSlug, "complete");
  if (sessionStorage.getItem(completeKey)) return;

  sessionStorage.setItem(completeKey, "1");
  void sendAnalyticsEvent(quizSlug, "complete");
}
