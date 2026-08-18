import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildVariableSnippet,
  insertSnippetAtCursor,
} from "./insert-at-cursor.utils";

describe("insert-at-cursor.utils", () => {
  it("inserts snippet at cursor preserving surrounding text", () => {
    const result = insertSnippetAtCursor(
      "Olá mundo",
      { start: 3, end: 3 },
      "{{nome}}",
    );

    assert.equal(result.nextValue, "Olá{{nome}} mundo");
    assert.equal(result.cursor, 3 + "{{nome}}".length);
  });

  it("replaces selected text with snippet", () => {
    const result = insertSnippetAtCursor(
      "Olá mundo",
      { start: 0, end: 3 },
      "{{saudacao}}",
    );

    assert.equal(result.nextValue, "{{saudacao}} mundo");
  });

  it("builds variable snippet", () => {
    assert.equal(buildVariableSnippet("email"), "{{email}}");
  });
});
