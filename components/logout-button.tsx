"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "./supabase-client";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    if (!confirm("Are you sure you want to sign out?")) return;
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push("/login");
    } catch (err) {
      console.error("Logout error:", err);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
      title="Sign out"
      style={{
        WebkitAppearance: "none",
        appearance: "none",
        backgroundColor: "#dc2626",
        border: "none",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {loading ? "Signing out..." : "Sign out"}
    </button>
  );
}
