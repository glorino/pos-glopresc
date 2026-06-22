import type { Metadata } from "next";
import Providers from "@/components/providers/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Glopresc POS — Modern Point of Sale System",
  description:
    "Glopresc POS is a modern point-of-sale system built for growing businesses in Nigeria. Manage sales, inventory, customers, and finances — all in one place.",
  keywords: [
    "POS system",
    "point of sale",
    "inventory management",
    "sales tracking",
    "business management",
    "Nigeria POS",
    "Glopresc",
  ],
  openGraph: {
    title: "Glopresc POS — Modern Point of Sale System",
    description:
      "The all-in-one POS platform for growing businesses. Sales, inventory, customers, and financial reporting.",
    siteName: "Glopresc POS",
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
      <body className="min-h-screen bg-[#0a0a0f] text-[#f0f0f5] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
