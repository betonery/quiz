import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_EMOJI,
  EMOJI_CATEGORIES,
  EMOJI_LIBRARY_FLAT,
} from "./emoji-library.constants";

describe("emoji-library.constants", () => {
  it("has non-empty categories", () => {
    for (const category of Object.values(EMOJI_CATEGORIES)) {
      assert.ok(category.emojis.length > 0, `${category.label} is empty`);
    }
  });

  it("has no duplicate emojis in flat library", () => {
    const unique = new Set(EMOJI_LIBRARY_FLAT);
    assert.equal(unique.size, EMOJI_LIBRARY_FLAT.length);
  });

  it("includes default emoji in library", () => {
    assert.ok(EMOJI_LIBRARY_FLAT.includes(DEFAULT_EMOJI));
  });

  it("has a substantial emoji count for builder pickers", () => {
    assert.ok(EMOJI_LIBRARY_FLAT.length >= 60);
  });
});
