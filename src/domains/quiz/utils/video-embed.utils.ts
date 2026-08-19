export type VideoEmbedProvider =
  | "youtube"
  | "vimeo"
  | "loom"
  | "panda"
  | "unknown";

export type ParsedVideoEmbed = {
  src: string;
  provider: VideoEmbedProvider;
  embedHtml: string;
};

/**
 * Não há allowlist de host: o vídeo é colado pelo dono do quiz, e cada
 * plataforma de hospedagem (Panda, Vturb, Bunny, players self-hosted) usa um
 * domínio próprio — muitas vezes um subdomínio exclusivo por conta. Barrar por
 * host quebraria mais casos legítimos do que protegeria.
 *
 * O que continua barrado é o que de fato causa dano: esquemas executáveis
 * (`javascript:`, `data:`) e qualquer atributo do iframe colado — só o `src` é
 * aproveitado, e o iframe é remontado por nós, sempre com sandbox.
 */
const BLOCKED_PROTOCOLS = ["javascript:", "data:", "vbscript:", "file:"];

function normalizeHost(hostname: string): string {
  return hostname.replace(/^www\./, "").toLowerCase();
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
  if (normalized.includes("pandavideo")) {
    return "panda";
  }
  return "unknown";
}

function extractSrcFromIframe(html: string): string | null {
  const match = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  if (!match?.[1]) return null;
  // Códigos copiados de painéis costumam vir com entidades HTML no src
  // (`?a=1&amp;b=2`); sem decodificar, o player recebe parâmetros errados.
  return match[1]
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .trim();
}

function buildEmbedHtml(src: string): string {
  return `<iframe src="${src.replace(/"/g, "&quot;")}" title="Vídeo incorporado" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe>`;
}

/** Evita que um typo ("meu video") vire `https://meu%20video/` e pareça válido. */
function looksLikeHost(hostname: string): boolean {
  return hostname === "localhost" || /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(hostname);
}

export function parseVideoEmbedInput(input: string): ParsedVideoEmbed | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let src: string | null = null;

  if (trimmed.includes("<iframe")) {
    src = extractSrcFromIframe(trimmed);
  } else {
    src = trimmed;
  }

  if (!src) return null;

  // `//player.exemplo.com/embed/x` é comum em códigos antigos.
  if (src.startsWith("//")) {
    src = `https:${src}`;
  } else if (!/^[a-z][a-z0-9+.-]*:/i.test(src)) {
    src = `https://${src}`;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(src);
  } catch {
    return null;
  }

  if (BLOCKED_PROTOCOLS.includes(parsedUrl.protocol.toLowerCase())) {
    return null;
  }

  if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
    return null;
  }

  if (!looksLikeHost(parsedUrl.hostname)) {
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
