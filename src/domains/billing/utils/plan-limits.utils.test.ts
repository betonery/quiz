import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  evaluateCreateQuizAccess,
  formatLimit,
  isSubscriptionActive,
  isUnlimited,
  isWithinLimit,
  shouldBlockPublicQuizAccess,
} from "@/domains/billing/utils/plan-limits.utils";

describe("plan-limits.utils", () => {
  const starterLimits = {
    max_quizzes: 10,
    max_team_members: 3,
    max_custom_domains: 1,
  };

  it("detects unlimited limits", () => {
    assert.equal(isUnlimited(-1), true);
    assert.equal(isUnlimited(10), false);
  });

  it("formats limits for display", () => {
    assert.equal(formatLimit(-1), "Ilimitado");
    assert.equal(formatLimit(10), "10");
  });

  it("checks if current usage is within limit", () => {
    assert.equal(isWithinLimit(9, 10), true);
    assert.equal(isWithinLimit(10, 10), false);
    assert.equal(isWithinLimit(100, -1), true);
  });

  it("blocks quiz creation without active subscription", () => {
    assert.deepEqual(
      evaluateCreateQuizAccess({
        hasActiveSubscription: false,
        limits: starterLimits,
        quizCount: 0,
      }),
      {
        allowed: false,
        reason: "no_subscription",
        message:
          "Assinatura necessária para criar funis. Escolha um plano para continuar.",
      },
    );
  });

  it("blocks quiz creation when limit is reached", () => {
    assert.deepEqual(
      evaluateCreateQuizAccess({
        hasActiveSubscription: true,
        limits: starterLimits,
        quizCount: 10,
      }),
      {
        allowed: false,
        reason: "limit_reached",
        message: "Limite de funis atingido. Faça upgrade para o plano Pro.",
      },
    );
  });

  it("allows quiz creation with active subscription and available quota", () => {
    assert.deepEqual(
      evaluateCreateQuizAccess({
        hasActiveSubscription: true,
        limits: starterLimits,
        quizCount: 2,
      }),
      { allowed: true },
    );
  });
});

describe("subscription.service helpers", () => {
  it("detects active subscription status", () => {
    assert.equal(isSubscriptionActive({ status: "active" }), true);
    assert.equal(isSubscriptionActive({ status: "inactive" }), false);
    assert.equal(isSubscriptionActive(null), false);
  });

  it("blocks public quiz access without active subscription", () => {
    assert.equal(shouldBlockPublicQuizAccess({ status: "active" }), false);
    assert.equal(shouldBlockPublicQuizAccess({ status: "inactive" }), true);
    assert.equal(shouldBlockPublicQuizAccess({ status: "past_due" }), true);
    assert.equal(shouldBlockPublicQuizAccess({ status: "canceled" }), true);
    assert.equal(shouldBlockPublicQuizAccess(null), true);
  });

  it("allows public quiz access only when subscription status is active", () => {
    for (const status of ["inactive", "past_due", "canceled"] as const) {
      assert.equal(
        isSubscriptionActive({ status }),
        false,
        `status ${status} must block public access`,
      );
    }

    assert.equal(isSubscriptionActive({ status: "active" }), true);
  });

  it("expira o acesso na data de fim, sem esperar o cron", () => {
    const now = new Date("2026-08-07T12:00:00.000Z");

    assert.equal(
      isSubscriptionActive(
        { status: "active", current_period_end: "2026-08-08T12:00:00.000Z" },
        now,
      ),
      true,
      "período em aberto mantém o acesso",
    );

    assert.equal(
      isSubscriptionActive(
        { status: "active", current_period_end: "2026-08-07T11:59:00.000Z" },
        now,
      ),
      false,
      "vencido há 1 minuto já bloqueia",
    );

    // Concessão manual sem prazo definido continua valendo.
    assert.equal(
      isSubscriptionActive({ status: "active", current_period_end: null }, now),
      true,
    );

    // Data corrompida não pode derrubar acesso de quem está em dia.
    assert.equal(
      isSubscriptionActive(
        { status: "active", current_period_end: "não é data" },
        now,
      ),
      true,
    );

    // Prazo em aberto não ressuscita assinatura cancelada.
    assert.equal(
      isSubscriptionActive(
        { status: "canceled", current_period_end: "2030-01-01T00:00:00.000Z" },
        now,
      ),
      false,
    );
  });
});
