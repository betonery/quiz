import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  clampSpacerHeight,
  getSpacerColorPickerValue,
  resolveSpacerBackgroundColor,
} from "./spacer-widget.utils";

describe("spacer-widget.utils", () => {
  it("clamps spacer height between 1 and 500 px", () => {
    assert.equal(clampSpacerHeight(0), 1);
    assert.equal(clampSpacerHeight(600), 500);
    assert.equal(clampSpacerHeight(24.7), 25);
    assert.equal(clampSpacerHeight(Number.NaN), 1);
  });

  it("resolves transparent background when color is null or blank", () => {
    assert.equal(
      resolveSpacerBackgroundColor({ backgroundColor: null }),
      "transparent",
    );
    assert.equal(
      resolveSpacerBackgroundColor({ backgroundColor: "   " }),
      "transparent",
    );
    assert.equal(
      resolveSpacerBackgroundColor({ backgroundColor: "#ff0000" }),
      "#ff0000",
    );
  });

  it("returns fallback color for the color picker when background is null", () => {
    assert.equal(
      getSpacerColorPickerValue({ backgroundColor: null }),
      "#ffffff",
    );
    assert.equal(
      getSpacerColorPickerValue({ backgroundColor: "#00ff00" }),
      "#00ff00",
    );
  });
});
