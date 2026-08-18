import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  quizSlugSchema,
  RESERVED_QUIZ_SLUGS,
} from "@/domains/quiz/schemas/quiz-slug.schema";

describe("quiz-slug.schema", () => {
  it("accepts valid slugs", () => {
    const result = quizSlugSchema.safeParse("meu-funil-2024");
    assert.equal(result.success, true);
  });

  it("rejects reserved slugs", () => {
    for (const slug of ["api", "q", "dashboard"]) {
      assert.ok(RESERVED_QUIZ_SLUGS.has(slug));
      const result = quizSlugSchema.safeParse(slug);
      assert.equal(result.success, false);
    }
  });

  it("rejects uppercase and spaces", () => {
    assert.equal(quizSlugSchema.safeParse("Meu Funil").success, false);
    assert.equal(quizSlugSchema.safeParse("funil_teste").success, false);
  });
});
