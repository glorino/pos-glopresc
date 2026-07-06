import type { Metadata } from "next";
import Providers from "@/components/providers/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "FFB Food Hub — Point of Sale System",
  description:
    "FFB Food Hub is a complete point-of-sale system. Manage sales, inventory, customers, and finances — all in one place.",
  keywords: [
    "POS system",
    "point of sale",
    "inventory management",
    "sales tracking",
    "business management",
    "global POS",
    "FFB Food Hub",
  ],
  openGraph: {
    title: "FFB Food Hub — Point of Sale System",
    description:
      "The all-in-one POS platform. Sales, inventory, customers, and financial reporting.",
    siteName: "FFB Food Hub",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body className="min-h-screen bg-[#0a0a0f] text-[#f0f0f5] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
