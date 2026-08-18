import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildIlikePattern,
  buildOrIlikeFilter,
  buildQueryString,
  clampPage,
  countBy,
  escapeSearchTerm,
  indexBy,
  pageCountFor,
  parseListParams,
  parsePage,
  parsePageSize,
  parseSearch,
  toRange,
} from "@/domains/admin/utils/admin-query.utils";

describe("admin-query.utils", () => {
  it("normaliza página inválida para 1", () => {
    assert.equal(parsePage("3"), 3);
    assert.equal(parsePage("0"), 1);
    assert.equal(parsePage("-5"), 1);
    assert.equal(parsePage("abc"), 1);
    assert.equal(parsePage(undefined), 1);
  });

  it("limita o tamanho de página", () => {
    assert.equal(parsePageSize("10"), 10);
    assert.equal(parsePageSize("5000"), 100);
    assert.equal(parsePageSize("x"), 25);
  });

  it("normaliza o termo de busca", () => {
    assert.equal(parseSearch("  maria  "), "maria");
    assert.equal(parseSearch("   "), undefined);
    assert.equal(parseSearch(42), undefined);
    assert.equal(parseSearch("a".repeat(300))?.length, 120);
  });

  it("remove barra invertida e escapa aspas", () => {
    assert.equal(escapeSearchTerm("a\\b"), "ab");
    assert.equal(escapeSearchTerm('diz "oi"'), 'diz \\"oi\\"');
    assert.equal(escapeSearchTerm("termo\\"), "termo");
  });

  it("mantém separadores do PostgREST protegidos pelas aspas", () => {
    assert.equal(buildIlikePattern("Silva, João"), '"%Silva, João%"');
    assert.equal(buildIlikePattern("ana@x.com"), '"%ana@x.com%"');
    assert.equal(buildIlikePattern("f(x)"), '"%f(x)%"');
  });

  it("monta filtro or para múltiplas colunas", () => {
    assert.equal(
      buildOrIlikeFilter(["email", "full_name"], "ana"),
      'email.ilike."%ana%",full_name.ilike."%ana%"',
    );
  });

  it("converte página em range do Supabase", () => {
    assert.deepEqual(toRange(1, 25), { from: 0, to: 24 });
    assert.deepEqual(toRange(3, 10), { from: 20, to: 29 });
  });

  it("calcula e limita o total de páginas", () => {
    assert.equal(pageCountFor(0, 25), 1);
    assert.equal(pageCountFor(26, 25), 2);
    assert.equal(clampPage(9, 26, 25), 2);
    assert.equal(clampPage(0, 100, 25), 1);
  });

  it("monta query string ignorando vazios", () => {
    assert.equal(buildQueryString({ q: "ana", page: 2 }), "?q=ana&page=2");
    assert.equal(buildQueryString({ q: "", page: undefined }), "");
  });

  it("indexa e conta coleções", () => {
    const rows = [
      { id: "a", plan: "pro" },
      { id: "b", plan: "pro" },
      { id: "c", plan: null },
    ];
    assert.equal(indexBy(rows, (row) => row.id).get("b")?.plan, "pro");
    assert.equal(countBy(rows, (row) => row.plan).get("pro"), 2);
    assert.equal(countBy(rows, (row) => row.plan).size, 1);
  });

  it("agrega os parâmetros de listagem", () => {
    assert.deepEqual(parseListParams({ q: " ana ", page: "2" }), {
      search: "ana",
      page: 2,
      pageSize: 25,
    });
  });

  it("parseListParams ignora parâmetros ausentes", () => {
    assert.deepEqual(parseListParams({}), {
      search: undefined,
      page: 1,
      pageSize: 25,
    });
  });
});
