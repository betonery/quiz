import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getCustomDomainRouteDecision,
  isPlatformHost,
} from "@/domains/quiz/utils/custom-domain-middleware.utils";

describe("custom-domain-middleware.utils", () => {
  const slug = "teste-6wu8cf";

  it("rewrites root path to quiz internally", () => {
    assert.deepEqual(getCustomDomainRouteDecision("/", slug), {
      action: "rewrite-quiz",
    });
  });

  it("passes through next.js assets", () => {
    assert.deepEqual(
      getCustomDomainRouteDecision("/_next/data/build-id/page.json", slug),
      { action: "pass-through" },
    );
  });

  it("passes through quiz webhook and track api", () => {
    assert.deepEqual(
      getCustomDomainRouteDecision(`/api/q/${slug}/webhook`, slug),
      { action: "pass-through" },
    );
    assert.deepEqual(
      getCustomDomainRouteDecision(`/api/q/${slug}/track`, slug),
      { action: "pass-through" },
    );
  });

  it("redirects legacy /q/slug paths to root", () => {
    assert.deepEqual(getCustomDomainRouteDecision(`/q/${slug}`, slug), {
      action: "redirect-root",
      status: 301,
    });
  });

  it("redirects legacy /slug paths to root", () => {
    assert.deepEqual(getCustomDomainRouteDecision(`/${slug}`, slug), {
      action: "redirect-root",
      status: 301,
    });
    assert.deepEqual(getCustomDomainRouteDecision(`/${slug}/extra`, slug), {
      action: "redirect-root",
      status: 301,
    });
  });

  it("returns 404 for unknown paths", () => {
    assert.deepEqual(getCustomDomainRouteDecision("/outro-path", slug), {
      action: "not-found",
      status: 404,
    });
    assert.deepEqual(getCustomDomainRouteDecision("/dashboard", slug), {
      action: "not-found",
      status: 404,
    });
  });

  it("treats localhost and 127.0.0.1 as platform host", () => {
    assert.equal(isPlatformHost("localhost"), true);
    assert.equal(isPlatformHost("localhost:3000"), true);
    assert.equal(isPlatformHost("127.0.0.1:3000"), true);
  });

  it("treats vercel preview deployments as platform host", () => {
    assert.equal(isPlatformHost("adquiz-abc123.vercel.app"), true);
  });

  it("treats the configured app host as platform host", () => {
    assert.equal(
      isPlatformHost("app.example.com", "https://app.example.com"),
      true,
    );
  });

  it("treats vercel deployment env hosts as platform host", () => {
    const previousUrl = process.env.VERCEL_URL;
    const previousProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;

    process.env.VERCEL_URL = "adquiz-git-main-team.vercel.app";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "adquiz.appmind.com.br";

    assert.equal(isPlatformHost("adquiz-git-main-team.vercel.app"), true);
    assert.equal(isPlatformHost("adquiz.appmind.com.br"), true);

    if (previousUrl === undefined) {
      delete process.env.VERCEL_URL;
    } else {
      process.env.VERCEL_URL = previousUrl;
    }

    if (previousProductionUrl === undefined) {
      delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    } else {
      process.env.VERCEL_PROJECT_PRODUCTION_URL = previousProductionUrl;
    }
  });

  it("does not treat a custom domain as platform host even without NEXT_PUBLIC_APP_URL", () => {
    assert.equal(isPlatformHost("adquiz.appmind.com.br"), false);
    assert.equal(
      isPlatformHost("custom.client.com", "https://app.example.com"),
      false,
    );
  });
});
