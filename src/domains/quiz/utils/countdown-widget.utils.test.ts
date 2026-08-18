import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { defaultQuizDesignSettings } from "@/domains/quiz/types/design.types";
import {
  didCountdownReachZero,
  formatCountdownParts,
  getCountdownStorageKey,
  getRemainingSeconds,
  getCountdownPlaceholderSeconds,
  normalizeCountdownLegacyConfig,
  padCountdownUnit,
  resolveCountdownColors,
  resolveSessionCountdownEndTimestamp,
} from "./countdown-widget.utils";

describe("countdown-widget.utils", () => {
  it("builds storage key", () => {
    assert.equal(
      getCountdownStorageKey("meu-funil", "abc123"),
      "adquiz:countdown:meu-funil:abc123",
    );
  });

  it("formats countdown parts", () => {
    const parts = formatCountdownParts(3661, false);
    assert.equal(parts.hours, 1);
    assert.equal(parts.minutes, 1);
    assert.equal(parts.seconds, 1);
  });

  it("formats countdown parts with days", () => {
    const parts = formatCountdownParts(90061, true);
    assert.equal(parts.days, 1);
    assert.equal(parts.hours, 1);
  });

  it("calculates remaining seconds", () => {
    const future = Date.now() + 5000;
    assert.equal(getRemainingSeconds(future) >= 4, true);
  });

  it("pads countdown units", () => {
    assert.equal(padCountdownUnit(5), "05");
  });

  it("resolves countdown colors", () => {
    const colors = resolveCountdownColors(
      {
        digitBackgroundColor: null,
        digitTextColor: null,
        labelColor: null,
        separatorColor: null,
        accentColor: null,
      },
      defaultQuizDesignSettings,
    );
    assert.equal(
      colors.digitBackground,
      defaultQuizDesignSettings.colors.primary,
    );
  });

  it("normalizes legacy countdown config", () => {
    assert.deepEqual(
      normalizeCountdownLegacyConfig({ onExpireAction: "next_step" }),
      { flowOutputEnabled: true },
    );
    assert.deepEqual(
      normalizeCountdownLegacyConfig({ onExpireAction: "message" }),
      { flowOutputEnabled: false },
    );
    assert.deepEqual(
      normalizeCountdownLegacyConfig({ flowOutputEnabled: true }),
      { flowOutputEnabled: true },
    );
  });

  it("detects countdown reaching zero", () => {
    assert.equal(didCountdownReachZero(1, 0), true);
    assert.equal(didCountdownReachZero(0, 0), false);
    assert.equal(didCountdownReachZero(5, 3), false);
  });

  it("uses session duration as hydration-safe placeholder", () => {
    assert.equal(
      getCountdownPlaceholderSeconds({
        mode: "session",
        sessionDurationSeconds: 900,
        targetDateIso: null,
      }),
      900,
    );
  });

  it("continues active session countdown", () => {
    const now = 1_000_000;
    const storage = new Map<string, string>();
    const key = "test-key";

    storage.set(key, JSON.stringify({ startedAt: now - 30_000 }));

    const end = resolveSessionCountdownEndTimestamp(
      60,
      {
        getItem: (itemKey) => storage.get(itemKey) ?? null,
        setItem: (itemKey, value) => {
          storage.set(itemKey, value);
        },
        removeItem: (itemKey) => {
          storage.delete(itemKey);
        },
      },
      key,
      now,
    );

    assert.equal(end, now - 30_000 + 60_000);
    assert.equal(getRemainingSeconds(end, now), 30);
  });

  it("restarts expired session countdown", () => {
    const now = 1_000_000;
    const storage = new Map<string, string>();
    const key = "test-key";

    storage.set(key, JSON.stringify({ startedAt: now - 120_000 }));

    const end = resolveSessionCountdownEndTimestamp(
      60,
      {
        getItem: (itemKey) => storage.get(itemKey) ?? null,
        setItem: (itemKey, value) => {
          storage.set(itemKey, value);
        },
        removeItem: (itemKey) => {
          storage.delete(itemKey);
        },
      },
      key,
      now,
    );

    assert.equal(end, now + 60_000);
    assert.equal(getRemainingSeconds(end, now), 60);
  });
});
