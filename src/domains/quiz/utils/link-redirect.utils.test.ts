import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { appendCurrentSearchParams } from "@/domains/quiz/utils/link-redirect.utils";

describe("link-redirect.utils", () => {
  it("returns url unchanged when window is unavailable", () => {
    assert.equal(
      appendCurrentSearchParams("https://checkout.com"),
      "https://checkout.com",
    );
  });
});
