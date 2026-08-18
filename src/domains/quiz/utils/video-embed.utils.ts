export type VideoEmbedProvider = "youtube" | "vimeo" | "loom" | "unknown";

export type ParsedVideoEmbed = {
  src: string;
  provider: VideoEmbedProvider;
  embedHtml: string;
};

const ALLOWED_HOSTS = [
  "youtube.com",
  "www.youtube.com",
  "youtu.be",
  "m.youtube.com",
  "vimeo.com",
  "player.vimeo.com",
  "loom.com",
  "www.loom.com",
];

function normalizeHost(hostname: string): string {
  return hostname.replace(/^www\./, "").toLowerCase();
}

function isAllowedHost(hostname: string): boolean {
  const normalized = normalizeHost(hostname);
  return ALLOWED_HOSTS.some(
    (host) =>
      normalized === normalizeHost(host) ||
      normalized.endsWith(`.${normalizeHost(host)}`),
  );
}

function detectProvider(hostname: string): VideoEmbedProvider {
  const normalized = normalizeHost(hostname);
  if (normalized.includes("youtube") || normalized === "youtu.be") {
    return "youtube";
  }
  if (normalized.includes("vimeo")) {
    return "vimeo";
  }
  if (normalized.includes("loom")) {
    return "loom";
  }
  return "unknown";
}

function extractSrcFromIframe(html: string): string | null {
  const match = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  return match?.[1] ?? null;
}

function buildEmbedHtml(src: string): string {
  return `<iframe src="${src.replace(/"/g, "&quot;")}" title="Vídeo incorporado" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe>`;
}

export function parseVideoEmbedInput(input: string): ParsedVideoEmbed | null {
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

  const provider = detectProvider(parsedUrl.hostname);
  const safeSrc = parsedUrl.toString();

  return {
    src: safeSrc,
    provider,
    embedHtml: buildEmbedHtml(safeSrc),
  };
}

export function getVideoEmbedFromConfig(
  embedCode: string,
): ParsedVideoEmbed | null {
  return parseVideoEmbedInput(embedCode);
}
