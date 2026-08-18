export type EmbedProvider =
  | "typeform"
  | "calendly"
  | "google"
  | "stripe"
  | "hubspot"
  | "notion"
  | "airtable"
  | "unknown";

export type ParsedEmbed = {
  src: string;
  provider: EmbedProvider;
};

const ALLOWED_HOST_SUFFIXES = [
  "typeform.com",
  "calendly.com",
  "google.com",
  "stripe.com",
  "hubspot.com",
  "notion.so",
  "notion.site",
  "airtable.com",
  "jotform.com",
  "tally.so",
  "paperform.co",
  "fillout.com",
];

function normalizeHost(hostname: string): string {
  return hostname.replace(/^www\./, "").toLowerCase();
}

function isAllowedHost(hostname: string): boolean {
  const normalized = normalizeHost(hostname);
  return ALLOWED_HOST_SUFFIXES.some(
    (suffix) => normalized === suffix || normalized.endsWith(`.${suffix}`),
  );
}

function detectProvider(hostname: string): EmbedProvider {
  const normalized = normalizeHost(hostname);
  if (normalized.includes("typeform")) return "typeform";
  if (normalized.includes("calendly")) return "calendly";
  if (normalized.includes("google")) return "google";
  if (normalized.includes("stripe")) return "stripe";
  if (normalized.includes("hubspot")) return "hubspot";
  if (normalized.includes("notion")) return "notion";
  if (normalized.includes("airtable")) return "airtable";
  return "unknown";
}

function extractSrcFromIframe(html: string): string | null {
  const match = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  return match?.[1] ?? null;
}

export function parseEmbedInput(input: string): ParsedEmbed | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let src: string | null = null;

  if (trimmed.includes("<iframe")) {
    src = extractSrcFromIframe(trimmed);
  } else {
    try {
      const url = new URL(
        trimmed.startsWith("http") ? trimmed : `https://${trimmed}`,
      );
      src = url.toString();
    } catch {
      return null;
    }
  }

  if (!src) return null;

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(src);
  } catch {
    return null;
  }

  if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
    return null;
  }

  if (!isAllowedHost(parsedUrl.hostname)) {
    return null;
  }

  return {
    src: parsedUrl.toString(),
    provider: detectProvider(parsedUrl.hostname),
  };
}

export function getEmbedSandboxAttrs(allowFullscreen: boolean): string {
  const attrs = [
    "allow-scripts",
    "allow-same-origin",
    "allow-forms",
    "allow-popups",
    "allow-popups-to-escape-sandbox",
  ];
  if (allowFullscreen) attrs.push("allow-presentation");
  return attrs.join(" ");
}

export function getEmbedAspectRatioStyle(
  aspectRatio: "16:9" | "4:3" | "1:1" | "custom",
  customHeightPx: number | null,
): { aspectRatio?: string; height?: string } {
  if (aspectRatio === "custom" && customHeightPx) {
    return { height: `${customHeightPx}px` };
  }

  const ratioMap = {
    "16:9": "16 / 9",
    "4:3": "4 / 3",
    "1:1": "1 / 1",
    custom: "16 / 9",
  } as const;

  return { aspectRatio: ratioMap[aspectRatio] };
}

export const EMBED_SUPPORTED_PROVIDERS_HINT =
  "Typeform, Calendly, Google Forms/Maps, Stripe, HubSpot, Notion, Airtable, Jotform, Tally, Paperform, Fillout";
