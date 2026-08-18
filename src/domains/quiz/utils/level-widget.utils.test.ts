import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { defaultQuizDesignSettings } from "@/domains/quiz/types/design.types";
import {
  clampLevelPercentage,
  parseLevelLegends,
  resolveLevelColors,
} from "./level-widget.utils";

describe("level-widget.utils", () => {
  it("clamps percentage between 0 and 100", () => {
    assert.equal(clampLevelPercentage(-10), 0);
    assert.equal(clampLevelPercentage(150), 100);
    assert.equal(clampLevelPercentage(69.7), 69.7);
    assert.equal(clampLevelPercentage(Number.NaN), 0);
  });

  it("parses comma-separated legends", () => {
    assert.deepEqual(parseLevelLegends("Começando, Inicio ,Médio"), [
      "Começando",
      "Inicio",
      "Médio",
    ]);
    assert.deepEqual(parseLevelLegends("  , , "), []);
    assert.deepEqual(parseLevelLegends(""), []);
  });

  it("resolves level colors with fallbacks and overrides", () => {
    const defaults = resolveLevelColors(
      {
        fillColor: null,
        textColor: null,
        borderColor: null,
      },
      defaultQuizDesignSettings,
    );

    assert.equal(defaults.fill, defaultQuizDesignSettings.colors.primary);
    assert.equal(defaults.text, defaultQuizDesignSettings.colors.texts);
    assert.equal(defaults.border, "#e2e8f0");

    const custom = resolveLevelColors(
      {
        fillColor: "#ff0000",
        textColor: "#00ff00",
        borderColor: "#0000ff",
      },
      defaultQuizDesignSettings,
    );

    assert.equal(custom.fill, "#ff0000");
    assert.equal(custom.text, "#00ff00");
    assert.equal(custom.border, "#0000ff");
    assert.equal(custom.track, "#0000ff");
  });
});
