import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getScriptDedupeStorageKey,
  getScriptPreviewLabel,
  getScriptPreviewLines,
  hasScriptContent,
  parseScriptEmbedCode,
} from "./script-widget.utils";

describe("script-widget.utils", () => {
  it("parses inline script snippets", () => {
    const snippets = parseScriptEmbedCode(
      '<script>console.log("custom script")</script>',
    );

    assert.equal(snippets.length, 1);
    assert.equal(snippets[0]?.kind, "script");
    if (snippets[0]?.kind === "script") {
      assert.equal(snippets[0].inline, 'console.log("custom script")');
      assert.equal(snippets[0].src, undefined);
    }
  });

  it("parses external script with src", () => {
    const snippets = parseScriptEmbedCode(
      '<script async src="https://example.com/pixel.js"></script>',
    );

    assert.equal(snippets.length, 1);
    if (snippets[0]?.kind === "script") {
      assert.equal(snippets[0].src, "https://example.com/pixel.js");
      assert.equal(snippets[0].async, true);
    }
  });

  it("parses noscript snippets", () => {
    const snippets = parseScriptEmbedCode(
      '<noscript><img src="https://example.com/pixel.gif" alt="" /></noscript>',
    );

    assert.equal(snippets.length, 1);
    assert.equal(snippets[0]?.kind, "noscript");
    if (snippets[0]?.kind === "noscript") {
      assert.match(snippets[0].html, /pixel\.gif/);
    }
  });

  it("detects script content", () => {
    assert.equal(hasScriptContent(""), false);
    assert.equal(hasScriptContent('<script>console.log("x")</script>'), true);
  });

  it("truncates preview lines", () => {
    const preview = getScriptPreviewLines("line1\nline2\nline3\nline4", 2);
    assert.match(preview, /line1/);
    assert.match(preview, /\.\.\./);
  });

  it("returns placeholder when preview is empty", () => {
    assert.match(getScriptPreviewLines(""), /seu código aqui/);
  });

  it("builds dedupe storage key", () => {
    assert.equal(getScriptDedupeStorageKey("abc123"), "adquiz:script:abc123");
  });

  it("truncates preview label", () => {
    const long = `<script>${"x".repeat(50)}</script>`;
    assert.equal(getScriptPreviewLabel(long).length, 40);
  });
});
