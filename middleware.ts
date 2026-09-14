import { NextResponse, type NextRequest } from "next/server";
import { applySupabaseCookies, updateSession } from "@/lib/supabase/middleware";

const PUBLIC_PATHS = ["/", "/accueil", "/connexion", "/inscription", "/auth/callback", "/invitation"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function redirectWithSession(request: NextRequest, supabaseResponse: NextResponse, pathname: string, search = "") {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = search;
  return applySupabaseCookies(supabaseResponse, NextResponse.redirect(url));
}

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    return supabaseResponse;
  }

  const isAuthPage = pathname === "/connexion" || pathname === "/inscription";

  if (user && isAuthPage) {
    return redirectWithSession(request, supabaseResponse, "/dashboard");
  }

  if (user && pathname === "/") {
    return redirectWithSession(request, supabaseResponse, "/dashboard");
  }

  if (!user && !isPublicPath(pathname)) {
    const next = `${pathname}${search}`;
    return redirectWithSession(
      request,
      supabaseResponse,
      "/connexion",
      `?next=${encodeURIComponent(next)}`,
    );
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
