import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildSampleVariables,
  buildWebhookPayload,
  isBlockedWebhookHost,
  validateWebhookUrl,
} from "./webhook-dispatch.utils";

describe("webhook-dispatch.utils", () => {
  it("builds payload with only selected variable keys", () => {
    const payload = buildWebhookPayload({
      event: "quiz.webhook.test",
      quizId: "quiz-1",
      functionId: "fn-1",
      variableKeys: ["nome", "email"],
      variables: {
        nome: "João",
        email: "joao@exemplo.com",
        telefone: "11999999999",
      },
    });

    assert.deepEqual(payload, {
      event: "quiz.webhook.test",
      quizId: "quiz-1",
      functionId: "fn-1",
      variables: {
        nome: "João",
        email: "joao@exemplo.com",
      },
    });
  });

  it("ignores missing variable keys in payload", () => {
    const payload = buildWebhookPayload({
      event: "quiz.webhook.lead",
      quizId: "quiz-1",
      functionId: "fn-1",
      variableKeys: ["nome", "inexistente"],
      variables: { nome: "Maria" },
    });

    assert.deepEqual(payload.variables, { nome: "Maria" });
  });

  it("builds sample list variables for webhook tests", () => {
    const sample = buildSampleVariables(
      ["interesses"],
      [{ key: "interesses", label: "Interesses", valueType: "list" }],
    );

    assert.deepEqual(sample, {
      interesses: ["Interesses", "outro_valor"],
    });
  });

  it("builds sample variables from registry labels", () => {
    const sample = buildSampleVariables(
      ["nome", "email"],
      [
        { key: "nome", label: "Nome completo" },
        { key: "email", label: "" },
      ],
    );

    assert.deepEqual(sample, {
      nome: "Nome completo",
      email: "valor_teste",
    });
  });

  it("requires https urls", () => {
    assert.equal(validateWebhookUrl(""), "URL do webhook é obrigatória");
    assert.equal(
      validateWebhookUrl("http://example.com/webhook"),
      "Use HTTPS na URL do webhook",
    );
    assert.equal(validateWebhookUrl("not-a-url"), "URL inválida");
    assert.equal(validateWebhookUrl("https://example.com/hook"), null);
  });

  it("allows localhost http in development mode", () => {
    assert.equal(
      validateWebhookUrl("http://localhost:3000/api/hook", {
        allowLocalhost: true,
      }),
      null,
    );
  });

  it("blocks SSRF to internal/private hosts over https", () => {
    const blockedMessage =
      "URL do webhook aponta para um host interno não permitido";
    assert.equal(
      validateWebhookUrl("https://169.254.169.254/latest/meta-data"),
      blockedMessage,
    );
    assert.equal(validateWebhookUrl("https://127.0.0.1/hook"), blockedMessage);
    assert.equal(validateWebhookUrl("https://10.0.0.5/hook"), blockedMessage);
    assert.equal(
      validateWebhookUrl("https://192.168.1.10/hook"),
      blockedMessage,
    );
    assert.equal(validateWebhookUrl("https://172.16.0.1/hook"), blockedMessage);
    assert.equal(
      validateWebhookUrl("https://metadata.google.internal/x"),
      blockedMessage,
    );
    assert.equal(
      validateWebhookUrl("https://service.internal/x"),
      blockedMessage,
    );
    assert.equal(validateWebhookUrl("https://[::1]/hook"), blockedMessage);
  });

  it("identifies blocked hosts directly", () => {
    assert.equal(isBlockedWebhookHost("169.254.169.254"), true);
    assert.equal(isBlockedWebhookHost("10.1.2.3"), true);
    assert.equal(isBlockedWebhookHost("100.64.0.1"), true);
    assert.equal(isBlockedWebhookHost("example.com"), false);
    assert.equal(isBlockedWebhookHost("8.8.8.8"), false);
    assert.equal(isBlockedWebhookHost("hooks.zapier.com"), false);
  });
});
