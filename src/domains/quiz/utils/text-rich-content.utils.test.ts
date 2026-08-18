import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  extractTextWidgetVariableKeys,
  extractVariableKeysFromRichContent,
  migrateLegacyTextFontSize,
  plainContentToRichJson,
  renderRichTextHtml,
  resolveRichContentJson,
  richContentToPlainText,
  sanitizeRichHtml,
} from "./text-rich-content.utils";
import { parseWidgetConfig } from "./widget-config.utils";

describe("text-rich-content.utils", () => {
  it("migrates legacy font sizes to px", () => {
    assert.equal(migrateLegacyTextFontSize("sm", undefined), 14);
    assert.equal(migrateLegacyTextFontSize("md", undefined), 16);
    assert.equal(migrateLegacyTextFontSize("lg", undefined), 20);
    assert.equal(migrateLegacyTextFontSize(undefined, 24), 24);
  });

  it("converts plain content with variables to rich json", () => {
    const richContent = plainContentToRichJson("Olá {{nome}}");
    assert.match(richContent, /variableChip/);
    assert.equal(richContentToPlainText(richContent), "Olá {{nome}}");
  });

  it("extracts variable keys from rich content", () => {
    const richContent = plainContentToRichJson("Oi {{nome}} e {{email}}");
    assert.deepEqual(extractVariableKeysFromRichContent(richContent).sort(), [
      "email",
      "nome",
    ]);
  });

  it("resolves variables in rich json before html render", () => {
    const richContent = plainContentToRichJson("Olá {{nome}}");
    const resolved = resolveRichContentJson(richContent, { nome: "Maria" });
    const html = renderRichTextHtml(resolved);
    assert.match(html, /Maria/);
    assert.doesNotMatch(html, /\{\{nome\}\}/);
  });

  it("sanitizes malicious html", () => {
    const safe = sanitizeRichHtml(
      '<p>ok</p><script>alert(1)</script><iframe src="x"></iframe>',
    );
    assert.match(safe, /ok/);
    assert.doesNotMatch(safe, /script/);
    assert.doesNotMatch(safe, /iframe/);
  });

  it("extracts keys from plain and rich configs", () => {
    const richContent = plainContentToRichJson("{{idade}}");
    assert.deepEqual(
      extractTextWidgetVariableKeys({
        content: "",
        contentMode: "rich",
        richContent,
      }),
      ["idade"],
    );
    assert.deepEqual(
      extractTextWidgetVariableKeys({
        content: "{{nome}}",
        contentMode: "plain",
        richContent: null,
      }),
      ["nome"],
    );
  });
});

describe("parseWidgetConfig text migration", () => {
  it("migrates legacy text widget config", () => {
    const config = parseWidgetConfig("text", {
      content: "Legado",
      fontSize: "lg",
      fontWeight: "bold",
      color: "#111111",
      align: "center",
    });

    assert.equal((config as { fontSizePx: number }).fontSizePx, 20);
    assert.equal((config as { content: string }).content, "Legado");
  });
});
