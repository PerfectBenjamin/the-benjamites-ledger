import { createServerClient } from "@supabase/ssr";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import CustomersList from "@/components/customers-list";
import { Plus, ArrowLeft } from "lucide-react";

async function getCustomers() {
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

  const { data: customers, error } = await supabase
    .from("customers")
    .select("id, name, phone")
    .order("name");

  if (error) {
    console.error("Error fetching customers:", error);
    return [];
  }

  return customers || [];
}

async function getCustomerTotals() {
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

  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("customer_id, type, amount");

  if (error) {
    console.error("Error fetching transactions:", error);
    return {};
  }

  const totals: Record<string, number> = {};
  transactions?.forEach((t) => {
    const customerId = t.customer_id;
    if (!totals[customerId]) totals[customerId] = 0;
    if (t.type === "debt") {
      totals[customerId] += Number.parseFloat(t.amount);
    } else if (t.type === "payment") {
      totals[customerId] -= Number.parseFloat(t.amount);
    }
  });

  return totals;
}

export const metadata = {
  title: "Customers - Debt Ledger",
  description: "View and manage all customers",
};

export default async function CustomersPage() {
  // Server-side auth check: redirect to /login when no active session
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

  if (!session) {
    redirect("/login");
  }

  const customers = await getCustomers();
  const totals = await getCustomerTotals();

  return (
    <main className="min-h-screen bg-linear-to-br from-blue-50 to-slate-50 p-3 sm:p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <div className="mb-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors"
              >
                <ArrowLeft size={16} />
                <span className="text-sm font-medium">Dashboard</span>
              </Link>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900">
              Customers
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-slate-600 mt-2">
              View and manage all customer accounts
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-end" />
        </div>

        {/* Customer List (client-side) */}
        <CustomersList />
      </div>
    </main>
  );
}
