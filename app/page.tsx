import { createServerClient } from "@supabase/ssr";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import Image from "next/image";
import { Wallet, TrendingUp, TrendingDown, Users } from "lucide-react";
import LogoutButton from "@/components/logout-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function getDashboardStats() {
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
          // No-op: modifying cookies is only allowed in Server Actions or Route Handlers.
          // Next.js will throw if we try to call `cookieStore.set` here during rendering.
          // Leave as a no-op to avoid runtime errors; session cookie updates should be
          // performed from a Server Action or Route Handler instead.
          return;
        },
      },
    }
  );

  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("type, amount");

  if (error) {
    console.error("Error fetching transactions:", error);
    return { totalDebt: 0, totalPayment: 0, totalBalance: 0 };
  }

  let totalDebt = 0;
  let totalPayment = 0;

  transactions?.forEach((t) => {
    const amount = Number.parseFloat(t.amount);
    if (t.type === "debt") {
      totalDebt += amount;
    } else if (t.type === "payment") {
      totalPayment += amount;
    }
  });

  const totalBalance = totalDebt - totalPayment;

  return { totalDebt, totalPayment, totalBalance };
}

async function getCustomerCount() {
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
          // No-op for the same reason as above.
          return;
        },
      },
    }
  );

  const { count, error } = await supabase
    .from("customers")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("Error fetching customer count:", error);
    return 0;
  }

  return count || 0;
}

export const metadata = {
  title: "Debt Ledger - Cement Distributor",
  description: "Manage your customer debts and payments",
};

export default async function Dashboard() {
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
          // No-op for the same reason as above.
          return;
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

  const { totalDebt, totalPayment, totalBalance } = await getDashboardStats();
  const customerCount = await getCustomerCount();

  return (
    <main className="min-h-screen bg-linear-to-br from-blue-50 to-slate-50 p-3 sm:p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <div className="w-full sm:w-auto">
            <img
              src="/rectangle ben.png"
              alt="The Benjamites Network Limited"
              className="h-16 sm:h-20 md:h-24 w-auto mb-2"
            />
            <p className="text-sm sm:text-base md:text-lg text-slate-600">
              Dashboard Overview
            </p>
          </div>
          <LogoutButton />
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          {/* Total Balance Card */}
          <Card className="bg-white shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total Balance
              </CardTitle>
              <Wallet className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div
                className={
                  "text-2xl font-bold " +
                  (totalBalance > 0
                    ? "text-red-600"
                    : totalBalance < 0
                    ? "text-green-600"
                    : "text-slate-900")
                }
              >
                {totalBalance > 0 ? "-" : totalBalance < 0 ? "+" : ""}₦
                {Math.abs(totalBalance).toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {totalBalance > 0
                  ? "Outstanding"
                  : totalBalance < 0
                  ? "Overpaid"
                  : "Settled"}
              </p>
            </CardContent>
          </Card>

          {/* Total Debt Card */}
          <Card className="bg-white shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total Debt
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                ₦
                {totalDebt.toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <p className="text-xs text-slate-500 mt-1">Total amount owed</p>
            </CardContent>
          </Card>

          {/* Total Payment Card */}
          <Card className="bg-white shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total Payment
              </CardTitle>
              <TrendingDown className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                ₦
                {totalPayment.toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <p className="text-xs text-slate-500 mt-1">Total received</p>
            </CardContent>
          </Card>

          {/* Total Customers Card */}
          <Card className="bg-white shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total Customers
              </CardTitle>
              <Users className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {customerCount}
              </div>
              <p className="text-xs text-slate-500 mt-1">Active accounts</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/customers"
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold px-6 py-4 rounded-lg transition-colors text-base"
            >
              <Users size={20} />
              <span>View All Customers</span>
            </Link>
            <Link
              href="/customers/new"
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold px-6 py-4 rounded-lg transition-colors text-base"
            >
              <Users size={20} />
              <span>Add New Customer</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
