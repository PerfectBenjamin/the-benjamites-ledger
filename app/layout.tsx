import type React from "react";
import type { Metadata } from "next";
import { Josefin_Sans } from "next/font/google";
// Temporarily disabled Vercel Analytics — Netlify may throw server-side errors
// when loading this integration outside Vercel. Re-enable if running on Vercel.
// import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
const josefin = Josefin_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Benjamites Ledger",
  description: "Manage your customer debts and payments",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "The Benjamites Ledger",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.png" />
      </head>
      <body className={`${josefin.className} antialiased`}>{children}</body>
    </html>
  );
}
