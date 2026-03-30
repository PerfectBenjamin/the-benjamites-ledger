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
        <div className="mx-auto bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Customer Sign in
          </h1>
          <p className="text-sm text-slate-600 mb-4">
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
                className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-teal-500 uppercase"
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
                  className="w-full px-3 py-2 pr-10 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-teal-500"
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
              <div className="text-red-700 bg-red-50 p-2 rounded">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-semibold px-4 py-2 rounded-lg"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-4 text-sm text-slate-600">
            Admin?{" "}
            <Link href="/login" className="text-blue-600 hover:text-blue-700">
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
