import type { Metadata } from "next";
import Providers from "@/components/providers/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "SSV Shop POS — Point of Sale System",
  description:
    "SSV Shop POS is a complete point-of-sale system. Manage sales, inventory, customers, and finances — all in one place.",
  keywords: [
    "POS system",
    "point of sale",
    "inventory management",
    "sales tracking",
    "business management",
    "Nigeria POS",
    "SSV Shop",
  ],
  openGraph: {
    title: "SSV Shop POS — Point of Sale System",
    description:
      "The all-in-one POS platform. Sales, inventory, customers, and financial reporting.",
    siteName: "SSV Shop POS",
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
