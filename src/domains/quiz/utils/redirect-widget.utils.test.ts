import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  parseRedirectHandle,
  redirectHandleId,
} from "@/domains/quiz/types/flow.types";
import { clampRedirectDelaySeconds } from "./redirect-widget.utils";

describe("redirect-widget.utils", () => {
  it("clamps redirect delay between 1 and 120 seconds", () => {
    assert.equal(clampRedirectDelaySeconds(0), 1);
    assert.equal(clampRedirectDelaySeconds(200), 120);
    assert.equal(clampRedirectDelaySeconds(3.6), 4);
    assert.equal(clampRedirectDelaySeconds(Number.NaN), 1);
  });
});

describe("redirect flow handles", () => {
  it("builds and parses redirect handle ids", () => {
    assert.equal(redirectHandleId("abc123"), "rdt-abc123");
    assert.equal(parseRedirectHandle("rdt-abc123"), "abc123");
    assert.equal(parseRedirectHandle("btn-abc123"), null);
  });
});
