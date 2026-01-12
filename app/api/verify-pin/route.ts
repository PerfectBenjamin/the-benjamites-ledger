import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const pin: string | undefined = body?.pin;
    if (!pin)
      return NextResponse.json({ ok: false, error: "no_pin" }, { status: 400 });

    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "delete_pin")
      .single();

    if (error)
      return NextResponse.json(
        { ok: false, error: "db_error" },
        { status: 500 }
      );
    if (!data || !data.value)
      return NextResponse.json(
        { ok: false, error: "not_set" },
        { status: 404 }
      );

    const matches = await bcrypt.compare(pin, data.value);
    return NextResponse.json({ ok: matches });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  }
}
