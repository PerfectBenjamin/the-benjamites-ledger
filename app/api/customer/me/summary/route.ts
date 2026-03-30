import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  CUSTOMER_SESSION_COOKIE,
  verifyCustomerSessionToken,
} from "@/lib/customer-auth";

type TxRow = {
  type: "debt" | "payment";
  amount: number | string;
};

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(CUSTOMER_SESSION_COOKIE)?.value;
    const session = verifyCustomerSessionToken(token);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("id, name, customer_code, pin_reset_required")
      .eq("id", session.customerId)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 },
      );
    }

    const { data: transactions, error: txError } = await supabase
      .from("transactions")
      .select("type, amount")
      .eq("customer_id", session.customerId);

    if (txError) {
      return NextResponse.json(
        { error: "Failed to load summary" },
        { status: 500 },
      );
    }

    let totalDebt = 0;
    let totalPaid = 0;

    (transactions as TxRow[] | null)?.forEach((tx) => {
      const amount =
        typeof tx.amount === "string" ? parseFloat(tx.amount) : tx.amount;
      if (tx.type === "debt") {
        totalDebt += amount;
      } else {
        totalPaid += amount;
      }
    });

    return NextResponse.json({
      customer,
      summary: {
        totalDebt,
        totalPaid,
        balance: totalDebt - totalPaid,
      },
    });
  } catch (error) {
    console.error("[customer:summary] unexpected error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
