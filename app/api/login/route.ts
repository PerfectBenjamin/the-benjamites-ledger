import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    // Create Supabase client for server-side auth
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    // Log attempt (do NOT log passwords)
    console.log("[login] attempt for", { email });

    // Authenticate with Supabase
    const { data, error: signInError } = await supabase.auth.signInWithPassword(
      {
        email,
        password,
      },
    );

    if (signInError) {
      console.error("[login] signInError:", signInError);
      return NextResponse.json({ error: signInError.message }, { status: 401 });
    }

    const token = data.session?.access_token;
    const refreshToken = data.session?.refresh_token;

    if (!token) {
      console.error("[login] no access token in response", { data });
      return NextResponse.json(
        { error: "No session token received" },
        { status: 500 },
      );
    }

    // Set HTTP-only cookies for session management
    const res = NextResponse.json({ success: true });

    // Session token (access token)
    res.cookies.set("sessionToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60, // 1 hour
    });

    // Refresh token for silent token refresh
    if (refreshToken) {
      res.cookies.set("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    // Last activity timestamp
    res.cookies.set("lastActivity", Date.now().toString(), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });

    console.log("[login] success for", { email });
    return res;
  } catch (error) {
    console.error("Error in login route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
