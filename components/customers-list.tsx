"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "./supabase-client";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Customer = { id: string; name: string; phone?: string | null };

type Transaction = {
  id: string;
  customer_id: string;
  type: "debt" | "payment";
  amount: number | string;
};

export default function CustomersList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 639px)");
    const handle = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    if (mq.addEventListener) mq.addEventListener("change", handle);
    else mq.addListener(handle);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handle);
      else mq.removeListener(handle as any);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const supabase = getSupabaseClient();

      const { data: customersData, error: cErr } = await supabase
        .from("customers")
        .select("id, name, phone")
        .order("name");

      if (cErr) throw cErr;

      const { data: txData, error: tErr } = await supabase
        .from("transactions")
        .select("id, customer_id, type, amount");

      if (tErr) throw tErr;

      setCustomers(customersData || []);
      setTransactions(txData || []);
    } catch (err) {
      console.error("Error fetching customers or transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  // compute totals per customer
  const totals = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach((t) => {
      const id = t.customer_id;
      if (!map[id]) map[id] = 0;
      const amt =
        typeof t.amount === "string" ? parseFloat(t.amount) : Number(t.amount);
      if (t.type === "debt") map[id] += amt;
      else map[id] -= amt;
    });
    return map;
  }, [transactions]);

  // filtered and searched list
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers.filter((c) => {
      const debt = totals[c.id] || 0;

      if (filter === "owes" && debt <= 0) return false;
      if (filter === "credit" && debt >= 0) return false;
      if (filter === "settled" && Math.abs(debt) > 0.001) return false;

      if (!q) return true;
      if (c.name.toLowerCase().includes(q)) return true;
      if (c.phone?.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [customers, totals, query, filter]);

  return (
    <div>
      <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row flex-1 min-w-0 gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or phone"
              className="w-full sm:w-80 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
            />

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 border border-slate-200 rounded-lg bg-white"
            >
              <option value="all">All</option>
              <option value="owes">Owes</option>
              <option value="credit">Credit</option>
              <option value="settled">Settled</option>
            </select>
          </div>

          <div className="mt-2 sm:mt-0 sm:ml-4 shrink-0 w-full sm:w-auto">
            <Link
              href="/customers/new"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-base"
            >
              + New Customer
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-slate-600">Loading…</div>
        ) : filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 border-b-2 border-slate-300">
                <tr>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-base lg:text-lg font-semibold text-slate-700">
                    Customer Name
                  </th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-base lg:text-lg font-semibold text-slate-700">
                    Phone
                  </th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-right text-sm sm:text-base lg:text-lg font-semibold text-slate-700 whitespace-nowrap">
                    Total Debt
                  </th>
                  <th
                    className={`${
                      isMobile ? "hidden" : ""
                    } px-4 lg:px-6 py-3 lg:py-4 text-center text-base lg:text-lg font-semibold text-slate-700`}
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer) => {
                  const debt = totals[customer.id] || 0;
                  return (
                    <tr
                      key={customer.id}
                      onClick={() =>
                        isMobile && router.push(`/customers/${customer.id}`)
                      }
                      className={`border-b border-slate-200 hover:bg-slate-50 transition-colors ${
                        isMobile ? "cursor-pointer" : ""
                      }`}
                    >
                      <td className="px-4 lg:px-6 py-3 lg:py-4 text-base lg:text-lg font-medium text-slate-900">
                        {customer.name}
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4 text-base lg:text-lg text-slate-600">
                        {customer.phone || "—"}
                      </td>
                      <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 text-right text-sm sm:text-base lg:text-lg font-semibold">
                        <span
                          className={`${
                            debt > 0 ? "text-red-600" : "text-green-600"
                          } whitespace-nowrap`}
                        >
                          {debt > 0 ? "-" : debt < 0 ? "+" : ""}₦
                          {Math.abs(debt).toLocaleString("en-NG", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </td>
                      <td
                        className={`px-4 lg:px-6 py-3 lg:py-4 text-center ${
                          isMobile ? "hidden" : ""
                        }`}
                      >
                        <Link
                          href={`/customers/${customer.id}`}
                          className="inline-block bg-blue-100 hover:bg-blue-200 active:bg-blue-300 text-blue-700 font-semibold px-4 py-2 rounded-lg transition-colors text-sm lg:text-base min-h-9"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-slate-600">
            No customers found.
          </div>
        )}
      </div>
    </div>
  );
}
