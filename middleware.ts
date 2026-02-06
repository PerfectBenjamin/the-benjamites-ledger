import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Session timeout: 30 minutes of inactivity
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths without authentication
  const publicPaths = [
    "/login",
    "/api",
    "/_next",
    "/favicon",
    "/manifest.json",
  ];
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check for session token
  const sessionToken = req.cookies.get("sessionToken")?.value;
  const lastActivity = req.cookies.get("lastActivity")?.value;

  // No session token - redirect to login
  if (!sessionToken) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Check for inactivity timeout
  if (lastActivity) {
    const lastActivityTime = Number(lastActivity);
    const now = Date.now();
    const inactiveFor = now - lastActivityTime;

    if (inactiveFor > INACTIVITY_TIMEOUT_MS) {
      // Session expired due to inactivity
      const response = NextResponse.redirect(new URL("/login", req.url));
      response.cookies.delete("sessionToken");
      response.cookies.delete("refreshToken");
      response.cookies.delete("lastActivity");
      return response;
    }
  }

  // Update last activity time
  const response = NextResponse.next();
  response.cookies.set("lastActivity", Date.now().toString(), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
