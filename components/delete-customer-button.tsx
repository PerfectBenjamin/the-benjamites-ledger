"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "./supabase-client";

interface DeleteCustomerButtonProps {
  customerId: string;
}

export default function DeleteCustomerButton({
  customerId,
}: DeleteCustomerButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");

  const handleDeleteClick = () => {
    setShowPinDialog(true);
    setPin("");
    setPinError("");
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError("");

    if (!pin) {
      setPinError("Please enter a PIN");
      return;
    }

    setLoading(true);
    try {
      // Verify PIN with API
      const response = await fetch("/api/verify-pin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pin }),
      });

      const data = await response.json();

      if (!response.ok || !data.valid) {
        setPinError("Invalid PIN. Please try again.");
        setLoading(false);
        return;
      }

      // PIN is valid, proceed with deletion
      const supabase = getSupabaseClient();
      // Delete transactions first (if you want cascade, adjust DB rules)
      const { error: txErr } = await supabase
        .from("transactions")
        .delete()
        .eq("customer_id", customerId);
      if (txErr) throw txErr;

      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", customerId);
      if (error) throw error;

      router.push("/");
    } catch (err) {
      console.error("Failed to delete customer:", err);
      alert("Failed to delete customer. See console for details.");
      setLoading(false);
    }
  };

  const handleCancelPin = () => {
    setShowPinDialog(false);
    setPin("");
    setPinError("");
  };

  return (
    <>
      <button
        type="button"
        onClick={handleDeleteClick}
        disabled={loading}
        className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
        title="Delete customer"
        style={{
          WebkitAppearance: "none",
          appearance: "none",
          backgroundColor: "#dc2626",
          border: "none",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {loading ? "Deleting..." : "Delete Customer"}
      </button>

      {/* PIN Dialog */}
      {showPinDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              Enter PIN to Delete Customer
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              This action will permanently delete this customer and all their
              transactions.
            </p>
            <form onSubmit={handlePinSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="pin"
                  className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
                >
                  PIN
                </label>
                <input
                  type="password"
                  id="pin"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter PIN"
                  autoFocus
                  disabled={loading}
                />
                {pinError && (
                  <p className="text-red-600 text-sm mt-1">{pinError}</p>
                )}
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={handleCancelPin}
                  disabled={loading}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50"
                >
                  {loading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
