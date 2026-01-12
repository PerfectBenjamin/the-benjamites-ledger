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

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this customer? This will remove all their transactions."
      )
    )
      return;
    setLoading(true);
    try {
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
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
  );
}
