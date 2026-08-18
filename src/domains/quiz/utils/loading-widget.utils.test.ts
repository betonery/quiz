import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { defaultQuizDesignSettings } from "@/domains/quiz/types/design.types";
import {
  clampLoadingDuration,
  clampLoadingLimitPercent,
  resolveLoadingColors,
} from "./loading-widget.utils";

describe("loading-widget.utils", () => {
  it("clamps loading duration between 1 and 120 seconds", () => {
    assert.equal(clampLoadingDuration(0), 1);
    assert.equal(clampLoadingDuration(200), 120);
    assert.equal(clampLoadingDuration(5.7), 6);
    assert.equal(clampLoadingDuration(Number.NaN), 1);
  });

  it("clamps loading limit percent", () => {
    assert.equal(clampLoadingLimitPercent(-5), 0);
    assert.equal(clampLoadingLimitPercent(150), 100);
    assert.equal(clampLoadingLimitPercent(60), 60);
  });

  it("resolves loading colors with fallbacks and overrides", () => {
    const defaults = resolveLoadingColors(
      {
        fillColor: null,
        textColor: null,
        trackColor: null,
      },
      defaultQuizDesignSettings,
    );

    assert.equal(defaults.fill, defaultQuizDesignSettings.colors.primary);
    assert.equal(defaults.text, defaultQuizDesignSettings.colors.texts);
    assert.equal(defaults.track, "#e5e7eb");

    const custom = resolveLoadingColors(
      {
        fillColor: "#111111",
        textColor: "#222222",
        trackColor: "#333333",
      },
      defaultQuizDesignSettings,
    );

    assert.equal(custom.fill, "#111111");
    assert.equal(custom.text, "#222222");
    assert.equal(custom.title, "#222222");
    assert.equal(custom.track, "#333333");
  });
});
