import { createServerClient } from "@supabase/ssr";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { Wallet, TrendingUp, TrendingDown, Users } from "lucide-react";
import LogoutButton from "@/components/logout-button";

async function getDashboardStats() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("sessionToken")?.value;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          return;
        },
      },
      global: {
        headers: sessionToken
          ? {
              Authorization: `Bearer ${sessionToken}`,
            }
          : {},
      },
    },
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
  const sessionToken = cookieStore.get("sessionToken")?.value;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          return;
        },
      },
      global: {
        headers: sessionToken
          ? {
              Authorization: `Bearer ${sessionToken}`,
            }
          : {},
      },
    },
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
  title: "The Benjamites Ledger",
  description: "Manage your customer debts and payments",
};

export default async function Dashboard() {
  // Auth is handled by middleware - no need for session check here
  const { totalDebt, totalPayment, totalBalance } = await getDashboardStats();
  const customerCount = await getCustomerCount();

  return (
    <main className="min-h-screen bg-slate-100">
      {/* Top nav bar */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-3 flex items-center justify-between gap-4">
          <img
            src="/rectangle ben.png"
            alt="The Benjamites Network Limited"
            className="h-10 sm:h-12 w-auto object-contain"
          />
          <LogoutButton />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-10">
        {/* Page heading */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
            Dashboard
          </h1>
          <p className="text-slate-500 text-sm sm:text-base mt-1">
            Welcome back. Here's an overview of all accounts.
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {/* Total Balance */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                Total Balance
              </span>
              <span
                className={`flex items-center justify-center w-10 h-10 rounded-xl ${totalBalance > 0 ? "bg-red-100" : totalBalance < 0 ? "bg-green-100" : "bg-slate-100"}`}
              >
                <Wallet
                  className={`h-5 w-5 ${totalBalance > 0 ? "text-red-600" : totalBalance < 0 ? "text-green-600" : "text-slate-600"}`}
                />
              </span>
            </div>
            <div>
              <p
                className={`text-2xl sm:text-3xl font-bold tracking-tight ${totalBalance > 0 ? "text-red-600" : totalBalance < 0 ? "text-green-600" : "text-slate-900"}`}
              >
                {totalBalance > 0 ? "-" : totalBalance < 0 ? "+" : ""}₦
                {Math.abs(totalBalance).toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {totalBalance > 0
                  ? "Outstanding balance"
                  : totalBalance < 0
                    ? "Overpaid"
                    : "Fully settled"}
              </p>
            </div>
          </div>

          {/* Total Debt */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                Total Debt
              </span>
              <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-100">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </span>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                ₦
                {totalDebt.toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="text-xs text-slate-400 mt-1">Total amount owed</p>
            </div>
          </div>

          {/* Total Payment */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                Total Payment
              </span>
              <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-100">
                <TrendingDown className="h-5 w-5 text-green-600" />
              </span>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                ₦
                {totalPayment.toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="text-xs text-slate-400 mt-1">Total received</p>
            </div>
          </div>

          {/* Total Customers */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                Customers
              </span>
              <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-100">
                <Users className="h-5 w-5 text-purple-600" />
              </span>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                {customerCount}
              </p>
              <p className="text-xs text-slate-400 mt-1">Active accounts</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/customers"
              className="flex items-center gap-4 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 border border-blue-200 text-blue-800 font-semibold px-5 py-4 rounded-xl transition-colors"
            >
              <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600 text-white shrink-0">
                <Users size={20} />
              </span>
              <div>
                <p className="font-semibold text-base">View All Customers</p>
                <p className="text-xs text-blue-600 font-normal">
                  Browse and manage accounts
                </p>
              </div>
            </Link>
            <Link
              href="/customers/new"
              className="flex items-center gap-4 bg-green-50 hover:bg-green-100 active:bg-green-200 border border-green-200 text-green-800 font-semibold px-5 py-4 rounded-xl transition-colors"
            >
              <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-600 text-white shrink-0">
                <Users size={20} />
              </span>
              <div>
                <p className="font-semibold text-base">Add New Customer</p>
                <p className="text-xs text-green-600 font-normal">
                  Register a new account
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
