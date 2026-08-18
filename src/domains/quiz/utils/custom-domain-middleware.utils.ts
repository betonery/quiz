import { NextResponse, type NextRequest } from "next/server";
import {
  isAppOnlyRoute,
  resolveCustomDomainMappingEdge,
} from "@/domains/quiz/utils/custom-domain-resolver.utils";
import {
  getAppHost,
  normalizeHostname,
} from "@/domains/quiz/utils/quiz-public-url.utils";

export type CustomDomainRouteDecision =
  | { action: "pass-through" }
  | { action: "rewrite-quiz" }
  | { action: "redirect-root"; status: 301 }
  | { action: "not-found"; status: 404 };

export function getCustomDomainRouteDecision(
  pathname: string,
  slug: string,
): CustomDomainRouteDecision {
  if (pathname.startsWith("/_next")) {
    return { action: "pass-through" };
  }

  if (isAppOnlyRoute(pathname)) {
    return { action: "not-found", status: 404 };
  }

  if (
    pathname === `/api/q/${slug}/webhook` ||
    pathname === `/api/q/${slug}/track`
  ) {
    return { action: "pass-through" };
  }

  if (pathname.startsWith("/api/")) {
    return { action: "not-found", status: 404 };
  }

  if (pathname === "/") {
    return { action: "rewrite-quiz" };
  }

  if (
    pathname === `/q/${slug}` ||
    pathname.startsWith(`/q/${slug}/`) ||
    pathname === `/${slug}` ||
    pathname.startsWith(`/${slug}/`)
  ) {
    return { action: "redirect-root", status: 301 };
  }

  return { action: "not-found", status: 404 };
}

export function applyCustomDomainRouteDecision(
  decision: CustomDomainRouteDecision,
  request: NextRequest,
  slug: string,
): NextResponse | null {
  switch (decision.action) {
    case "pass-through":
      return null;
    case "rewrite-quiz": {
      const url = request.nextUrl.clone();
      url.pathname = `/q/${slug}`;
      return NextResponse.rewrite(url);
    }
    case "redirect-root":
      return NextResponse.redirect(new URL("/", request.url), decision.status);
    case "not-found":
      return new NextResponse("Not Found", { status: decision.status });
  }
}

function resolveHostFromEnvValue(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (trimmed.includes("://")) {
    return normalizeHostname(getAppHost(trimmed));
  }

  return normalizeHostname(trimmed);
}

function getConfiguredPlatformHosts(appUrl?: string): Set<string> {
  const hosts = new Set<string>();

  for (const value of [
    appUrl,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_URL,
    process.env.VERCEL_BRANCH_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  ]) {
    if (!value) continue;

    const host = resolveHostFromEnvValue(value);
    if (host) {
      hosts.add(host);
    }
  }

  return hosts;
}

export function isPlatformHost(host: string, appUrl?: string): boolean {
  const normalizedHost = normalizeHostname(host);

  if (
    normalizedHost === "localhost" ||
    normalizedHost === "127.0.0.1" ||
    normalizedHost.endsWith(".vercel.app")
  ) {
    return true;
  }

  const platformHosts = getConfiguredPlatformHosts(appUrl);
  if (platformHosts.has(normalizedHost)) {
    return true;
  }

  return false;
}

export async function handleCustomDomainRequest(
  request: NextRequest,
): Promise<NextResponse | null> {
  const host = request.headers.get("host");

  if (!host) {
    return null;
  }

  // Hosts conhecidos da plataforma nunca sao tratados como dominio customizado.
  // Nao dependemos de NEXT_PUBLIC_APP_URL para reconhecer dominios customizados:
  // ele e usado apenas como otimizacao para pular o lookup no host da plataforma.
  if (isPlatformHost(host, process.env.NEXT_PUBLIC_APP_URL)) {
    return null;
  }

  const normalizedHost = normalizeHostname(host);
  const mapping = await resolveCustomDomainMappingEdge(normalizedHost);

  if (!mapping) {
    // Host desconhecido ou sem mapping verificado: deixa a plataforma tratar
    // (em vez de 404), para nao quebrar caso o host nao esteja cadastrado.
    console.warn(
      `[custom-domain] sem mapping verificado para host=${normalizedHost}`,
    );
    return null;
  }

  const decision = getCustomDomainRouteDecision(
    request.nextUrl.pathname,
    mapping.slug,
  );

  return applyCustomDomainRouteDecision(decision, request, mapping.slug);
}
