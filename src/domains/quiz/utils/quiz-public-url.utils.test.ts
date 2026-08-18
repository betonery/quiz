import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getAppHost,
  getQuizPublicUrl,
  normalizeHostname,
} from "@/domains/quiz/utils/quiz-public-url.utils";

describe("quiz-public-url.utils", () => {
  it("builds platform url with /q prefix", () => {
    assert.equal(
      getQuizPublicUrl({
        slug: "meu-funil",
        appOrigin: "https://app.example.com",
      }),
      "https://app.example.com/q/meu-funil",
    );
  });

  it("builds custom domain url at root without slug", () => {
    assert.equal(
      getQuizPublicUrl({
        slug: "meu-funil",
        customDomain: "meudominio.com.br",
      }),
      "https://meudominio.com.br/",
    );
  });

  it("builds custom domain preview url at root", () => {
    assert.equal(
      getQuizPublicUrl({
        slug: "meu-funil",
        customDomain: "meudominio.com.br",
        preview: true,
      }),
      "https://meudominio.com.br/?preview=1",
    );
  });

  it("appends preview query param", () => {
    assert.equal(
      getQuizPublicUrl({
        slug: "meu-funil",
        appOrigin: "https://app.example.com",
        preview: true,
      }),
      "https://app.example.com/q/meu-funil?preview=1",
    );
  });

  it("normalizes hostname", () => {
    assert.equal(normalizeHostname("Quiz.Cliente.COM:443"), "quiz.cliente.com");
  });

  it("extracts app host from url", () => {
    assert.equal(getAppHost("https://app.example.com"), "app.example.com");
  });
});
