import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getEmbedSandboxAttrs, parseEmbedInput } from "./embed-widget.utils";

describe("embed-widget.utils", () => {
  it("accepts calendly and typeform urls", () => {
    const calendly = parseEmbedInput("https://calendly.com/user/30min");
    assert.ok(calendly);
    assert.equal(calendly?.provider, "calendly");

    const typeform = parseEmbedInput(
      '<iframe src="https://form.typeform.com/to/abc123"></iframe>',
    );
    assert.ok(typeform);
    assert.equal(typeform?.provider, "typeform");
  });

  it("rejects unknown hosts", () => {
    assert.equal(parseEmbedInput("https://evil.example.com/form"), null);
  });

  it("builds sandbox attrs", () => {
    assert.match(getEmbedSandboxAttrs(true), /allow-scripts/);
    assert.match(getEmbedSandboxAttrs(true), /allow-presentation/);
  });
});
