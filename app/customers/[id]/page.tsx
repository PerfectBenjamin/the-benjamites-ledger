import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import TransactionList from "@/components/transaction-list";
import AddTransactionForm from "@/components/add-transaction-form";
import DeleteCustomerButton from "@/components/delete-customer-button";
import EditCustomerPanel from "@/components/edit-customer-panel";

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>;
}

async function getCustomer(id: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookieStore.getAll();
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: customer, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching customer:", error);
    return null;
  }

  return customer;
}

export default async function CustomerDetailPage({
  params,
}: CustomerDetailPageProps) {
  // Server-side auth check
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookieStore.getAll();
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabaseAuth.auth.getSession();

  if (!session) redirect("/login");

  const { id } = await params;
  const customer = await getCustomer(id);

  if (!customer) {
    return (
      <main className="min-h-screen bg-linear-to-br from-blue-50 to-slate-50 p-3 sm:p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-3">
            <Link
              href="/customers"
              className="inline-flex items-center gap-2 text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors"
            >
              <ArrowLeft size={16} />
              <span className="text-sm font-medium">Customers</span>
            </Link>
          </div>
          <p className="text-xl md:text-2xl text-slate-600">
            Customer not found
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-blue-50 to-slate-50 p-3 sm:p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <Link
            href="/customers"
            className="inline-flex items-center gap-2 text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="text-sm font-medium">Customers</span>
          </Link>
        </div>

        {/* Customer Info */}
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 md:p-8 mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-4 md:mb-6">
            {customer.name}
          </h1>

          {/* Basic Contact Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
            {customer.phone && (
              <div>
                <p className="text-slate-600 text-sm sm:text-base font-medium">
                  Phone
                </p>
                <p className="text-lg sm:text-xl md:text-2xl text-slate-900 font-semibold wrap-break-word">
                  {customer.phone}
                </p>
              </div>
            )}
            {customer.email && (
              <div>
                <p className="text-slate-600 text-sm sm:text-base font-medium">
                  Email
                </p>
                <p className="text-lg sm:text-xl md:text-2xl text-slate-900 font-semibold wrap-break-word">
                  {customer.email}
                </p>
              </div>
            )}
            {customer.address && (
              <div className="sm:col-span-2 lg:col-span-1">
                <p className="text-slate-600 text-sm sm:text-base font-medium">
                  Address
                </p>
                <p className="text-lg sm:text-xl md:text-2xl text-slate-900 font-semibold wrap-break-word">
                  {customer.address}
                </p>
              </div>
            )}
          </div>

          {/* Repayment Account */}
          {(customer.account_name ||
            customer.account_number ||
            customer.bank_name) && (
            <div className="pt-6 border-t-2 border-slate-100 mb-6">
              <p className="text-slate-600 text-base sm:text-lg font-semibold mb-4">
                Repayment Account
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {customer.account_name && (
                  <div>
                    <p className="text-slate-600 text-sm sm:text-base font-medium">
                      Account Name
                    </p>
                    <p className="text-lg sm:text-xl text-slate-900 font-semibold">
                      {customer.account_name}
                    </p>
                  </div>
                )}
                {customer.account_number && (
                  <div>
                    <p className="text-slate-600 text-sm sm:text-base font-medium">
                      Account Number
                    </p>
                    <p className="text-lg sm:text-xl text-slate-900 font-semibold">
                      {customer.account_number}
                    </p>
                  </div>
                )}
                {customer.bank_name && (
                  <div>
                    <p className="text-slate-600 text-sm sm:text-base font-medium">
                      Bank
                    </p>
                    <p className="text-lg sm:text-xl text-slate-900 font-semibold">
                      {customer.bank_name}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Guarantors */}
          {(customer.guarantor1_name || customer.guarantor2_name) && (
            <div className="pt-6 border-t-2 border-slate-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {customer.guarantor1_name && (
                  <div>
                    <p className="text-slate-600 text-base sm:text-lg font-semibold mb-2">
                      Guarantor 1
                    </p>
                    <p className="text-lg sm:text-xl text-slate-900 font-semibold">
                      {customer.guarantor1_name}
                    </p>
                    {customer.guarantor1_phone && (
                      <p className="text-base sm:text-lg text-slate-600 mt-1">
                        {customer.guarantor1_phone}
                      </p>
                    )}
                    {customer.guarantor1_address && (
                      <p className="text-base sm:text-lg text-slate-600 mt-1">
                        {customer.guarantor1_address}
                      </p>
                    )}
                  </div>
                )}

                {customer.guarantor2_name && (
                  <div>
                    <p className="text-slate-600 text-base sm:text-lg font-semibold mb-2">
                      Guarantor 2
                    </p>
                    <p className="text-lg sm:text-xl text-slate-900 font-semibold">
                      {customer.guarantor2_name}
                    </p>
                    {customer.guarantor2_phone && (
                      <p className="text-base sm:text-lg text-slate-600 mt-1">
                        {customer.guarantor2_phone}
                      </p>
                    )}
                    {customer.guarantor2_address && (
                      <p className="text-base sm:text-lg text-slate-600 mt-1">
                        {customer.guarantor2_address}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 mb-6">
          <EditCustomerPanel initialData={customer} customerId={id} />
          <DeleteCustomerButton customerId={id} />
        </div>

        {/* Add Transaction Form */}
        <AddTransactionForm customerId={id} />

        {/* Transactions List */}
        <TransactionList customerId={id} />
      </div>
    </main>
  );
}
