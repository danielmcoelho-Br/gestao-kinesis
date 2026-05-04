import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secretKey = "kinesis-secret-key-2026-v1";
const key = new TextEncoder().encode(process.env.JWT_SECRET || secretKey);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip static assets and internal next.js files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon.ico') ||
    pathname === '/login'
  ) {
    return NextResponse.next();
  }

  // 2. Get session cookie
  const session = request.cookies.get("session")?.value;

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    // 3. Verify session
    const { payload } = await jwtVerify(session, key, {
      algorithms: ["HS256"],
    });

    const userRole = payload.role as string;

    // 4. Role-based restrictions
    // Only ADMIN can access Financeiro, Profissionais and Admin pages
    const adminRoutes = ['/financeiro', '/profissionais', '/admin'];
    const isRestrictedRoute = adminRoutes.some(route => pathname.startsWith(route));

    if (isRestrictedRoute && userRole !== 'ADMIN') {
      // If Secretary tries to access admin route, redirect to dashboard or show error
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  } catch (error) {
    // Session expired or invalid
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
