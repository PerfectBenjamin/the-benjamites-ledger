"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export default function CustomerLoginPage() {
  const router = useRouter();
  const [customerId, setCustomerId] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/customer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          customerId: customerId.trim().toUpperCase(),
          pin,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      if (data.requiresPinChange) {
        router.push("/customer?forcePinChange=1");
        return;
      }

      router.push("/customer");
    } catch (err) {
      console.error("Customer login failed", err);
      setError(err instanceof Error ? err.message : "Unable to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-linear-to-br from-teal-50 to-slate-100 p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-md">
        <div className="mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Logo banner */}
          <div className="bg-white px-8 pt-8 pb-4 flex items-center justify-center border-b border-slate-100">
            <img
              src="/rectangle-ben.png"
              alt="The Benjamites Network Ltd"
              className="h-16 w-auto object-contain"
            />
          </div>

          <div className="px-8 py-7">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">
              Customer Sign in
            </h1>
            <p className="text-sm text-slate-500 mb-6">
              Sign in with your customer ID and PIN to view your balance and
              transactions.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="customerId"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Customer ID
                </label>
                <input
                  id="customerId"
                  type="text"
                  value={customerId}
                  onChange={(e) =>
                    setCustomerId(
                      e.target.value
                        .replace(/\s+/g, "")
                        .replace(/[–—]/g, "-")
                        .toUpperCase(),
                    )
                  }
                  required
                  className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 transition-colors uppercase"
                  placeholder="CUS-XXXXXXXXXXXX"
                />
              </div>

              <div>
                <label
                  htmlFor="pin"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  PIN
                </label>
                <div className="relative">
                  <input
                    id="pin"
                    type={showPin ? "text" : "password"}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    required
                    maxLength={4}
                    inputMode="numeric"
                    pattern="[0-9]{4}"
                    title="Enter exactly 4 digits"
                    className="w-full px-3 py-2.5 pr-10 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 transition-colors"
                    placeholder="0000"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPin ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:bg-slate-400 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors mt-2"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <div className="mt-5 pt-5 border-t border-slate-100">
              <p className="text-sm text-slate-500 mb-3 text-center">
                Are you an admin?
              </p>
              <Link
                href="/login"
                className="flex items-center justify-center w-full border-2 border-blue-600 text-blue-700 hover:bg-blue-50 active:bg-blue-100 font-semibold px-4 py-2.5 rounded-lg transition-colors text-sm"
              >
                Admin Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
