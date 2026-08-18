import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatHexDisplay,
  isValidHexColor,
  normalizeHexColor,
  toColorInputValue,
} from "./color.utils";

describe("color.utils", () => {
  it("normalizes 6-digit hex colors", () => {
    assert.equal(normalizeHexColor("#ffffff"), "#ffffff");
    assert.equal(normalizeHexColor("#FF5733"), "#ff5733");
    assert.equal(normalizeHexColor("  #AABBCC  "), "#aabbcc");
  });

  it("expands 3-digit hex colors", () => {
    assert.equal(normalizeHexColor("#fff"), "#ffffff");
    assert.equal(normalizeHexColor("#abc"), "#aabbcc");
    assert.equal(normalizeHexColor("#F0A"), "#ff00aa");
  });

  it("rejects invalid hex colors", () => {
    assert.equal(normalizeHexColor("#GGG"), null);
    assert.equal(normalizeHexColor("ffffff"), null);
    assert.equal(normalizeHexColor("#ffff"), null);
    assert.equal(normalizeHexColor(""), null);
    assert.equal(normalizeHexColor("rgb(255,0,0)"), null);
  });

  it("validates hex colors", () => {
    assert.equal(isValidHexColor("#fff"), true);
    assert.equal(isValidHexColor("#123456"), true);
    assert.equal(isValidHexColor("#GGG"), false);
  });

  it("converts to color input value", () => {
    assert.equal(toColorInputValue("#abc"), "#aabbcc");
    assert.equal(toColorInputValue("invalid"), "#000000");
  });

  it("formats hex for display", () => {
    assert.equal(formatHexDisplay("#ABC"), "#aabbcc");
  });
});
