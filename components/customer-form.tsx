"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "./supabase-client";

interface CustomerFormProps {
  initialData?: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    account_name?: string;
    account_number?: string;
    bank_name?: string;
    guarantor1_name?: string;
    guarantor1_phone?: string;
    guarantor1_address?: string;
    guarantor2_name?: string;
    guarantor2_phone?: string;
    guarantor2_address?: string;
  };
  customerId?: string;
  onSuccess?: () => void;
}

export default function CustomerForm({
  initialData,
  customerId,
  onSuccess,
}: CustomerFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    account_name: "",
    account_number: "",
    bank_name: "",
    guarantor1_name: "",
    guarantor1_phone: "",
    guarantor1_address: "",
    guarantor2_name: "",
    guarantor2_phone: "",
    guarantor2_address: "",
  });

  useEffect(() => {
    if (initialData) setFormData((prev) => ({ ...prev, ...initialData }));
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();
      if (customerId) {
        const { error: updateError } = await supabase
          .from("customers")
          .update(formData)
          .eq("id", customerId);

        if (updateError) throw updateError;

        if (onSuccess) onSuccess();
        else router.refresh();
      } else {
        const { error: insertError } = await supabase
          .from("customers")
          .insert([formData]);

        if (insertError) throw insertError;

        router.push("/");
        router.refresh();
      }
    } catch (err) {
      console.error("Error adding customer:", err);
      setError(err instanceof Error ? err.message : "Failed to add customer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
      <div>
        <label
          htmlFor="name"
          className="block text-base md:text-lg font-semibold text-slate-700 mb-2 md:mb-3"
        >
          Customer Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full px-3 sm:px-4 py-3 text-base md:text-lg border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-h-11"
          placeholder="Enter customer name"
        />
      </div>

      <div>
        <label
          htmlFor="phone"
          className="block text-base md:text-lg font-semibold text-slate-700 mb-2 md:mb-3"
        >
          Phone
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="w-full px-3 sm:px-4 py-3 text-base md:text-lg border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-h-11"
          placeholder="Enter phone number"
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-base md:text-lg font-semibold text-slate-700 mb-2 md:mb-3"
        >
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full px-3 sm:px-4 py-3 text-base md:text-lg border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-h-11"
          placeholder="Enter email address"
        />
      </div>

      <div>
        <label
          htmlFor="address"
          className="block text-base md:text-lg font-semibold text-slate-700 mb-2 md:mb-3"
        >
          Address
        </label>
        <textarea
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 sm:px-4 py-3 text-base md:text-lg border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          placeholder="Enter customer address"
        />
      </div>

      {/* Repayment Account Section */}
      <div className="mt-6 pt-6 border-t-2 border-slate-200">
        <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-4">
          Repayment Account Details
        </h3>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="account_name"
              className="block text-base md:text-lg font-semibold text-slate-700 mb-2 md:mb-3"
            >
              Account Name
            </label>
            <input
              type="text"
              id="account_name"
              name="account_name"
              value={formData.account_name}
              onChange={handleChange}
              className="w-full px-3 sm:px-4 py-3 text-base md:text-lg border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-h-11"
              placeholder="Enter account name"
            />
          </div>

          <div>
            <label
              htmlFor="account_number"
              className="block text-base md:text-lg font-semibold text-slate-700 mb-2 md:mb-3"
            >
              Account Number
            </label>
            <input
              type="text"
              id="account_number"
              name="account_number"
              value={formData.account_number}
              onChange={handleChange}
              className="w-full px-3 sm:px-4 py-3 text-base md:text-lg border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-h-11"
              placeholder="Enter account number"
            />
          </div>

          <div>
            <label
              htmlFor="bank_name"
              className="block text-base md:text-lg font-semibold text-slate-700 mb-2 md:mb-3"
            >
              Bank Name
            </label>
            <input
              type="text"
              id="bank_name"
              name="bank_name"
              value={formData.bank_name}
              onChange={handleChange}
              className="w-full px-3 sm:px-4 py-3 text-base md:text-lg border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-h-11"
              placeholder="Enter bank name"
            />
          </div>
        </div>
      </div>

      {/* Guarantor 1 Section */}
      <div className="mt-6 pt-6 border-t-2 border-slate-200">
        <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-4">
          Guarantor 1 Information
        </h3>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="guarantor1_name"
              className="block text-base md:text-lg font-semibold text-slate-700 mb-2 md:mb-3"
            >
              Name
            </label>
            <input
              type="text"
              id="guarantor1_name"
              name="guarantor1_name"
              value={formData.guarantor1_name}
              onChange={handleChange}
              className="w-full px-3 sm:px-4 py-3 text-base md:text-lg border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-h-11"
              placeholder="Enter guarantor name"
            />
          </div>

          <div>
            <label
              htmlFor="guarantor1_phone"
              className="block text-base md:text-lg font-semibold text-slate-700 mb-2 md:mb-3"
            >
              Phone
            </label>
            <input
              type="tel"
              id="guarantor1_phone"
              name="guarantor1_phone"
              value={formData.guarantor1_phone}
              onChange={handleChange}
              className="w-full px-3 sm:px-4 py-3 text-base md:text-lg border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-h-11"
              placeholder="Enter guarantor phone"
            />
          </div>

          <div>
            <label
              htmlFor="guarantor1_address"
              className="block text-base md:text-lg font-semibold text-slate-700 mb-2 md:mb-3"
            >
              Address
            </label>
            <textarea
              id="guarantor1_address"
              name="guarantor1_address"
              value={formData.guarantor1_address}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 sm:px-4 py-3 text-base md:text-lg border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="Enter guarantor address"
            />
          </div>
        </div>
      </div>

      {/* Guarantor 2 Section */}
      <div className="mt-6 pt-6 border-t-2 border-slate-200">
        <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-4">
          Guarantor 2 Information
        </h3>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="guarantor2_name"
              className="block text-base md:text-lg font-semibold text-slate-700 mb-2 md:mb-3"
            >
              Name
            </label>
            <input
              type="text"
              id="guarantor2_name"
              name="guarantor2_name"
              value={formData.guarantor2_name}
              onChange={handleChange}
              className="w-full px-3 sm:px-4 py-3 text-base md:text-lg border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-h-11"
              placeholder="Enter guarantor name"
            />
          </div>

          <div>
            <label
              htmlFor="guarantor2_phone"
              className="block text-base md:text-lg font-semibold text-slate-700 mb-2 md:mb-3"
            >
              Phone
            </label>
            <input
              type="tel"
              id="guarantor2_phone"
              name="guarantor2_phone"
              value={formData.guarantor2_phone}
              onChange={handleChange}
              className="w-full px-3 sm:px-4 py-3 text-base md:text-lg border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-h-11"
              placeholder="Enter guarantor phone"
            />
          </div>

          <div>
            <label
              htmlFor="guarantor2_address"
              className="block text-base md:text-lg font-semibold text-slate-700 mb-2 md:mb-3"
            >
              Address
            </label>
            <textarea
              id="guarantor2_address"
              name="guarantor2_address"
              value={formData.guarantor2_address}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 sm:px-4 py-3 text-base md:text-lg border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="Enter guarantor address"
            />
          </div>
        </div>
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
          ? customerId
            ? "Saving..."
            : "Adding..."
          : customerId
          ? "Save Changes"
          : "Add Customer"}
      </button>
    </form>
  );
}
