import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json();

    if (!pin) {
      return NextResponse.json({ error: "PIN is required" }, { status: 400 });
    }

    // Create a Supabase client with service role for server-side access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch the stored PIN from settings table
    const { data, error } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "delete_pin")
      .single();

    if (error) {
      console.error("Error fetching PIN:", error);
      return NextResponse.json(
        { error: "Failed to verify PIN" },
        { status: 500 }
      );
    }

    // Compare the provided PIN with the stored PIN
    const isValid = data?.value === pin;

    return NextResponse.json({ valid: isValid });
  } catch (error) {
    console.error("Error in verify-pin route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
