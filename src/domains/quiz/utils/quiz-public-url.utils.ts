import { ROUTES } from "@/constants/routes";

type GetQuizPublicUrlParams = {
  slug: string;
  appOrigin?: string;
  customDomain?: string | null;
  preview?: boolean;
};

function normalizeOrigin(origin: string): string {
  return origin.replace(/\/+$/, "");
}

export function getQuizPublicUrl({
  slug,
  appOrigin = "",
  customDomain,
  preview = false,
}: GetQuizPublicUrlParams): string {
  const search = preview ? "?preview=1" : "";

  if (customDomain) {
    const host = customDomain.replace(/^https?:\/\//, "").replace(/\/+$/, "");
    return `https://${host}/${search}`;
  }

  const origin = normalizeOrigin(appOrigin || "http://localhost:3000");
  return `${origin}${ROUTES.publicQuiz(slug)}${search}`;
}

export function getAppHost(appUrl: string): string {
  try {
    return new URL(appUrl).host;
  } catch {
    return "localhost:3000";
  }
}

export function normalizeHostname(hostname: string): string {
  return hostname.toLowerCase().split(":")[0]?.trim() ?? "";
}
