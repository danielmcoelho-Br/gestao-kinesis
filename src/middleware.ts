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
    await jwtVerify(token, KEY, {
      algorithms: ["HS256"],
    });
    return true;
  } catch (error) {
    return false;
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

  // 3. VERIFY SENSITIVE PATHS
  // If trying to access any app route or management API
  const isApiRoute = pathname.startsWith("/api/");
  
  let isAuthenticated = false;
  if (sessionCookie) {
    isAuthenticated = await verifyToken(sessionCookie);
  }

  if (!isAuthenticated) {
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

  // Token is valid, allow request to proceed!
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
