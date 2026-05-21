import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Replicates exactly the key setup used in src/gestao/lib/auth.ts
if (!process.env.JWT_SECRET) {
  throw new Error("🚨 JWT_SECRET is missing from the environment variables! System halted for safety.");
}
const KEY = new TextEncoder().encode(process.env.JWT_SECRET);

async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, KEY, {
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
  // Ex: /p/token123 or /p/token123/diario
  if (pathname.startsWith("/p/")) {
    return NextResponse.next();
  }

  // - Authentication API Endpoint and Login View
  if (
    pathname === "/login" ||
    pathname.startsWith("/api/auth")
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

  // Enforce role-based access for SECRETARIA
  const role = String(sessionPayload.role || "").toUpperCase();
  if (role === "SECRETARIA") {
    // Restricted UI routes in Gestão
    const isRestrictedPath = 
      pathname === "/gestao" || pathname.startsWith("/gestao/") ||
      pathname === "/pacientes" || pathname.startsWith("/pacientes/") ||
      pathname === "/profissionais" || pathname.startsWith("/profissionais/") ||
      pathname === "/financeiro" || pathname.startsWith("/financeiro/") ||
      pathname === "/admin" || pathname.startsWith("/admin/");

    if (isRestrictedPath) {
      if (isApiRoute) {
        return NextResponse.json(
          { error: "Acesso proibido para esta função." },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL("/cobrancas", request.url));
    }

    // Restricted API routes
    const isRestrictedApi =
      pathname.startsWith("/api/stats") ||
      pathname.startsWith("/api/patients/stats") ||
      pathname.startsWith("/api/admin/") ||
      pathname.startsWith("/api/profissionais") ||
      pathname.startsWith("/api/financeiro");

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
