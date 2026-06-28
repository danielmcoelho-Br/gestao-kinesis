import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Lazy-loaded key to prevent build-time crashes if JWT_SECRET is not set during compile
let KEY: Uint8Array | null = null;
function getJWTKey() {
  if (!KEY) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      // During static build, JWT_SECRET might not be populated; use a temporary fallback key
      if (process.env.NODE_ENV === "production" && typeof window === "undefined") {
        console.warn("⚠️ JWT_SECRET is missing from environment variables!");
      }
      return new TextEncoder().encode("temporary-fallback-secret-key-for-static-build");
    }
    KEY = new TextEncoder().encode(secret);
  }
  return KEY;
}

async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getJWTKey(), {
      algorithms: ["HS256"],
    });
    return payload;
  } catch (error) {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. DEFINE EXEMPT PATHS (No authentication needed)
  // - Static NextJS files, assets, favicons
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes(".") || // Catches .ico, .png, etc.
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // - Public Portal Routes for Patients (Super Critical to Keep Public!)
  // Ex: /p/token123 or /p/token123/diario, or /assessment/public/...
  if (pathname.startsWith("/p/") || pathname.startsWith("/assessment/public/")) {
    return NextResponse.next();
  }

  if (
    pathname === "/login" ||
    pathname.startsWith("/api/auth") ||
    pathname === "/api/financeiro/seufisio-sync"
  ) {
    return NextResponse.next();
  }

  // 2. GET SESSION COOKIE
  const sessionCookie = request.cookies.get("session")?.value;

  // 3. VERIFY SENSITIVE PATHS AND ROLE-BASED ACCESS CONTROL
  const isApiRoute = pathname.startsWith("/api/");
  
  let sessionPayload: any = null;
  if (sessionCookie) {
    sessionPayload = await verifyToken(sessionCookie);
  }

  if (!sessionPayload) {
    // Case A: User hit an API endpoint -> Return JSON 401 Unauthorized
    if (isApiRoute) {
      return NextResponse.json(
        { error: "Não autorizado. Por favor, faça login." },
        { status: 401 }
      );
    }

    // Case B: User hit a UI Page -> Redirect browser to /login
    const loginUrl = new URL("/login", request.url);
    // Preserve the original attempted URL to redirect back after login if desired
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Enforce role-based access for SECRETARIA and FISIOTERAPEUTA
  const role = String(sessionPayload.role || "").toUpperCase();
  if (role === "SECRETARIA" || role === "FISIOTERAPEUTA") {
    // Restricted UI routes in Gestão
    const isRestrictedPath = 
      pathname === "/gestao" || pathname.startsWith("/gestao/") ||
      pathname === "/pacientes" || pathname.startsWith("/pacientes/") ||
      pathname === "/profissionais" || pathname.startsWith("/profissionais/") ||
      pathname === "/financeiro" || pathname.startsWith("/financeiro/") ||
      pathname === "/admin" || pathname.startsWith("/admin/");

    // Fisioterapeuta is also restricted from cobrancas and upload
    const isFisioRestricted = role === "FISIOTERAPEUTA" && 
      (pathname === "/cobrancas" || pathname.startsWith("/cobrancas/") ||
       pathname === "/upload" || pathname.startsWith("/upload/"));

    if (isRestrictedPath || isFisioRestricted) {
      if (isApiRoute) {
        return NextResponse.json(
          { error: "Acesso proibido para esta função." },
          { status: 403 }
        );
      }
      // Redirect secretária to cobrancas, and fisioterapeuta to dashboard
      const redirectTarget = role === "SECRETARIA" ? "/cobrancas" : "/dashboard";
      return NextResponse.redirect(new URL(redirectTarget, request.url));
    }

    // Restricted API routes
    const isRestrictedApi =
      pathname.startsWith("/api/stats") ||
      pathname.startsWith("/api/patients/stats") ||
      pathname.startsWith("/api/patients/geocode") ||
      pathname.startsWith("/api/patients/inactive") ||
      pathname.startsWith("/api/import-logs") ||
      pathname.startsWith("/api/migrate-lab") ||
      pathname.startsWith("/api/setup") ||
      pathname.startsWith("/api/admin/") ||
      (pathname.startsWith("/api/profissionais") && request.method !== "GET") ||
      pathname.startsWith("/api/financeiro") ||
      (role === "FISIOTERAPEUTA" && (
        pathname.startsWith("/api/cobrancas") ||
        pathname.startsWith("/api/upload")
      ));

    if (isRestrictedApi && isApiRoute) {
      return NextResponse.json(
        { error: "Acesso proibido para esta função." },
        { status: 403 }
      );
    }
  }

  // Token is valid and role has access, allow request to proceed!
  return NextResponse.next();
}

// Configures standard Matcher to run middleware on every relevant page and api endpoint
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (handled internally)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
