"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "./supabase-client";

interface AddTransactionFormProps {
  customerId: string;
}

export default function AddTransactionForm({
  customerId,
}: AddTransactionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: "debt" as "debt" | "payment",
    amount: "",
    description: "",
    transaction_date: new Date().toISOString().split("T")[0],
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.amount || Number.parseFloat(formData.amount) <= 0) {
        throw new Error("Amount must be greater than 0");
      }

      const supabase = getSupabaseClient();
      const { error: insertError } = await supabase
        .from("transactions")
        .insert([
          {
            customer_id: customerId,
            type: formData.type,
            amount: Number.parseFloat(formData.amount),
            description: formData.description || null,
            transaction_date: formData.transaction_date,
          },
        ]);

      if (insertError) throw insertError;

      setFormData({
        type: "debt",
        amount: "",
        description: "",
        transaction_date: new Date().toISOString().split("T")[0],
      });

      // notify other components (TransactionList) to refresh
      try {
        window.dispatchEvent(
          new CustomEvent("transactions:updated", { detail: { customerId } })
        );
      } catch (e) {
        /* ignore if window not available */
      }

      router.refresh();
    } catch (err) {
      console.error("Error adding transaction:", err);
      setError(
        err instanceof Error ? err.message : "Failed to add transaction"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 md:p-8 mb-6 md:mb-8">
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 mb-4 md:mb-6">
        {formData.type === "debt" ? "Record Debt" : "Record Payment"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div>
            <label
              htmlFor="type"
              className="block text-base md:text-lg font-semibold text-slate-700 mb-2 md:mb-3"
            >
              Transaction Type
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-3 sm:px-4 py-3 text-base md:text-lg border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-h-11"
            >
              <option value="debt">Debt (Customer Owes)</option>
              <option value="payment">Payment (Customer Pays)</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="amount"
              className="block text-base md:text-lg font-semibold text-slate-700 mb-2 md:mb-3"
            >
              Amount *
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
              step="0.01"
              min="0"
              max="9999999999.99"
              className="w-full px-3 sm:px-4 py-3 text-base md:text-lg border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-h-11"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="transaction_date"
            className="block text-base md:text-lg font-semibold text-slate-700 mb-2 md:mb-3"
          >
            Date
          </label>
          <input
            type="date"
            id="transaction_date"
            name="transaction_date"
            value={formData.transaction_date}
            onChange={handleChange}
            className="w-full px-3 sm:px-4 py-3 text-base md:text-lg border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-h-11"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-base md:text-lg font-semibold text-slate-700 mb-2 md:mb-3"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={2}
            className="w-full px-3 sm:px-4 py-3 text-base md:text-lg border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            placeholder="Optional notes about this transaction"
          />
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 md:p-4">
            <p className="text-red-700 text-base md:text-lg font-medium">
              {error}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-400 text-white font-semibold px-4 sm:px-6 py-4 rounded-lg transition-colors text-base md:text-lg min-h-12"
        >
          {loading
            ? "Recording..."
            : `Record ${formData.type === "debt" ? "Debt" : "Payment"}`}
        </button>
      </form>
    </div>
  );
}
