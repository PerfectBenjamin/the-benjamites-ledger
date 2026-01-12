"use client";

import { useState, useEffect } from "react";
import { getSupabaseClient } from "./supabase-client";
import { Trash2 } from "lucide-react";

interface Transaction {
  id: string;
  type: "debt" | "payment";
  amount: number;
  description: string | null;
  transaction_date: string;
  created_at: string;
}

interface TransactionListProps {
  customerId: string;
}

export default function TransactionList({ customerId }: TransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalDebt, setTotalDebt] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [customer, setCustomer] = useState<any | null>(null);

  useEffect(() => {
    fetchTransactions();
    fetchCustomer();
  }, [customerId]);

  const fetchCustomer = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("id", customerId)
        .single();

      if (error) throw error;
      setCustomer(data || null);
    } catch (err) {
      console.error("Error fetching customer:", err);
    }
  };

  useEffect(() => {
    const handler = (e: Event) => {
      try {
        const detail = (e as CustomEvent).detail as
          | { customerId?: string }
          | undefined;
        if (!detail || detail.customerId === customerId) fetchTransactions();
      } catch (err) {
        fetchTransactions();
      }
    };

    window.addEventListener("transactions:updated", handler as EventListener);
    return () => {
      window.removeEventListener(
        "transactions:updated",
        handler as EventListener
      );
    };
  }, [customerId]);

  const fetchTransactions = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("customer_id", customerId)
        .order("transaction_date", { ascending: false });

      if (error) throw error;

      setTransactions(data || []);

      const debt = (data || []).reduce((acc, t) => {
        return acc + (t.type === "debt" ? t.amount : -t.amount);
      }, 0);

      setTotalDebt(debt);
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (transactionId: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;

    setDeleting(transactionId);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", transactionId);

      if (error) throw error;
      await fetchTransactions();
    } catch (err) {
      console.error("Error deleting transaction:", err);
      alert("Failed to delete transaction");
    } finally {
      setDeleting(null);
    }
  };

  const exportPDF = () => {
    if (!transactions || transactions.length === 0) {
      alert("No transactions to export");
      return;
    }

    const win = window.open("", "_blank");
    if (!win) {
      alert("Please allow popups to export PDF.");
      return;
    }

    const styles = `
      <style>
        body { font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; padding: 24px; color: #0f172a }
        h1 { font-size: 18px; margin-bottom: 8px }
        table { width: 100%; border-collapse: collapse; margin-top: 12px }
        th, td { border: 1px solid #e6e9ef; padding: 8px; text-align: left }
        th { background: #f8fafc; font-weight: 600 }
        td.amount { text-align: right; font-variant-numeric: tabular-nums }
        .debt { color: #dc2626 }
        .payment { color: #16a34a }
        .small { font-size: 12px; color: #6b7280 }
      </style>
    `;

    const custLines = [];
    if (customer) {
      if (customer.name)
        custLines.push(`<div><strong>${customer.name}</strong></div>`);
      if (customer.phone) custLines.push(`<div>Phone: ${customer.phone}</div>`);
      if (customer.email) custLines.push(`<div>Email: ${customer.email}</div>`);
      if (customer.address)
        custLines.push(`<div>Address: ${customer.address}</div>`);
    }

    const header = `<div>${custLines.join(
      ""
    )}</div><div class="small" style="margin-top:8px">Export date: ${new Date()
      .toISOString()
      .slice(0, 10)}</div>`;

    const tableHeader = `<tr><th>Date</th><th>Type</th><th style="text-align:right">Amount (₦)</th><th>Description</th><th>Created At</th></tr>`;

    const rows = transactions
      .map((t) => {
        const sign = t.type === "debt" ? "-" : "+";
        const cls = t.type === "debt" ? "debt" : "payment";
        const date = new Date(t.transaction_date).toISOString().slice(0, 10);
        const created = new Date(t.created_at).toISOString();
        const amount = `${sign}${Number(t.amount).toFixed(2)}`;
        const desc = (t.description || "")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        return `<tr><td>${date}</td><td class="${cls}">${t.type}</td><td class="amount ${cls}">${amount}</td><td>${desc}</td><td>${created}</td></tr>`;
      })
      .join("");

    const html = `<!doctype html><html><head><meta charset="utf-8">${styles}</head><body>${header}<table>${tableHeader}${rows}</table></body></html>`;

    win.document.open();
    win.document.write(html);
    win.document.close();

    // give the window a moment to render then trigger print
    setTimeout(() => {
      win.focus();
      win.print();
    }, 300);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 md:p-8">
      {/* Total Debt Summary */}
      <div className="mb-6 md:mb-8 pb-6 md:pb-8 border-b-2 border-slate-200">
        <p className="text-slate-600 text-sm sm:text-base md:text-lg font-medium mb-2">
          Current Balance
        </p>
        <p
          className={`text-3xl sm:text-4xl md:text-5xl font-bold ${
            totalDebt > 0 ? "text-red-600" : "text-green-600"
          }`}
        >
          {totalDebt > 0 ? "-" : totalDebt < 0 ? "+" : ""}₦
          {Math.abs(totalDebt).toLocaleString("en-NG", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
        <p className="text-slate-600 text-sm sm:text-base md:text-lg mt-2">
          {totalDebt > 0
            ? "Customer owes this amount"
            : totalDebt < 0
            ? "You owe the customer"
            : "Account balanced"}
        </p>
      </div>

      {/* Transactions List */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900">
          Transaction History
        </h2>
        {transactions.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={exportPDF}
              className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-semibold px-3 py-2 rounded-lg text-sm transition-colors"
              title="Export transaction history as PDF"
            >
              Export PDF
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-base sm:text-lg md:text-xl text-slate-600">
          Loading transactions...
        </p>
      ) : transactions.length > 0 ? (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 border-b-2 border-slate-300">
                <tr>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-base lg:text-lg font-semibold text-slate-700">
                    Date
                  </th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-base lg:text-lg font-semibold text-slate-700">
                    Type
                  </th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-base lg:text-lg font-semibold text-slate-700">
                    Description
                  </th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-right text-base lg:text-lg font-semibold text-slate-700">
                    Amount
                  </th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-center text-base lg:text-lg font-semibold text-slate-700">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-base lg:text-lg font-medium text-slate-900">
                      {new Date(t.transaction_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-base lg:text-lg">
                      <span
                        className={`inline-block px-3 py-1 rounded-full font-semibold text-sm ${
                          t.type === "debt"
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {t.type === "debt" ? "Debt" : "Payment"}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-base lg:text-lg text-slate-600">
                      {t.description || "—"}
                    </td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-right text-base lg:text-lg font-semibold">
                      <span
                        className={
                          t.type === "debt" ? "text-red-600" : "text-green-600"
                        }
                      >
                        {t.type === "debt" ? "-" : "+"}₦
                        {t.amount.toLocaleString("en-NG", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-center">
                      <button
                        onClick={() => handleDelete(t.id)}
                        disabled={deleting === t.id}
                        className="inline-block bg-red-100 hover:bg-red-200 active:bg-red-300 disabled:bg-slate-200 text-red-700 p-2 rounded-lg transition-colors min-h-9 min-w-9"
                        title="Delete transaction"
                      >
                        <Trash2 size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {transactions.map((t) => (
              <div
                key={t.id}
                className="bg-slate-50 rounded-lg p-4 border border-slate-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`inline-block px-3 py-1 rounded-full font-semibold text-xs ${
                          t.type === "debt"
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {t.type === "debt" ? "Debt" : "Payment"}
                      </span>
                      <span className="text-sm text-slate-600">
                        {new Date(t.transaction_date).toLocaleDateString()}
                      </span>
                    </div>
                    {t.description && (
                      <p className="text-sm text-slate-700 mb-2">
                        {t.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(t.id)}
                    disabled={deleting === t.id}
                    className="ml-3 bg-red-100 hover:bg-red-200 active:bg-red-300 disabled:bg-slate-200 text-red-700 p-2 rounded-lg transition-colors min-h-11 min-w-11 flex items-center justify-center"
                    title="Delete transaction"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
                <div
                  className={`text-2xl font-bold text-right ${
                    t.type === "debt" ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {t.type === "debt" ? "-" : "+"}₦
                  {t.amount.toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-base sm:text-lg md:text-xl text-slate-600">
          No transactions recorded yet.
        </p>
      )}
    </div>
  );
}
