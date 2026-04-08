"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

type SummaryResponse = {
  customer: {
    id: string;
    name: string;
    customer_code: string | null;
    pin_reset_required: boolean;
  };
  summary: {
    totalDebt: number;
    totalPaid: number;
    balance: number;
  };
};

type TransactionsResponse = {
  transactions: {
    id: string;
    type: "debt" | "payment";
    amount: number;
    description: string | null;
    transaction_date: string;
  }[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export default function CustomerPortalPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [transactions, setTransactions] = useState<
    TransactionsResponse["transactions"]
  >([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [filter, setFilter] = useState<"all" | "debt" | "payment">("all");
  const [loading, setLoading] = useState(true);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalCount / pageSize)),
    [pageSize, totalCount],
  );

  const loadSummary = async () => {
    const res = await fetch("/api/customer/me/summary", {
      credentials: "same-origin",
      cache: "no-store",
    });

    if (res.status === 401) {
      router.push("/customer-login");
      return;
    }

    const data = (await res.json()) as SummaryResponse;
    if (!res.ok) {
      throw new Error("Failed to fetch account summary");
    }

    setSummary(data);
    const forcePinChange =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("forcePinChange") === "1";

    if (forcePinChange || data.customer.pin_reset_required) {
      setPinModalOpen(true);
    }
  };

  const loadTransactions = async () => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      filter,
    });

    const res = await fetch(
      `/api/customer/me/transactions?${params.toString()}`,
      {
        credentials: "same-origin",
        cache: "no-store",
      },
    );

    if (res.status === 401) {
      router.push("/customer-login");
      return;
    }

    const data = (await res.json()) as TransactionsResponse;
    if (!res.ok) {
      throw new Error("Failed to fetch transactions");
    }

    setTransactions(data.transactions || []);
    setTotalCount(data.totalCount || 0);
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([loadSummary(), loadTransactions()])
      .catch((error) => {
        console.error("Failed to load customer portal", error);
      })
      .finally(() => setLoading(false));
  }, [page, pageSize, filter]);

  const logout = async () => {
    await fetch("/api/logout", { method: "POST", credentials: "same-origin" });
    router.push("/customer-login");
  };

  const submitPinChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);

    if (!/^\d{4}$/.test(newPin)) {
      setPinError("New PIN must be exactly 4 digits.");
      return;
    }

    if (newPin !== confirmPin) {
      setPinError("New PIN and confirmation do not match.");
      return;
    }

    setPinLoading(true);

    try {
      const res = await fetch("/api/customer/change-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ currentPin, newPin }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update PIN");
      }

      setPinModalOpen(false);
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
      router.replace("/customer");
      await loadSummary();
    } catch (error) {
      setPinError(
        error instanceof Error ? error.message : "Failed to update PIN",
      );
    } finally {
      setPinLoading(false);
    }
  };

  if (loading && !summary) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="bg-white shadow-lg rounded-2xl p-8 text-slate-600 text-lg">
          Loading account…
        </div>
      </main>
    );
  }

  const balance = summary?.summary.balance || 0;

  return (
    <main className="min-h-screen bg-slate-100">
      {/* Sticky nav */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-3 flex items-center justify-between gap-4">
          <img
            src="/rectangle ben.png"
            alt="The Benjamites Network Ltd"
            className="h-10 sm:h-12 w-auto object-contain"
          />
          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 space-y-6">
        {/* Welcome card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-6 py-5">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Welcome, {summary?.customer.name}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Customer ID:{" "}
            <span className="font-mono font-semibold text-slate-700">
              {summary?.customer.customer_code || "Unavailable"}
            </span>
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-red-600">
                ₦
                {summary?.summary.totalDebt.toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="text-xs text-slate-400 mt-1">Total amount owed</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                Total Paid
              </span>
              <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-100">
                <TrendingDown className="h-5 w-5 text-green-600" />
              </span>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-green-600">
                ₦
                {summary?.summary.totalPaid.toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="text-xs text-slate-400 mt-1">Total received</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                Balance
              </span>
              <span
                className={`flex items-center justify-center w-10 h-10 rounded-xl ${balance > 0 ? "bg-red-100" : balance < 0 ? "bg-green-100" : "bg-slate-100"}`}
              >
                <Wallet
                  className={`h-5 w-5 ${balance > 0 ? "text-red-600" : balance < 0 ? "text-green-600" : "text-slate-600"}`}
                />
              </span>
            </div>
            <div>
              <p
                className={`text-2xl sm:text-3xl font-bold tracking-tight ${balance > 0 ? "text-red-600" : balance < 0 ? "text-green-600" : "text-slate-900"}`}
              >
                {balance > 0 ? "-" : balance < 0 ? "+" : ""}₦
                {Math.abs(balance).toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {balance > 0
                  ? "Outstanding"
                  : balance < 0
                    ? "Overpaid"
                    : "Fully settled"}
              </p>
            </div>
          </div>
        </div>

        {/* Transaction history */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Transaction History
            </h2>
            <div className="flex items-center gap-2">
              {(["all", "debt", "payment"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    setFilter(f);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors capitalize ${
                    filter === f
                      ? f === "all"
                        ? "bg-slate-700 text-white"
                        : f === "debt"
                          ? "bg-red-600 text-white"
                          : "bg-green-600 text-white"
                      : f === "debt"
                        ? "bg-red-50 text-red-700 hover:bg-red-100"
                        : f === "payment"
                          ? "bg-green-50 text-green-700 hover:bg-green-100"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {f === "all" ? "All" : f === "debt" ? "Debt" : "Payment"}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {transactions.length === 0 ? (
              <p className="text-slate-500 text-center py-6">
                No transactions found.
              </p>
            ) : (
              transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between gap-3 border border-slate-100 rounded-xl px-4 py-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400 mb-0.5">
                      {new Date(tx.transaction_date).toLocaleDateString()}
                    </p>
                    <p className="font-medium text-slate-800 text-sm leading-snug">
                      {tx.description || "No description"}
                    </p>
                  </div>
                  <p
                    className={`text-base font-bold whitespace-nowrap shrink-0 ${tx.type === "debt" ? "text-red-600" : "text-green-600"}`}
                  >
                    {tx.type === "debt" ? "-" : "+"}₦
                    {Number(tx.amount).toLocaleString("en-NG", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((v) => Math.max(1, v - 1))}
                disabled={page <= 1}
                className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-medium disabled:opacity-40 transition-colors"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((v) => Math.min(totalPages, v + 1))}
                disabled={page >= totalPages}
                className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-medium disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PIN change modal */}
      {pinModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-teal-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white">Change Your PIN</h2>
              <p className="text-teal-100 text-sm mt-0.5">
                Please set a new PIN before continuing.
              </p>
            </div>
            <form className="px-6 py-5 space-y-4" onSubmit={submitPinChange}>
              {[
                {
                  label: "Current PIN",
                  value: currentPin,
                  setter: setCurrentPin,
                },
                { label: "New PIN", value: newPin, setter: setNewPin },
                {
                  label: "Confirm New PIN",
                  value: confirmPin,
                  setter: setConfirmPin,
                },
              ].map(({ label, value, setter }) => (
                <div key={label}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {label}
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    required
                    value={value}
                    onChange={(e) => setter(e.target.value.replace(/\D/g, ""))}
                    className="w-full border-2 border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-teal-500 transition-colors text-center text-xl tracking-widest"
                    placeholder="••••"
                  />
                </div>
              ))}

              {pinError && (
                <div className="text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm">
                  {pinError}
                </div>
              )}

              <button
                type="submit"
                disabled={pinLoading}
                className="w-full bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:bg-slate-400 text-white font-semibold rounded-lg px-4 py-2.5 transition-colors"
              >
                {pinLoading ? "Updating…" : "Update PIN"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
