"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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
      <main className="min-h-screen bg-linear-to-br from-teal-50 to-slate-100 p-4 sm:p-6 md:p-8">
        <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-6 text-slate-700">
          Loading account...
        </div>
      </main>
    );
  }

  const balance = summary?.summary.balance || 0;

  return (
    <main className="min-h-screen bg-linear-to-br from-teal-50 to-slate-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Welcome, {summary?.customer.name}
            </h1>
            <p className="text-slate-600 mt-1">
              Customer ID: {summary?.customer.customer_code || "Unavailable"}
            </p>
          </div>

          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg"
          >
            Sign out
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4 border border-red-100">
            <p className="text-sm text-slate-600">Total Debt</p>
            <p className="text-2xl font-bold text-red-600">
              ₦
              {summary?.summary.totalDebt.toLocaleString("en-NG", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border border-green-100">
            <p className="text-sm text-slate-600">Total Paid</p>
            <p className="text-2xl font-bold text-green-600">
              ₦
              {summary?.summary.totalPaid.toLocaleString("en-NG", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border border-slate-200">
            <p className="text-sm text-slate-600">Current Balance</p>
            <p
              className={`text-2xl font-bold ${
                balance > 0
                  ? "text-red-600"
                  : balance < 0
                    ? "text-green-600"
                    : "text-slate-700"
              }`}
            >
              {balance > 0 ? "-" : balance < 0 ? "+" : ""}₦
              {Math.abs(balance).toLocaleString("en-NG", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Transaction History
            </h2>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setFilter("all");
                  setPage(1);
                }}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  filter === "all"
                    ? "bg-slate-700 text-white"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                All
              </button>
              <button
                onClick={() => {
                  setFilter("debt");
                  setPage(1);
                }}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  filter === "debt"
                    ? "bg-red-600 text-white"
                    : "bg-red-100 text-red-700"
                }`}
              >
                Debt
              </button>
              <button
                onClick={() => {
                  setFilter("payment");
                  setPage(1);
                }}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  filter === "payment"
                    ? "bg-green-600 text-white"
                    : "bg-green-100 text-green-700"
                }`}
              >
                Payment
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {transactions.length === 0 ? (
              <p className="text-slate-600">No transactions found.</p>
            ) : (
              transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="border border-slate-200 rounded-lg p-3 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm text-slate-600">
                      {new Date(tx.transaction_date).toLocaleDateString()}
                    </p>
                    <p className="font-medium text-slate-900">
                      {tx.description || "No description"}
                    </p>
                  </div>

                  <p
                    className={`text-lg font-bold ${
                      tx.type === "debt" ? "text-red-600" : "text-green-600"
                    }`}
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

          <div className="mt-5 pt-4 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={page <= 1}
                className="px-3 py-1 rounded bg-slate-100 disabled:opacity-50"
              >
                Prev
              </button>
              <button
                onClick={() =>
                  setPage((value) => Math.min(totalPages, value + 1))
                }
                disabled={page >= totalPages}
                className="px-3 py-1 rounded bg-slate-100 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {pinModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-5">
            <h2 className="text-xl font-bold text-slate-900">Change PIN</h2>
            <p className="text-sm text-slate-600 mt-1">
              For security, please change your PIN before continuing.
            </p>

            <form className="mt-4 space-y-3" onSubmit={submitPinChange}>
              <div>
                <label className="block text-sm text-slate-700 mb-1">
                  Current PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  required
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value)}
                  className="w-full border border-slate-300 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-700 mb-1">
                  New PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  required
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="w-full border border-slate-300 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-700 mb-1">
                  Confirm New PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  required
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  className="w-full border border-slate-300 rounded px-3 py-2"
                />
              </div>

              {pinError && (
                <div className="text-red-700 bg-red-50 rounded px-3 py-2 text-sm">
                  {pinError}
                </div>
              )}

              <button
                type="submit"
                disabled={pinLoading}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded px-4 py-2"
              >
                {pinLoading ? "Updating..." : "Update PIN"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
