import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  centsToReaisInput,
  formatCurrencyBRL,
  formatInstallmentBRL,
  parseReaisInput,
} from "./currency.utils";

describe("currency.utils", () => {
  it("parses reais input formats", () => {
    assert.equal(parseReaisInput("497"), 49700);
    assert.equal(parseReaisInput("497,00"), 49700);
    assert.equal(parseReaisInput("1.497,90"), 149790);
    assert.equal(parseReaisInput("R$ 99,50"), 9950);
    assert.equal(parseReaisInput(""), null);
    assert.equal(parseReaisInput("abc"), null);
  });

  it("formats BRL currency", () => {
    assert.match(formatCurrencyBRL(49700), /497/);
  });

  it("formats installments", () => {
    const result = formatInstallmentBRL(49700, 12);
    assert.match(result, /^12x de /);
  });

  it("converts cents to reais input", () => {
    assert.equal(centsToReaisInput(49700), "497,00");
  });
});
