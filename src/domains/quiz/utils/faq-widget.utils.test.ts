import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createDefaultFaqItem } from "@/domains/quiz/types/media.types";
import { getInitialOpenItemIds, resolveFaqField } from "./faq-widget.utils";

describe("faq-widget.utils", () => {
  it("returns first item id when firstItemOpen is true", () => {
    const items = [createDefaultFaqItem(), createDefaultFaqItem("Q2?", "A2")];
    const openIds = getInitialOpenItemIds(items, true);
    assert.equal(openIds.size, 1);
    assert.equal(openIds.has(items[0]!.id), true);
  });

  it("returns empty set when firstItemOpen is false", () => {
    const items = [createDefaultFaqItem()];
    const openIds = getInitialOpenItemIds(items, false);
    assert.equal(openIds.size, 0);
  });

  it("resolves template variables in faq fields", () => {
    assert.equal(resolveFaqField("Olá {{nome}}", { nome: "Ana" }), "Olá Ana");
  });
});
