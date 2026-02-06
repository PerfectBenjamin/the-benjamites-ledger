import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const cookies = request.cookies;
    const refreshToken = cookies.get("refreshToken")?.value;

    if (!refreshToken) {
      return NextResponse.json({ error: "No refresh token" }, { status: 401 });
    }

    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`;

    const body = JSON.stringify({ refresh_token: refreshToken });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      },
      body,
    });

    const data = await res.json();

    if (!res.ok || !data.access_token) {
      console.error("Failed to refresh session", { status: res.status, data });
      return NextResponse.json(
        { error: "Failed to refresh session" },
        { status: 401 },
      );
    }

    const nextRes = NextResponse.json({ refreshed: true });

    // Set new session token (access token) — match the same cookie options as login
    nextRes.cookies.set("sessionToken", data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60, // 1 hour
    });

    // Update refresh token if rotated
    if (data.refresh_token) {
      nextRes.cookies.set("refreshToken", data.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    nextRes.cookies.set("lastActivity", Date.now().toString(), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });

    return nextRes;
  } catch (error) {
    console.error("Error in refresh route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
