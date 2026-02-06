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
  const [totalMoneyCollected, setTotalMoneyCollected] = useState(0);
  const [totalMoneyPaid, setTotalMoneyPaid] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [filter, setFilter] = useState<"all" | "debt" | "payment">("all");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [customer, setCustomer] = useState<any | null>(null);

  useEffect(() => {
    fetchCustomer();
  }, [customerId]);

  useEffect(() => {
    fetchTransactions();
  }, [customerId, page, pageSize, filter]);

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
        handler as EventListener,
      );
    };
  }, [customerId]);

  const fetchTransactions = async () => {
    try {
      const supabase = getSupabaseClient();

      // Fetch all transactions for summary calculations
      const { data: allData, error: allError } = await supabase
        .from("transactions")
        .select("type, amount")
        .eq("customer_id", customerId);

      if (allError) throw allError;

      // Calculate totals from all transactions
      let debt = 0;
      let moneyCollected = 0;
      let moneyPaid = 0;

      (allData || []).forEach(
        (t: { type: "debt" | "payment"; amount: number }) => {
          const amount = Number(t.amount);
          if (t.type === "debt") {
            debt += amount;
            moneyCollected += amount;
          } else if (t.type === "payment") {
            debt -= amount;
            moneyPaid += amount;
          }
        },
      );

      setTotalDebt(debt);
      setTotalMoneyCollected(moneyCollected);
      setTotalMoneyPaid(moneyPaid);

      // Fetch paginated transactions for display
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from("transactions")
        .select("*", { count: "exact" })
        .eq("customer_id", customerId)
        .order("transaction_date", { ascending: false });

      if (filter !== "all") {
        query = query.eq("type", filter);
      }

      const { data, error, count } = await query.range(from, to);

      if (error) throw error;

      const rows = (data || []) as Transaction[];
      setTransactions(rows);
      setTotalCount(count || 0);
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

  const handleFilterChange = (newFilter: "all" | "debt" | "payment") => {
    setFilter(newFilter);
    setPage(1);
  };

  const exportPDF = async () => {
    try {
      const supabase = getSupabaseClient();

      // Fetch transactions for export based on current filter
      let exportQuery = supabase
        .from("transactions")
        .select("*")
        .eq("customer_id", customerId)
        .order("transaction_date", { ascending: false });

      if (filter !== "all") {
        exportQuery = exportQuery.eq("type", filter);
      }

      const { data: allTransactions, error } = await exportQuery;

      if (error) throw error;

      if (!allTransactions || allTransactions.length === 0) {
        alert("No transactions to export");
        return;
      }

      // Dynamic imports to avoid SSR issues
      const jsPDF = (await import("jspdf")).default;
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Add a clean header
      const margin = 14;
      doc.setFillColor(245, 247, 250);
      doc.rect(0, 0, pageWidth, 50, "F");

      const title =
        filter === "all"
          ? "Transaction History"
          : filter === "debt"
            ? "Debt Transactions"
            : "Payment Transactions";
      doc.setFontSize(20);
      doc.setTextColor(34, 40, 49);
      doc.setFont("helvetica", "bold");
      doc.text(title, margin, 20);

      // Customer block on the right
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const custLines: string[] = [];
      if (customer?.name) custLines.push(customer.name);
      if (customer?.phone) custLines.push(`Phone: ${customer.phone}`);
      if (customer?.email) custLines.push(`Email: ${customer.email}`);
      if (customer?.address) custLines.push(`${customer.address}`);

      // right align customer info
      let infoY = 18;
      custLines.forEach((line) => {
        const textWidth = doc.getTextWidth(line);
        doc.text(line, pageWidth - margin - textWidth, infoY);
        infoY += 6;
      });

      // Export date
      doc.setFontSize(9);
      doc.setTextColor(113, 122, 133);
      const dateStr = `Export Date: ${new Date().toLocaleDateString()}`;
      const dateWidth = doc.getTextWidth(dateStr);
      doc.text(dateStr, pageWidth - margin - dateWidth, infoY + 2);

      // Prepare table data with clean amounts
      const nf = new Intl.NumberFormat("en-NG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      const tableData = (allTransactions as Transaction[]).map((t) => {
        const date = new Date(t.transaction_date).toLocaleDateString();
        const type = t.type === "debt" ? "Debt" : "Payment";
        const raw = Number(t.amount) || 0;
        const amountVal = nf.format(raw);
        const amount =
          t.type === "debt"
            ? `-NGN\u00A0${amountVal}`
            : `NGN\u00A0${amountVal}`;
        const description = t.description || "—";
        return [date, type, amount, description];
      });

      // Table styles: modern, clean
      autoTable(doc, {
        head: [["Date", "Type", "Amount (NGN)", "Description"]],
        body: tableData,
        startY: 58,
        theme: "grid",
        styles: {
          font: "helvetica",
          fontSize: 9,
          textColor: [34, 40, 49],
        },
        headStyles: {
          fillColor: [36, 58, 86],
          textColor: [255, 255, 255],
          halign: "left",
        },
        alternateRowStyles: { fillColor: [250, 251, 252] },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 40 },
          2: { cellWidth: 40, halign: "right" },
          3: { cellWidth: "auto" },
        },
        didParseCell: (data) => {
          if (data.section === "body" && data.column.index === 1) {
            const val = data.cell.raw as string;
            if (val === "Debt") data.cell.styles.textColor = [220, 38, 38];
            else data.cell.styles.textColor = [22, 163, 74];
          }
          if (data.section === "body" && data.column.index === 2) {
            const raw = data.cell.raw as string;
            if (raw.startsWith("-NGN"))
              data.cell.styles.textColor = [220, 38, 38];
            else data.cell.styles.textColor = [22, 163, 74];
            data.cell.styles.fontStyle = "normal";
          }
        },
      });

      // Summary block below table
      const finalY = (doc as any).lastAutoTable?.finalY || 58;
      const summaryY = finalY + 10;
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(34, 40, 49);
      doc.text(
        `Total Debt Collected: NGN ${nf.format(totalMoneyCollected)}`,
        margin,
        summaryY,
      );

      doc.text(
        `Total Payments Made: NGN ${nf.format(totalMoneyPaid)}`,
        margin,
        summaryY + 7,
      );

      doc.setFont("helvetica", "bold");
      const balanceLabel = `Current Balance:`;
      const balanceValue = `${totalDebt >= 0 ? "-NGN\u00A0" : "NGN\u00A0"}${nf.format(Math.abs(totalDebt))}`;
      const balanceWidth = doc.getTextWidth(balanceLabel + " " + balanceValue);
      // color for balance
      if (totalDebt >= 0) doc.setTextColor(220, 38, 38);
      else doc.setTextColor(22, 163, 74);
      doc.text(`${balanceLabel} ${balanceValue}`, margin, summaryY + 14);

      // Filename and save
      const filterSuffix = filter === "all" ? "" : `_${filter}`;
      const safeName = customer?.name
        ? customer.name.replace(/[^a-z0-9_-]/gi, "_")
        : "customer";
      const filename = `${safeName}_transactions${filterSuffix}.pdf`;
      doc.save(filename);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 md:p-8">
      {/* Summary Statistics Grid */}
      <div className="mb-6 md:mb-8 pb-6 md:pb-8 border-b-2 border-slate-200">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 mb-4 md:mb-6">
          Transaction Summary
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          {/* Total Debt Collected */}
          <div className="bg-red-50 rounded-lg p-4 border-2 border-red-200">
            <p className="text-red-700 text-xs sm:text-sm font-semibold mb-1 uppercase tracking-wide">
              Total Debt Collected
            </p>
            <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-red-600">
              <span
                className="inline-block whitespace-nowrap leading-tight"
                style={{ fontSize: "clamp(1rem, 2.2vw, 1.75rem)" }}
              >
                ₦
                {totalMoneyCollected.toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </p>
          </div>

          {/* Total Payments Made */}
          <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
            <p className="text-green-700 text-xs sm:text-sm font-semibold mb-1 uppercase tracking-wide">
              Total Payments Made
            </p>
            <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-600">
              <span
                className="inline-block whitespace-nowrap leading-tight"
                style={{ fontSize: "clamp(1rem, 2.2vw, 1.75rem)" }}
              >
                ₦
                {totalMoneyPaid.toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </p>
          </div>

          {/* Current Balance */}
          <div
            className={`rounded-lg p-4 border-2 ${
              totalDebt > 0
                ? "bg-red-50 border-red-200"
                : totalDebt < 0
                  ? "bg-green-50 border-green-200"
                  : "bg-slate-50 border-slate-200"
            }`}
          >
            <p
              className={`text-xs sm:text-sm font-semibold mb-1 uppercase tracking-wide ${
                totalDebt > 0
                  ? "text-red-700"
                  : totalDebt < 0
                    ? "text-green-700"
                    : "text-slate-700"
              }`}
            >
              Current Balance
            </p>
            <p
              className={`text-2xl sm:text-3xl md:text-4xl font-bold ${
                totalDebt > 0
                  ? "text-red-600"
                  : totalDebt < 0
                    ? "text-green-600"
                    : "text-slate-600"
              }`}
            >
              <span
                className="inline-block whitespace-nowrap leading-tight"
                style={{ fontSize: "clamp(1rem, 2.2vw, 1.75rem)" }}
              >
                {totalDebt > 0 ? "-" : totalDebt < 0 ? "+" : ""}₦
                {Math.abs(totalDebt).toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </p>
            <p
              className={`text-xs sm:text-sm mt-1 ${
                totalDebt > 0
                  ? "text-red-600"
                  : totalDebt < 0
                    ? "text-green-600"
                    : "text-slate-600"
              }`}
            >
              {totalDebt > 0
                ? "Customer owes"
                : totalDebt < 0
                  ? "You owe customer"
                  : "Account balanced"}
            </p>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900">
          Transaction History
        </h2>
        {transactions.length > 0 && (
          <button
            onClick={exportPDF}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
            title="Download transaction history as PDF"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Download PDF
          </button>
        )}
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-4 md:mb-6">
        <button
          onClick={() => handleFilterChange("all")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            filter === "all"
              ? "bg-slate-600 text-white"
              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
          }`}
        >
          All Transactions
        </button>
        <button
          onClick={() => handleFilterChange("debt")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            filter === "debt"
              ? "bg-red-600 text-white"
              : "bg-red-100 hover:bg-red-200 text-red-700"
          }`}
        >
          Debts Only
        </button>
        <button
          onClick={() => handleFilterChange("payment")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            filter === "payment"
              ? "bg-green-600 text-white"
              : "bg-green-100 hover:bg-green-200 text-green-700"
          }`}
        >
          Payments Only
        </button>
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

      {/* Pagination */}
      {totalCount > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-sm text-slate-600">
            {(() => {
              const start = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
              const end = Math.min(page * pageSize, totalCount);
              return `Showing ${start}–${end} of ${totalCount}`;
            })()}
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">Rows:</label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="border rounded-md px-2 py-1 text-sm"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>

            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-md text-sm"
            >
              Prev
            </button>

            <div className="text-sm text-slate-700 px-2">
              Page {page} of {Math.max(1, Math.ceil(totalCount / pageSize))}
            </div>

            <button
              onClick={() =>
                setPage((p) =>
                  Math.min(Math.ceil(totalCount / pageSize) || 1, p + 1),
                )
              }
              disabled={page >= Math.ceil(totalCount / pageSize)}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-md text-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
