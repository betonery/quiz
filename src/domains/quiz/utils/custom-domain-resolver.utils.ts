import type { CustomDomainMapping } from "@/domains/quiz/types/quiz-settings.types";
import { normalizeHostname } from "@/domains/quiz/utils/quiz-public-url.utils";

type SupabaseDomainRow = {
  quiz_id: string;
  hostname: string;
};

export async function resolveCustomDomainMappingEdge(
  hostname: string,
): Promise<CustomDomainMapping | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  const normalized = normalizeHostname(hostname);
  const domainUrl = new URL(`${supabaseUrl}/rest/v1/quiz_custom_domains`);
  domainUrl.searchParams.set("hostname", `eq.${normalized}`);
  domainUrl.searchParams.set("status", "eq.verified");
  domainUrl.searchParams.set("select", "quiz_id,hostname");
  domainUrl.searchParams.set("limit", "1");

  const domainResponse = await fetch(domainUrl.toString(), {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    next: { revalidate: 60 },
  });

  if (!domainResponse.ok) {
    return null;
  }

  const domainRows = (await domainResponse.json()) as SupabaseDomainRow[];
  const domainRow = domainRows[0];
  if (!domainRow) {
    return null;
  }

  const quizUrl = new URL(`${supabaseUrl}/rest/v1/quizzes`);
  quizUrl.searchParams.set("id", `eq.${domainRow.quiz_id}`);
  quizUrl.searchParams.set("select", "slug");
  quizUrl.searchParams.set("limit", "1");

  const quizResponse = await fetch(quizUrl.toString(), {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    next: { revalidate: 60 },
  });

  if (!quizResponse.ok) {
    return null;
  }

  const quizRows = (await quizResponse.json()) as Array<{ slug: string }>;
  const slug = quizRows[0]?.slug;
  if (!slug) {
    return null;
  }

  return {
    quizId: domainRow.quiz_id,
    slug,
    hostname: domainRow.hostname,
  };
}

export function isAppOnlyRoute(pathname: string): boolean {
  const blockedPrefixes = [
    "/dashboard",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/auth",
    "/invite",
  ];

  if (blockedPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return false;
  }

  const reserved = new Set([
    "dashboard",
    "login",
    "register",
    "auth",
    "invite",
    "api",
  ]);

  return reserved.has(segments[0]) && !pathname.startsWith("/api/q/");
}
