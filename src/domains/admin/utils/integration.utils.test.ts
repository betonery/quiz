import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildWebhookUrl,
  describeIntegrationStatus,
  extractArrayItemKeys,
  extractArrayPaths,
  extractPayloadPaths,
  getValueAtPath,
  isMappingComplete,
  isValidWebhookBase,
  labelToPath,
  pathToLabel,
  slugifyProvider,
} from "@/domains/admin/utils/integration.utils";

// Payload no formato típico de uma plataforma de vendas, com order bump.
const SAMPLE = {
  event: "order.paid",
  data: {
    order_id: "ord_9f8e7d",
    total: "97,00",
    customer: { email: "ANA@x.com", name: "Ana Souza", doc: null },
    items: [
      { product_id: "bump_001", title: "Bônus" },
      { product_id: "prod_abc", title: "Curso" },
    ],
  },
};

describe("integration.utils", () => {
  it("monta a URL do webhook sem barra dupla", () => {
    assert.equal(
      buildWebhookUrl("https://abc.supabase.co", "tok123"),
      "https://abc.supabase.co/functions/v1/webhook-in/tok123",
    );
    assert.equal(
      buildWebhookUrl("https://abc.supabase.co/", "tok123"),
      "https://abc.supabase.co/functions/v1/webhook-in/tok123",
    );
  });

  it("recusa base inválida em vez de gerar URL relativa", () => {
    // Com NEXT_PUBLIC_SUPABASE_URL ausente, a URL saía como
    // "/functions/v1/webhook-in/tok" e a plataforma não conseguia chamar.
    assert.equal(buildWebhookUrl("", "tok123"), null);
    assert.equal(buildWebhookUrl("abc.supabase.co", "tok123"), null);
    assert.equal(buildWebhookUrl("   ", "tok123"), null);

    assert.equal(isValidWebhookBase("https://abc.supabase.co"), true);
    assert.equal(isValidWebhookBase("http://localhost:54321"), true);
    assert.equal(isValidWebhookBase(""), false);
    assert.equal(isValidWebhookBase("abc.supabase.co"), false);
  });

  it("converte caminho e rótulo nos dois sentidos", () => {
    assert.equal(
      pathToLabel(["data", "customer", "email"]),
      "data.customer.email",
    );
    assert.deepEqual(labelToPath("data.customer.email"), [
      "data",
      "customer",
      "email",
    ]);
    assert.deepEqual(labelToPath(" data . email "), ["data", "email"]);
    assert.deepEqual(labelToPath(""), []);
  });

  it("lê valores por caminho, inclusive dentro de arrays", () => {
    assert.equal(getValueAtPath(SAMPLE, ["data", "order_id"]), "ord_9f8e7d");
    assert.equal(
      getValueAtPath(SAMPLE, ["data", "items", "1", "product_id"]),
      "prod_abc",
    );
    assert.equal(getValueAtPath(SAMPLE, ["data", "nao", "existe"]), undefined);
    assert.equal(getValueAtPath(SAMPLE, ["data", "items", "x"]), undefined);
    assert.equal(getValueAtPath(null, ["a"]), undefined);
  });

  it("detecta os caminhos do payload de exemplo", () => {
    const labels = extractPayloadPaths(SAMPLE).map((entry) => entry.label);

    assert.ok(labels.includes("event"));
    assert.ok(labels.includes("data.order_id"));
    assert.ok(labels.includes("data.customer.email"));
    assert.ok(labels.includes("data.items"));
    assert.ok(labels.includes("data.items.0.product_id"));
  });

  it("mostra prévia do valor e marca arrays", () => {
    const paths = extractPayloadPaths(SAMPLE);
    const email = paths.find((p) => p.label === "data.customer.email");
    const items = paths.find((p) => p.label === "data.items");

    assert.equal(email?.preview, "ANA@x.com");
    assert.equal(email?.isArray, false);
    assert.equal(items?.isArray, true);
    assert.equal(items?.preview, "[2 item(s)]");
  });

  it("isola os caminhos de array e as chaves dos itens", () => {
    assert.deepEqual(
      extractArrayPaths(SAMPLE).map((p) => p.label),
      ["data.items"],
    );
    assert.deepEqual(extractArrayItemKeys(SAMPLE, ["data", "items"]), [
      "product_id",
      "title",
    ]);
    assert.deepEqual(extractArrayItemKeys(SAMPLE, ["data", "customer"]), []);
  });

  it("não quebra em payload vazio", () => {
    assert.deepEqual(extractPayloadPaths({}), []);
    assert.deepEqual(extractPayloadPaths(null), []);
  });

  it("valida completude do mapeamento de compra", () => {
    const complete = {
      version: 1,
      email: ["data", "customer", "email"],
      externalPaymentId: ["data", "order_id"],
      plan: {
        mode: "reference_any",
        arrayPath: ["data", "items"],
        key: "product_id",
      },
      access: { mode: "fixed", days: 30 },
    };

    assert.equal(isMappingComplete("purchase", complete), true);
    assert.equal(isMappingComplete("purchase", {}), false);

    // Sem identificador do pedido não há idempotência.
    assert.equal(
      isMappingComplete("purchase", { ...complete, externalPaymentId: [] }),
      false,
    );
    // Plano incompleto.
    assert.equal(
      isMappingComplete("purchase", {
        ...complete,
        plan: { mode: "reference_any", arrayPath: ["data", "items"] },
      }),
      false,
    );
    // Dias zerados.
    assert.equal(
      isMappingComplete("purchase", {
        ...complete,
        access: { mode: "fixed", days: 0 },
      }),
      false,
    );
  });

  it("aceita mapeamento de reembolso com apenas uma âncora", () => {
    assert.equal(
      isMappingComplete("refund", { version: 1, email: ["data", "email"] }),
      true,
    );
    assert.equal(
      isMappingComplete("refund", {
        version: 1,
        externalPaymentId: ["data", "order_id"],
      }),
      true,
    );
    assert.equal(isMappingComplete("refund", { version: 1 }), false);
  });

  it("deriva o estado de onboarding da integração", () => {
    const mapping = {
      version: 1,
      email: ["data", "email"],
      externalPaymentId: ["data", "order_id"],
      plan: { mode: "fixed", planId: "pro" },
      access: { mode: "fixed", days: 30 },
    };

    assert.equal(
      describeIntegrationStatus(
        { kind: "purchase", enabled: false, fieldMapping: {} },
        0,
      ),
      "awaiting_sample",
    );
    assert.equal(
      describeIntegrationStatus(
        { kind: "purchase", enabled: false, fieldMapping: {} },
        3,
      ),
      "needs_mapping",
    );
    assert.equal(
      describeIntegrationStatus(
        { kind: "purchase", enabled: false, fieldMapping: mapping },
        3,
      ),
      "ready",
    );
    assert.equal(
      describeIntegrationStatus(
        { kind: "purchase", enabled: true, fieldMapping: mapping },
        3,
      ),
      "active",
    );
  });

  it("gera slug de plataforma no formato aceito pelo banco", () => {
    const pattern = /^[a-z][a-z0-9_-]*$/;

    assert.equal(slugifyProvider("Kiwify"), "kiwify");
    assert.equal(slugifyProvider("Perfect Pay"), "perfect-pay");
    assert.equal(slugifyProvider("Ação Digital"), "acao-digital");
    assert.equal(slugifyProvider("  "), "plataforma");
    assert.equal(slugifyProvider("123 loja"), "p-123-loja");

    for (const name of [
      "Kiwify",
      "Perfect Pay",
      "Ação Digital",
      "  ",
      "123 loja",
    ]) {
      const slug = slugifyProvider(name);
      assert.match(slug, pattern);
      assert.ok(slug.length <= 40);
    }
  });
});
