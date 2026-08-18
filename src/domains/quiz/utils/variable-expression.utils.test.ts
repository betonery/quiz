import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  evaluateArithmetic,
  evaluateVariableExpression,
  interpolateExpression,
  isNumericExpression,
} from "./variable-expression.utils";

describe("variable-expression.utils", () => {
  it("evaluates literal number", () => {
    assert.equal(evaluateVariableExpression("4", {}), 4);
  });

  it("evaluates addition with variable", () => {
    assert.equal(evaluateVariableExpression("{{soma}} + 3", { soma: 4 }), 7);
  });

  it("evaluates multiplication and addition", () => {
    assert.equal(
      evaluateVariableExpression("{{soma}} * 2 + 1", { soma: 4 }),
      9,
    );
  });

  it("keeps unresolved variables as text", () => {
    assert.equal(
      evaluateVariableExpression("{{soma}} + 3", {}),
      "{{soma}} + 3",
    );
  });

  it("returns plain text without operators", () => {
    assert.equal(
      evaluateVariableExpression("{{nome}}", { nome: "Ana" }),
      "Ana",
    );
  });

  it("parses parenthesized arithmetic", () => {
    assert.equal(evaluateArithmetic("(2 + 3) * 4"), 20);
  });

  it("detects numeric expressions", () => {
    assert.equal(isNumericExpression("{{soma}} + 3"), true);
    assert.equal(isNumericExpression("Olá"), false);
  });

  it("interpolates numeric strings", () => {
    assert.equal(interpolateExpression("{{soma}} + 1", { soma: "4" }), "4 + 1");
  });
});
