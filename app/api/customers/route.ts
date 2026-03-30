import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateCustomerCode, hashPin } from "@/lib/customer-auth";

type CustomerPayload = {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  account_name?: string;
  account_number?: string;
  bank_name?: string;
  guarantor1_name?: string;
  guarantor1_phone?: string;
  guarantor1_address?: string;
  guarantor2_name?: string;
  guarantor2_phone?: string;
  guarantor2_address?: string;
};

function cleanText(value?: string) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : null;
}

async function getUniqueCustomerCode(
  supabase: ReturnType<typeof createClient>,
) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = generateCustomerCode();
    const { data, error } = await supabase
      .from("customers")
      .select("id")
      .eq("customer_code", code)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return code;
    }
  }

  throw new Error("Unable to generate a unique customer ID");
}

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("sessionToken")?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = (await request.json()) as CustomerPayload;
    const name = payload.name?.trim();

    if (!name) {
      return NextResponse.json(
        { error: "Customer name is required" },
        { status: 400 },
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const authClient = createClient(supabaseUrl, anonKey);
    const { data: authData, error: authError } =
      await authClient.auth.getUser(sessionToken);

    if (authError || !authData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createClient(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY || anonKey,
    );

    const customerCode = await getUniqueCustomerCode(adminClient);

    const insertPayload = {
      name,
      customer_code: customerCode,
      pin_hash: hashPin("0000"),
      pin_reset_required: true,
      phone: cleanText(payload.phone),
      email: cleanText(payload.email),
      address: cleanText(payload.address),
      account_name: cleanText(payload.account_name),
      account_number: cleanText(payload.account_number),
      bank_name: cleanText(payload.bank_name),
      guarantor1_name: cleanText(payload.guarantor1_name),
      guarantor1_phone: cleanText(payload.guarantor1_phone),
      guarantor1_address: cleanText(payload.guarantor1_address),
      guarantor2_name: cleanText(payload.guarantor2_name),
      guarantor2_phone: cleanText(payload.guarantor2_phone),
      guarantor2_address: cleanText(payload.guarantor2_address),
    };

    const { data, error } = await adminClient
      .from("customers")
      .insert([insertPayload])
      .select("id, name, customer_code")
      .single();

    if (error) {
      console.error("[customers:create] insert error", error);
      return NextResponse.json(
        { error: "Failed to create customer" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      customer: data,
      defaultPin: "0000",
    });
  } catch (error) {
    console.error("[customers:create] unexpected error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
