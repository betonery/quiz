import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatCents,
  formatRate,
  formatRelativeTime,
  initialsFrom,
  safeRate,
  truncate,
} from "@/domains/admin/utils/admin-format.utils";

describe("admin-format.utils", () => {
  it("formata centavos em BRL", () => {
    assert.match(formatCents(9900), /99,00/);
    assert.match(formatCents(0), /0,00/);
    assert.match(formatCents(null), /0,00/);
  });

  it("evita divisão por zero em taxas", () => {
    assert.equal(safeRate(10, 0), 0);
    assert.equal(safeRate(0, 0), 0);
    assert.equal(safeRate(5, 10), 0.5);
  });

  it("formata taxas em percentual", () => {
    assert.equal(formatRate(0.5), "50%");
    assert.equal(formatRate(0), "0%");
    assert.equal(formatRate(0.123), "12,3%");
  });

  it("formata tempo relativo", () => {
    const now = new Date("2026-08-07T12:00:00.000Z");
    assert.equal(
      formatRelativeTime("2026-08-05T12:00:00.000Z", now),
      "anteontem",
    );
    assert.equal(formatRelativeTime(null, now), "—");
    assert.equal(formatRelativeTime("data-invalida", now), "—");
  });

  it("gera iniciais a partir de nome ou e-mail", () => {
    assert.equal(initialsFrom("Maria Silva", "m@x.com"), "MS");
    assert.equal(initialsFrom(null, "joao.pedro@x.com"), "JP");
    assert.equal(initialsFrom("  ", "ana@x.com"), "AN");
  });

  it("trunca textos longos", () => {
    assert.equal(truncate("abcdef", 10), "abcdef");
    assert.equal(truncate("abcdef", 4), "abc…");
  });
});
