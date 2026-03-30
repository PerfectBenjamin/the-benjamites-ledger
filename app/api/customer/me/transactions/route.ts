import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  CUSTOMER_SESSION_COOKIE,
  verifyCustomerSessionToken,
} from "@/lib/customer-auth";

function parseNumber(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(CUSTOMER_SESSION_COOKIE)?.value;
    const session = verifyCustomerSessionToken(token);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseNumber(searchParams.get("page"), 1));
    const pageSize = Math.min(
      50,
      Math.max(1, parseNumber(searchParams.get("pageSize"), 10)),
    );
    const filter = searchParams.get("filter") || "all";

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    let query = supabase
      .from("transactions")
      .select("id, type, amount, description, transaction_date, created_at", {
        count: "exact",
      })
      .eq("customer_id", session.customerId)
      .order("transaction_date", { ascending: false });

    if (filter === "debt" || filter === "payment") {
      query = query.eq("type", filter);
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
      return NextResponse.json(
        { error: "Failed to load transactions" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      transactions: data || [],
      totalCount: count || 0,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("[customer:transactions] unexpected error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
