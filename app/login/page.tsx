"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { getSupabaseClient } from "@/components/supabase-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Use server-side login endpoint to set session cookies
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "same-origin",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Login failed");
      }

      // Successful login - redirect to home
      router.push("/");
    } catch (err) {
      console.error("Login error:", err);
      setError(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-slate-100 p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-md">
        <div className="mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Logo banner */}
          <div className="bg-white px-8 pt-8 pb-4 flex items-center justify-center border-b border-slate-100">
            <img
              src="/rectangle ben.png"
              alt="The Benjamites Network Ltd"
              className="h-16 w-auto object-contain"
            />
          </div>

          <div className="px-8 py-7">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">
              Admin Sign in
            </h1>
            <p className="text-sm text-slate-500 mb-6">
              Sign in with your admin email and password
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 pr-10 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
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
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-400 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors mt-2"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <div className="mt-5 pt-5 border-t border-slate-100">
              <p className="text-sm text-slate-500 mb-3 text-center">
                Are you a customer?
              </p>
              <Link
                href="/customer-login"
                className="flex items-center justify-center w-full border-2 border-teal-600 text-teal-700 hover:bg-teal-50 active:bg-teal-100 font-semibold px-4 py-2.5 rounded-lg transition-colors text-sm"
              >
                Customer Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
