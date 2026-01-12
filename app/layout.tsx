import type React from "react";
import type { Metadata } from "next";
import { Josefin_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
const josefin = Josefin_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Debt Ledger - Cement Distributor",
  description: "Manage your customer debts and payments",
  generator: "v0.app",
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
        <Analytics />
      </body>
    </html>
  );
}
