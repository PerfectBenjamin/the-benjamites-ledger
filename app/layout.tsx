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
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${josefin.className} antialiased`}>
        {children}
        {/* Analytics temporarily removed for Netlify deployment troubleshooting */}
      </body>
    </html>
  );
}
