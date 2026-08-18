import { NextResponse } from "next/server";
import { ROUTES } from "@/constants/routes";
import { createClient } from "@/services/supabase/server";

/**
 * Aceita apenas caminhos internos relativos para evitar open redirect.
 * Rejeita URLs absolutas, protocol-relative (//evil.com) e backslashes.
 */
function sanitizeNextPath(raw: string | null): string {
  if (!raw) return ROUTES.dashboard;
  if (!raw.startsWith("/")) return ROUTES.dashboard;
  if (raw.startsWith("//") || raw.startsWith("/\\")) return ROUTES.dashboard;
  return raw;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = sanitizeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}${ROUTES.login}?error=auth_callback_error`,
  );
}
