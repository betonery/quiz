import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { defaultQuizDesignSettings } from "@/domains/quiz/types/design.types";
import {
  clampChartValue,
  getChartsGridClass,
  resolveChartColor,
  resolveChartLegendPlain,
} from "./charts-widget.utils";
import { createDefaultChartItem } from "@/domains/quiz/types/media.types";

describe("charts-widget.utils", () => {
  it("clamps chart value between 0 and 100", () => {
    assert.equal(clampChartValue(-5), 0);
    assert.equal(clampChartValue(150), 100);
    assert.equal(clampChartValue(42.6), 43);
    assert.equal(clampChartValue(Number.NaN), 0);
  });

  it("resolves theme color from design", () => {
    assert.equal(
      resolveChartColor("theme", defaultQuizDesignSettings),
      defaultQuizDesignSettings.colors.primary,
    );
    assert.equal(
      resolveChartColor("blue", defaultQuizDesignSettings),
      "#3b82f6",
    );
  });

  it("returns responsive grid classes", () => {
    assert.equal(getChartsGridClass("list"), "grid-cols-1");
    assert.match(getChartsGridClass("cols2"), /sm:grid-cols-2/);
    assert.match(getChartsGridClass("cols4"), /lg:grid-cols-4/);
  });

  it("resolves plain legend with variables", () => {
    const item = createDefaultChartItem();
    item.legend = "Olá {{nome}}";
    assert.equal(resolveChartLegendPlain(item, { nome: "Ana" }), "Olá Ana");
  });
});
