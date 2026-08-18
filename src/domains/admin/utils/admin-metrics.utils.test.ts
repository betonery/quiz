import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildTrend,
  calculateMrrCents,
  countByStatus,
  countSince,
  dayKey,
  daysAgo,
  normalizeToPercent,
  sumPaymentsCents,
  sumTrafficMetrics,
} from "@/domains/admin/utils/admin-metrics.utils";

describe("admin-metrics.utils", () => {
  const now = new Date("2026-08-07T12:00:00.000Z");

  it("gera chave de dia em UTC", () => {
    assert.equal(dayKey("2026-08-07T23:30:00.000Z"), "2026-08-07");
    assert.equal(dayKey("data-invalida"), "");
  });

  it("volta N dias no calendário", () => {
    assert.equal(dayKey(daysAgo(7, now)), "2026-07-31");
  });

  it("conta registros a partir de uma data", () => {
    const rows = [
      { created_at: "2026-08-06T10:00:00.000Z" },
      { created_at: "2026-07-01T10:00:00.000Z" },
    ];
    assert.equal(countSince(rows, daysAgo(7, now)), 1);
    assert.equal(countSince(rows, daysAgo(90, now)), 2);
  });

  it("calcula MRR somente das assinaturas ativas", () => {
    const prices = new Map<string, number | null>([
      ["starter", 9900],
      ["pro", 29900],
      ["legacy", null],
    ]);

    const mrr = calculateMrrCents(
      [
        { plan_id: "pro", status: "active" },
        { plan_id: "starter", status: "active" },
        { plan_id: "pro", status: "canceled" },
        { plan_id: "legacy", status: "active" },
        { plan_id: "sumiu", status: "active" },
      ],
      prices,
    );

    assert.equal(mrr, 39800);
  });

  it("soma pagamentos por status e período", () => {
    const payments = [
      {
        amount_cents: 9900,
        status: "paid",
        created_at: "2026-08-05T10:00:00.000Z",
      },
      {
        amount_cents: 29900,
        status: "paid",
        created_at: "2026-05-05T10:00:00.000Z",
      },
      {
        amount_cents: 5000,
        status: "refunded",
        created_at: "2026-08-06T10:00:00.000Z",
      },
    ];

    assert.equal(sumPaymentsCents(payments), 44800);
    assert.equal(sumPaymentsCents(payments, { status: "paid" }), 39800);
    assert.equal(
      sumPaymentsCents(payments, { status: "paid", since: daysAgo(30, now) }),
      9900,
    );
    assert.equal(sumPaymentsCents(payments, { status: "refunded" }), 5000);
  });

  it("conta por status", () => {
    const result = countByStatus([
      { status: "active" },
      { status: "active" },
      { status: "past_due" },
    ]);
    assert.deepEqual(result, { active: 2, past_due: 1 });
  });

  it("constrói série contínua incluindo dias vazios", () => {
    const trend = buildTrend({
      users: [
        { created_at: "2026-08-07T01:00:00.000Z" },
        { created_at: "2026-08-07T02:00:00.000Z" },
        { created_at: "2026-08-05T02:00:00.000Z" },
      ],
      quizzes: [{ created_at: "2026-08-06T02:00:00.000Z" }],
      days: 3,
      now,
    });

    assert.deepEqual(trend, [
      { date: "2026-08-05", users: 1, quizzes: 0 },
      { date: "2026-08-06", users: 0, quizzes: 1 },
      { date: "2026-08-07", users: 2, quizzes: 0 },
    ]);
  });

  it("soma métricas de tráfego", () => {
    assert.deepEqual(
      sumTrafficMetrics([
        { views: 10, starts: 5, completions: 2 },
        { views: 4, starts: 1, completions: 1 },
      ]),
      { views: 14, starts: 6, completions: 3 },
    );
    assert.deepEqual(sumTrafficMetrics([]), {
      views: 0,
      starts: 0,
      completions: 0,
    });
  });

  it("normaliza série para porcentagem", () => {
    assert.deepEqual(normalizeToPercent([0, 5, 10]), [0, 50, 100]);
    assert.deepEqual(normalizeToPercent([0, 0]), [0, 0]);
    assert.deepEqual(normalizeToPercent([]), []);
  });
});
