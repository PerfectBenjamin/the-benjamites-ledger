import { NextRequest, NextResponse } from "next/server";

const EXPIRED_COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 0,
};

export async function POST(request: NextRequest) {
  const cookies = request.cookies;
  const sessionToken = cookies.get("sessionToken")?.value;

  // Invalidate the token on Supabase's server so it can't be reused
  if (sessionToken) {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/logout`,
        {
          method: "POST",
          headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
            Authorization: `Bearer ${sessionToken}`,
          },
        },
      );
    } catch {
      // best-effort — proceed with cookie clearing regardless
    }
  }

  // Clear all session cookies by expiring them
  const res = NextResponse.json({ success: true });
  res.cookies.set("sessionToken", "", EXPIRED_COOKIE_OPTS);
  res.cookies.set("refreshToken", "", EXPIRED_COOKIE_OPTS);
  res.cookies.set("lastActivity", "", EXPIRED_COOKIE_OPTS);
  res.cookies.set("customerSession", "", EXPIRED_COOKIE_OPTS);
  res.cookies.set("customerLastActivity", "", EXPIRED_COOKIE_OPTS);
  return res;
}
