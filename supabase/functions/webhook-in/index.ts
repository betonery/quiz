// Recebe os webhooks das plataformas de venda.
//
// Deliberadamente fina: só HTTP e criação de usuário. Toda a decisão (filtro de
// evento, mapeamento, idempotência, plano, assinatura, pagamento) vive nas RPCs
// do Postgres, para não duplicar em Deno o que já existe em SQL — e para que o
// preview do painel use exatamente o mesmo código da execução real.
//
// URL: https://<projeto>.supabase.co/functions/v1/webhook-in/<token>
//
// Deploy: npx supabase functions deploy webhook-in --no-verify-jwt

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

/** Payloads de venda são pequenos; acima disto é abuso ou engano. */
const MAX_BODY_BYTES = 256 * 1024;

type IngestResult = {
  status:
    | "unknown_token"
    | "rate_limited"
    | "captured"
    | "duplicate"
    | "ignored"
    | "failed"
    | "needs_user"
    | "done";
  event_id?: string;
  email?: string;
  full_name?: string;
  password?: string;
  error?: string;
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/**
 * Toda saída passa por aqui para aparecer nos logs. Sem isto, uma rejeição
 * cedo (token ausente, método errado) sairia silenciosa e o painel do Supabase
 * ficaria vazio, indistinguível de "a função nem foi chamada".
 */
function respond(status: number, body: Record<string, unknown>): Response {
  console.log(JSON.stringify({ at: "response", status, ...body }));
  return json(body, status);
}

/** O token é o último segmento do caminho. */
function extractToken(url: string): string | null {
  const { pathname } = new URL(url);
  const segments = pathname.split("/").filter(Boolean);
  const index = segments.indexOf("webhook-in");
  if (index === -1) return null;
  return segments[index + 1] ?? null;
}

/**
 * Nunca recusa um corpo por não entendê-lo: várias plataformas brasileiras
 * postam form-urlencoded, e um 400 deixaria o admin sem nada para depurar.
 * O que não for reconhecido vira `{_raw: "..."}` e aparece no painel.
 */
async function readPayload(request: Request): Promise<Record<string, unknown>> {
  const contentType = request.headers.get("content-type") ?? "";
  const raw = await request.text();

  if (raw.trim().length === 0) return {};

  if (contentType.includes("application/json")) {
    try {
      const parsed = JSON.parse(raw);
      return typeof parsed === "object" && parsed !== null
        ? (parsed as Record<string, unknown>)
        : { _raw: parsed };
    } catch {
      return { _raw: raw };
    }
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    return Object.fromEntries(new URLSearchParams(raw));
  }

  // Sem content-type confiável: tenta JSON antes de desistir.
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // segue para o fallback
  }

  return { _raw: raw };
}

function clientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? null;
  return request.headers.get("x-real-ip");
}

function isAlreadyRegistered(message: string): boolean {
  return /already been registered|already registered|email_exists|duplicate key/i.test(
    message,
  );
}

Deno.serve(async (request: Request) => {
  // Primeira linha do handler: se isto não aparece nos logs, a requisição não
  // chegou à função (gateway barrou antes, tipicamente por verify_jwt).
  // O token nunca entra no log — só o tamanho, para diagnosticar caminho vazio.
  const pathname = new URL(request.url).pathname;
  console.log(
    JSON.stringify({
      at: "request",
      method: request.method,
      segments: pathname.split("/").filter(Boolean).length,
      contentType: request.headers.get("content-type"),
    }),
  );

  // Plataformas validam a URL com um GET antes de aceitar o cadastro; um 405
  // aqui faria elas recusarem o endereço.
  if (request.method === "GET" || request.method === "HEAD") {
    return respond(200, { ok: true });
  }

  if (request.method !== "POST") {
    return respond(405, { ok: false, error: "method not allowed" });
  }

  const token = extractToken(request.url);
  if (!token || token.length < 16) {
    return respond(401, {
      ok: false,
      error: "invalid endpoint",
      hint: "token ausente ou curto no final da URL",
      pathname,
    });
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) {
    return respond(413, { ok: false, error: "payload too large" });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let payload: Record<string, unknown>;
  try {
    payload = await readPayload(request);
  } catch {
    return respond(400, { ok: false, error: "unreadable body" });
  }

  const ingest = await supabase.rpc("integration_ingest_event", {
    p_token: token,
    p_payload: payload,
    p_source_ip: clientIp(request),
  });

  if (ingest.error) {
    // Falha de infraestrutura: 500 para a plataforma tentar de novo. A
    // retomada por event_key torna o retry seguro.
    console.error(
      JSON.stringify({ at: "ingest_error", message: ingest.error.message }),
    );
    return respond(500, { ok: false, error: "ingest failed" });
  }

  const result = ingest.data as IngestResult;

  if (result.status === "unknown_token") {
    return respond(401, {
      ok: false,
      error: "invalid endpoint",
      hint: "nenhuma integração com este token",
    });
  }

  if (result.status === "rate_limited") {
    return respond(429, { ok: false, error: "too many requests" });
  }

  // Precisa criar a conta: é o único passo que a Admin API do Auth exige.
  if (result.status === "needs_user") {
    const eventId = result.event_id!;

    if (!result.password) {
      await supabase.rpc("integration_mark_failed", {
        p_event_id: eventId,
        p_message: "Integração sem senha padrão configurada",
      });
      return respond(200, {
        ok: true,
        status: "failed",
        reason: "no_password",
      });
    }

    const created = await supabase.auth.admin.createUser({
      email: result.email!,
      password: result.password,
      email_confirm: true,
      user_metadata: { full_name: result.full_name ?? "" },
    });

    if (created.error) {
      const message = created.error.message ?? "";

      if (isAlreadyRegistered(message)) {
        // Corrida entre dois eventos do mesmo e-mail: o vencedor já criou a
        // conta. Reentrar na ingestão resolve — ela retoma o mesmo evento e
        // agora encontra o usuário.
        const retry = await supabase.rpc("integration_ingest_event", {
          p_token: token,
          p_payload: payload,
          p_source_ip: clientIp(request),
        });

        if (retry.error) {
          console.error(
            JSON.stringify({ at: "retry_error", message: retry.error.message }),
          );
          return respond(500, { ok: false, error: "retry failed" });
        }

        return respond(200, {
          ok: true,
          status: (retry.data as IngestResult).status,
        });
      }

      // Outra falha (ex.: colisão de slug de workspace no trigger). Registra
      // sem ecoar o erro do Auth na resposta HTTP.
      console.error(JSON.stringify({ at: "create_user_error", message }));
      await supabase.rpc("integration_mark_failed", {
        p_event_id: eventId,
        p_message: `Falha ao criar usuário: ${message}`,
      });
      return respond(200, { ok: true, status: "failed" });
    }

    const finalize = await supabase.rpc("integration_finalize_purchase", {
      p_event_id: eventId,
      p_user_id: created.data.user.id,
    });

    if (finalize.error) {
      console.error(
        JSON.stringify({
          at: "finalize_error",
          message: finalize.error.message,
        }),
      );
      return respond(500, { ok: false, error: "finalize failed" });
    }

    return respond(200, { ok: true, status: "done" });
  }

  // Rejeições de negócio respondem 200: a plataforma não deve reenviar.
  return respond(200, { ok: true, status: result.status });
});
