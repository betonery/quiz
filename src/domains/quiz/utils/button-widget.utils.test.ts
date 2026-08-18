import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BUTTON_ANIMATION_LABELS,
  getButtonAnimationClass,
} from "./button-widget.utils";

describe("button-widget.utils", () => {
  it("maps animation values to CSS classes", () => {
    assert.equal(getButtonAnimationClass("none"), undefined);
    assert.equal(getButtonAnimationClass("pulse"), "btn-animate-pulse");
    assert.equal(getButtonAnimationClass("shake"), "btn-animate-shake");
    assert.equal(getButtonAnimationClass("bounce"), "btn-animate-bounce");
    assert.equal(getButtonAnimationClass("glow"), "btn-animate-glow");
    assert.equal(getButtonAnimationClass("wiggle"), "btn-animate-wiggle");
  });

  it("provides Portuguese labels for all animations", () => {
    assert.equal(BUTTON_ANIMATION_LABELS.none, "Nenhuma");
    assert.equal(BUTTON_ANIMATION_LABELS.pulse, "Pulsar");
    assert.equal(BUTTON_ANIMATION_LABELS.shake, "Vibrar");
    assert.equal(Object.keys(BUTTON_ANIMATION_LABELS).length, 6);
  });
});
