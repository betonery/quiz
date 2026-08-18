import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { defaultQuizDesignSettings } from "@/domains/quiz/types/design.types";
import {
  resolveBenefitText,
  resolveBenefitsColors,
} from "./benefits-widget.utils";

describe("benefits-widget.utils", () => {
  it("resolves benefit text with variables", () => {
    assert.equal(
      resolveBenefitText("Olá {{nome}}", { nome: "Ana" }),
      "Olá Ana",
    );
  });

  it("resolves colors with design fallbacks", () => {
    const colors = resolveBenefitsColors(
      { iconColor: null, textColor: null, cardBackgroundColor: null },
      defaultQuizDesignSettings,
    );
    assert.equal(colors.icon, defaultQuizDesignSettings.colors.primary);
    assert.equal(colors.text, defaultQuizDesignSettings.colors.texts);
  });
});
