import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  clonePlayerSnapshot,
  popPlayerSnapshot,
  pushPlayerSnapshot,
} from "./player-navigation.utils";

describe("player-navigation.utils", () => {
  it("clones snapshot without sharing references", () => {
    const original = {
      stepIndex: 1,
      variables: { soma: 4 },
      answers: { widget1: "A" },
    };

    const cloned = clonePlayerSnapshot(original);
    cloned.variables.soma = 7;
    cloned.answers.widget1 = "B";

    assert.equal(original.variables.soma, 4);
    assert.equal(original.answers.widget1, "A");
  });

  it("pushes and pops snapshots in LIFO order", () => {
    const first = {
      stepIndex: 0,
      variables: {},
      answers: {},
    };
    const second = {
      stepIndex: 1,
      variables: { soma: 4 },
      answers: { widget1: "A" },
    };

    const afterPush = pushPlayerSnapshot(pushPlayerSnapshot([], first), second);
    const firstPop = popPlayerSnapshot(afterPush);
    const secondPop = popPlayerSnapshot(firstPop.history);

    assert.deepEqual(firstPop.snapshot, second);
    assert.deepEqual(secondPop.snapshot, first);
    assert.equal(secondPop.history.length, 0);
  });
});
