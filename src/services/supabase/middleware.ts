import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  AUTH_ROUTES,
  PUBLIC_ROUTE_PREFIXES,
  PUBLIC_ROUTES,
  ROUTES,
  SESSION_REQUIRED_ROUTES,
} from "@/constants/routes";
import type { Database } from "@/types/database.types";

function isPublicRoute(pathname: string): boolean {
  if ((PUBLIC_ROUTES as readonly string[]).includes(pathname)) {
    return true;
  }

  return PUBLIC_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isAuthRoute(pathname: string): boolean {
  return (AUTH_ROUTES as readonly string[]).includes(pathname);
}

function isProtectedRoute(pathname: string): boolean {
  if (isPublicRoute(pathname)) {
    return false;
  }

  if (pathname.startsWith("/api/")) {
    return false;
  }

  if (
    pathname === ROUTES.dashboard ||
    pathname.startsWith(`${ROUTES.dashboard}/`)
  ) {
    return true;
  }

  if (pathname.startsWith("/invite/")) {
    return true;
  }

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return false;
  }

  const reservedSegments = [
    "login",
    "register",
    "forgot-password",
    "reset-password",
    "auth",
    "q",
    "api",
    "dashboard",
    "invite",
  ];

  return !reservedSegments.includes(segments[0]);
}

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      "[middleware] NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY ausentes",
    );
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (user && isAuthRoute(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.dashboard;
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (
    !user &&
    (SESSION_REQUIRED_ROUTES as readonly string[]).includes(pathname)
  ) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.login;
    return NextResponse.redirect(url);
  }

  if (!user && isProtectedRoute(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.login;
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
