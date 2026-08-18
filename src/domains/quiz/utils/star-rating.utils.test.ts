import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatRatingScore,
  getStarFillState,
  parseVariableScore,
} from "./star-rating.utils";

describe("star-rating.utils", () => {
  it("returns full, half and empty star states", () => {
    assert.equal(getStarFillState(4.9, 0), "full");
    assert.equal(getStarFillState(4.9, 3), "full");
    assert.equal(getStarFillState(4.9, 4, true), "half");
    assert.equal(getStarFillState(4.9, 4, false), "empty");
  });

  it("formats score in pt-BR", () => {
    assert.match(formatRatingScore(4.9), /4,9/);
  });

  it("parses variable score values", () => {
    assert.equal(parseVariableScore(4.5), 4.5);
    assert.equal(parseVariableScore("4,8"), 4.8);
    assert.equal(parseVariableScore("invalid"), null);
  });
});
