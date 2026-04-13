import { NextRequest, NextResponse } from "next/server";

const EXPIRED_COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 0,
};

export async function POST(request: NextRequest) {
  // Clear all session cookies by expiring them
  const res = NextResponse.json({ success: true });
  res.cookies.set("sessionToken", "", EXPIRED_COOKIE_OPTS);
  res.cookies.set("refreshToken", "", EXPIRED_COOKIE_OPTS);
  res.cookies.set("lastActivity", "", EXPIRED_COOKIE_OPTS);
  res.cookies.set("customerSession", "", EXPIRED_COOKIE_OPTS);
  res.cookies.set("customerLastActivity", "", EXPIRED_COOKIE_OPTS);
  return res;
}
