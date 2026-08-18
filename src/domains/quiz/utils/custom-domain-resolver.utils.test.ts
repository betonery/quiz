import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isAppOnlyRoute } from "@/domains/quiz/utils/custom-domain-resolver.utils";

describe("custom-domain-resolver.utils", () => {
  it("blocks dashboard and auth routes on custom domains", () => {
    assert.equal(isAppOnlyRoute("/dashboard"), true);
    assert.equal(isAppOnlyRoute("/login"), true);
    assert.equal(isAppOnlyRoute("/invite/abc"), true);
  });

  it("allows quiz webhook api routes", () => {
    assert.equal(isAppOnlyRoute("/api/q/my-slug/webhook"), false);
  });

  it("blocks other api routes", () => {
    assert.equal(isAppOnlyRoute("/api/health"), true);
  });

  it("allows quiz slug paths", () => {
    assert.equal(isAppOnlyRoute("/meu-funil"), false);
    assert.equal(isAppOnlyRoute("/"), false);
  });
});
