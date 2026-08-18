import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildStepFunnelRows,
  filterStatisticsByPeriod,
  formatMetricPercent,
} from "./quiz-statistics.utils";
import { emptyQuizStatistics } from "@/domains/quiz/types/statistics.types";

describe("filterStatisticsByPeriod", () => {
  it("recalculates totals for selected daily rows", () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setUTCDate(today.getUTCDate() - 1);

    const statistics = {
      ...emptyQuizStatistics,
      views: 30,
      starts: 20,
      completions: 5,
      conversionRate: 16.7,
      daily: [
        {
          date: yesterday.toISOString().slice(0, 10),
          views: 10,
          starts: 8,
          completions: 2,
        },
        {
          date: today.toISOString().slice(0, 10),
          views: 20,
          starts: 12,
          completions: 3,
        },
      ],
    };

    const filtered = filterStatisticsByPeriod(statistics, 7);

    assert.equal(filtered.views, 30);
    assert.equal(filtered.completions, 5);
    assert.equal(filtered.conversionRate, 16.7);
  });
});

describe("buildStepFunnelRows", () => {
  it("computes drop-off between steps", () => {
    const rows = buildStepFunnelRows(
      [
        { id: "s1", title: "Etapa 1", position: 0 },
        { id: "s2", title: "Etapa 2", position: 1 },
      ],
      [
        { stepId: "s1", views: 100 },
        { stepId: "s2", views: 60 },
      ],
    );

    assert.equal(rows[0]?.views, 100);
    assert.equal(rows[1]?.views, 60);
    assert.equal(rows[1]?.dropOff, 40);
  });
});

describe("formatMetricPercent", () => {
  it("formats percent in pt-BR", () => {
    assert.equal(formatMetricPercent(12.5), "12,5%");
  });
});
