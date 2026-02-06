import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Clear all session cookies
  const res = NextResponse.json({ success: true });
  res.cookies.delete("sessionToken");
  res.cookies.delete("refreshToken");
  res.cookies.delete("lastActivity");
  return res;
}
