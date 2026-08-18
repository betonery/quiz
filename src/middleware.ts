import { NextResponse, type NextRequest } from "next/server";
import { handleCustomDomainRequest } from "@/domains/quiz/utils/custom-domain-middleware.utils";
import { updateSession } from "@/services/supabase/middleware";

// Rotas públicas do funil (visitante anônimo): NÃO dependem de sessão de auth.
// Pular `updateSession` aqui remove uma ida-e-volta de rede ao Supabase Auth
// (`getUser`) do caminho crítico, reduzindo o TTFB do carregamento do funil.
// A prévia (`/q/[slug]?preview=1`) e as rotas `/api/q/*` fazem sua própria
// verificação de auth quando necessário.
function isPublicFunnelPath(pathname: string): boolean {
  return pathname.startsWith("/q/") || pathname.startsWith("/api/q/");
}

export async function middleware(request: NextRequest) {
  const customDomainResponse = await handleCustomDomainRequest(request);
  if (customDomainResponse) {
    return customDomainResponse;
  }

  if (isPublicFunnelPath(request.nextUrl.pathname)) {
    return NextResponse.next({ request });
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
