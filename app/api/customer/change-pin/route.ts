import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  CUSTOMER_SESSION_COOKIE,
  hashPin,
  isCustomerPinFormatValid,
  verifyCustomerSessionToken,
  verifyPin,
} from "@/lib/customer-auth";

type PinRow = {
  pin_hash: string | null;
};

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get(CUSTOMER_SESSION_COOKIE)?.value;
    const session = verifyCustomerSessionToken(sessionToken);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { currentPin, newPin } = await request.json();

    if (!isCustomerPinFormatValid(currentPin || "")) {
      return NextResponse.json(
        { error: "Current PIN must be exactly 4 digits" },
        { status: 400 },
      );
    }

    if (!isCustomerPinFormatValid(newPin || "")) {
      return NextResponse.json(
        { error: "New PIN must be exactly 4 digits" },
        { status: 400 },
      );
    }

    if (newPin === "0000") {
      return NextResponse.json(
        { error: "New PIN cannot be the default PIN" },
        { status: 400 },
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { data: customer, error: fetchError } = await supabase
      .from("customers")
      .select("pin_hash")
      .eq("id", session.customerId)
      .maybeSingle<PinRow>();

    if (fetchError || !customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 },
      );
    }

    if (!verifyPin(currentPin, customer.pin_hash)) {
      return NextResponse.json(
        { error: "Current PIN is incorrect" },
        { status: 401 },
      );
    }

    const { error: updateError } = await supabase
      .from("customers")
      .update({
        pin_hash: hashPin(newPin),
        pin_reset_required: false,
      })
      .eq("id", session.customerId);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update PIN" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[customer:change-pin] unexpected error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
