import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  createCustomerSessionToken,
  CUSTOMER_ACTIVITY_COOKIE,
  CUSTOMER_SESSION_COOKIE,
  generateCustomerCode,
  hashPin,
  isCustomerPinFormatValid,
  normalizeCustomerIdentifier,
  verifyPin,
} from "@/lib/customer-auth";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type CustomerLoginRow = {
  id: string;
  name: string;
  customer_code: string | null;
  pin_hash: string | null;
  pin_reset_required: boolean | null;
};

async function findCustomer(
  supabase: ReturnType<typeof createClient>,
  identifier: string,
) {
  const normalizedIdentifier = normalizeCustomerIdentifier(identifier);

  const byCode = await supabase
    .from("customers")
    .select("id, name, customer_code, pin_hash, pin_reset_required")
    .eq("customer_code", normalizedIdentifier)
    .maybeSingle<CustomerLoginRow>();

  if (byCode.error) {
    throw byCode.error;
  }

  if (byCode.data) {
    return byCode.data;
  }

  if (!UUID_REGEX.test(identifier)) {
    return null;
  }

  const byUuid = await supabase
    .from("customers")
    .select("id, name, customer_code, pin_hash, pin_reset_required")
    .eq("id", identifier)
    .maybeSingle<CustomerLoginRow>();

  if (byUuid.error) {
    throw byUuid.error;
  }

  return byUuid.data;
}

async function assignCustomerCodeIfMissing(
  supabase: ReturnType<typeof createClient>,
  customer: CustomerLoginRow,
) {
  if (customer.customer_code) {
    return customer.customer_code;
  }

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = generateCustomerCode();

    const { data: existing, error: checkError } = await supabase
      .from("customers")
      .select("id")
      .eq("customer_code", candidate)
      .maybeSingle();

    if (checkError) {
      throw checkError;
    }

    if (existing) {
      continue;
    }

    const { error: updateError } = await supabase
      .from("customers")
      .update({ customer_code: candidate })
      .eq("id", customer.id);

    if (updateError) {
      throw updateError;
    }

    return candidate;
  }

  throw new Error("Unable to assign a customer ID");
}

export async function POST(request: NextRequest) {
  try {
    const { customerId, pin } = await request.json();

    if (!customerId || !pin) {
      return NextResponse.json(
        { error: "Customer ID and PIN are required" },
        { status: 400 },
      );
    }

    if (!isCustomerPinFormatValid(pin)) {
      return NextResponse.json(
        { error: "PIN must be exactly 4 digits" },
        { status: 400 },
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const customer = await findCustomer(supabase, String(customerId).trim());

    if (!customer) {
      return NextResponse.json(
        { error: "Invalid customer ID or PIN" },
        { status: 401 },
      );
    }

    const isValid = verifyPin(pin, customer.pin_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid customer ID or PIN" },
        { status: 401 },
      );
    }

    const customerCode = await assignCustomerCodeIfMissing(supabase, customer);

    // Upgrade from legacy/plain/default state to a hash after successful login.
    if (!customer.pin_hash || !customer.pin_hash.startsWith("scrypt$")) {
      const { error: upgradeError } = await supabase
        .from("customers")
        .update({
          pin_hash: hashPin(pin),
        })
        .eq("id", customer.id);

      if (upgradeError) {
        console.error(
          "[customer:login] failed to upgrade pin hash",
          upgradeError,
        );
      }
    }

    const token = createCustomerSessionToken({
      customerId: customer.id,
      customerCode,
    });

    const response = NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        customerCode,
      },
      requiresPinChange: Boolean(customer.pin_reset_required) || pin === "0000",
    });

    response.cookies.set(CUSTOMER_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    response.cookies.set(CUSTOMER_ACTIVITY_COOKIE, Date.now().toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("[customer:login] unexpected error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
