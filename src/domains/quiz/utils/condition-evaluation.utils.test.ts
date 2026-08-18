import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  FLOW_CONDITION_ELSE_HANDLE,
  conditionHandleId,
} from "@/domains/quiz/types/flow.types";
import type {
  ConditionBranch,
  ConditionFunctionConfig,
} from "@/domains/quiz/types/flow.types";
import {
  evaluateBranch,
  evaluateComparison,
  formatConditionSummary,
  resolveConditionHandle,
} from "./condition-evaluation.utils";

describe("condition-evaluation.utils", () => {
  it("evaluates eq comparison", () => {
    const result = evaluateComparison(
      {
        id: "c1",
        variableKey: "soma",
        operator: "eq",
        value: "10",
      },
      { soma: 10 },
    );
    assert.equal(result, true);
  });

  it("evaluates branch with AND join", () => {
    const branch: ConditionBranch = {
      id: "b1",
      comparisons: [
        { id: "c1", variableKey: "a", operator: "eq", value: "1" },
        {
          id: "c2",
          variableKey: "b",
          operator: "eq",
          value: "2",
          joinWithPrevious: "and",
        },
      ],
    };
    assert.equal(evaluateBranch(branch, { a: 1, b: 2 }), true);
    assert.equal(evaluateBranch(branch, { a: 1, b: 3 }), false);
  });

  it("evaluates branch with OR join", () => {
    const branch: ConditionBranch = {
      id: "b1",
      comparisons: [
        { id: "c1", variableKey: "a", operator: "eq", value: "1" },
        {
          id: "c2",
          variableKey: "b",
          operator: "eq",
          value: "2",
          joinWithPrevious: "or",
        },
      ],
    };
    assert.equal(evaluateBranch(branch, { a: 9, b: 2 }), true);
    assert.equal(evaluateBranch(branch, { a: 9, b: 9 }), false);
  });

  it("resolves first matching branch handle", () => {
    const config: ConditionFunctionConfig = {
      branches: [
        {
          id: "branch-a",
          comparisons: [
            { id: "c1", variableKey: "soma", operator: "eq", value: "10" },
          ],
        },
        {
          id: "branch-b",
          comparisons: [
            { id: "c2", variableKey: "soma", operator: "eq", value: "20" },
          ],
        },
      ],
    };

    assert.equal(
      resolveConditionHandle(config, { soma: 10 }),
      conditionHandleId("branch-a"),
    );
    assert.equal(
      resolveConditionHandle(config, { soma: 20 }),
      conditionHandleId("branch-b"),
    );
    assert.equal(
      resolveConditionHandle(config, { soma: 5 }),
      FLOW_CONDITION_ELSE_HANDLE,
    );
  });

  it("formats condition summary for display", () => {
    const summary = formatConditionSummary({
      id: "b1",
      comparisons: [
        { id: "c1", variableKey: "soma", operator: "eq", value: "10" },
      ],
    });
    assert.match(summary, /soma/);
    assert.match(summary, /10/);
  });
});
