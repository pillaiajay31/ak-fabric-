import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public assets and auth endpoints
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/public") ||
    pathname === "/favicon.ico" ||
    pathname === "/login" ||
    pathname === "/api/auth/login" ||
    pathname === "/api/auth/logout" ||
    pathname.match(/\.(?:jpg|jpeg|png|gif|svg|webp|ico)$/i)
  ) {
    // If user is already logged in and visits /login, redirect to /
    if (pathname === "/login") {
      const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
      if (token) {
        const session = await verifySessionToken(token);
        if (session) {
          return NextResponse.redirect(new URL("/", req.url));
        }
      }
    }
    return NextResponse.next();
  }

  // Check session cookie
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "Authentication required. Please log in." },
        { status: 401 }
      );
    }
    const loginUrl = new URL("/login", req.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("redirect", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  const session = await verifySessionToken(token);
  if (!session) {
    if (pathname.startsWith("/api/")) {
      const res = NextResponse.json(
        { success: false, error: "Session expired. Please log in again." },
        { status: 401 }
      );
      res.cookies.delete(SESSION_COOKIE_NAME);
      return res;
    }
    const loginUrl = new URL("/login", req.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("redirect", pathname);
    }
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete(SESSION_COOKIE_NAME);
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images directory and static image files
     */
    "/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
