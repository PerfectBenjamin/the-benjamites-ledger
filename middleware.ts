import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CUSTOMER_SESSION_COOKIE = "customerSession";
const CUSTOMER_ACTIVITY_COOKIE = "customerLastActivity";
const CUSTOMER_INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;
const CUSTOMER_SESSION_SECRET =
  process.env.CUSTOMER_SESSION_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  "change-me-customer-session-secret";

// Session timeout: 30 minutes of inactivity
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

function base64UrlToUint8Array(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(normalized + padding);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function toBase64Url(input: Uint8Array) {
  let binary = "";
  for (let i = 0; i < input.length; i += 1) {
    binary += String.fromCharCode(input[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function safeStringEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function verifyCustomerSessionToken(token: string | undefined) {
  if (!token) return null;

  const [payloadSegment, signatureSegment] = token.split(".");
  if (!payloadSegment || !signatureSegment) return null;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(CUSTOMER_SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signatureBytes = new Uint8Array(
    await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(payloadSegment),
    ),
  );
  const expectedSignature = toBase64Url(signatureBytes);

  if (!safeStringEqual(expectedSignature, signatureSegment)) {
    return null;
  }

  try {
    const payloadJson = new TextDecoder().decode(
      base64UrlToUint8Array(payloadSegment),
    );
    const payload = JSON.parse(payloadJson) as {
      customerId?: string;
      exp?: number;
    };

    if (!payload.customerId || !payload.exp) {
      return null;
    }

    if (Date.now() > payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const customerPublicPaths = ["/customer-login", "/api/customer/login"];
  const isCustomerPath =
    pathname === "/customer" || pathname.startsWith("/customer/");

  if (isCustomerPath && !customerPublicPaths.includes(pathname)) {
    const customerSessionToken = req.cookies.get(
      CUSTOMER_SESSION_COOKIE,
    )?.value;
    const customerActivity = req.cookies.get(CUSTOMER_ACTIVITY_COOKIE)?.value;
    const session = await verifyCustomerSessionToken(customerSessionToken);

    if (!session) {
      return NextResponse.redirect(new URL("/customer-login", req.url));
    }

    if (customerActivity) {
      const lastActivityTime = Number(customerActivity);
      const inactiveFor = Date.now() - lastActivityTime;
      if (inactiveFor > CUSTOMER_INACTIVITY_TIMEOUT_MS) {
        const response = NextResponse.redirect(
          new URL("/customer-login", req.url),
        );
        response.cookies.delete(CUSTOMER_SESSION_COOKIE);
        response.cookies.delete(CUSTOMER_ACTIVITY_COOKIE);
        return response;
      }
    }

    const response = NextResponse.next();
    response.cookies.set(CUSTOMER_ACTIVITY_COOKIE, Date.now().toString(), {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });
    return response;
  }

  // Allow public paths without authentication
  const publicPaths = [
    "/login",
    "/customer-login",
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
