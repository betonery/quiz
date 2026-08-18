import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveResultVariant } from "./result-block-widget.utils";
import type { ResultBlockVariant } from "@/domains/quiz/types/media.types";

describe("result-block-widget.utils", () => {
  it("matches score ranges", () => {
    const low: ResultBlockVariant = {
      id: "low",
      minScore: 0,
      maxScore: 49,
      title: "Baixo",
      description: "Desc",
      imageSource: { sourceType: "url", url: "" },
      showImage: false,
    };
    const high: ResultBlockVariant = {
      id: "high",
      minScore: 50,
      maxScore: 100,
      title: "Alto",
      description: "Desc",
      imageSource: { sourceType: "url", url: "" },
      showImage: false,
    };

    const variant = resolveResultVariant(
      {
        mode: "by_score",
        scoreVariableKey: "pontuacao",
        variants: [low, high],
        defaultVariantId: "low",
      },
      { pontuacao: 72 },
    );

    assert.equal(variant?.id, "high");
  });
});
