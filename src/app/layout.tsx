import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Providers from "@/components/providers/Providers";
import { APP_NAME } from "@/lib/utils";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: `${APP_NAME} — Point of Sale System`,
  description:
    `${APP_NAME} is a complete point-of-sale system. Manage sales, inventory, customers, and finances — all in one place.`,
  keywords: [
    "POS system",
    "point of sale",
    "inventory management",
    "sales tracking",
    "business management",
    "global POS",
    APP_NAME,
  ],
  openGraph: {
    title: `${APP_NAME} — Point of Sale System`,
    description:
      "The all-in-one POS platform. Sales, inventory, customers, and financial reporting.",
    siteName: APP_NAME,
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
      <body className={`${inter.className} min-h-screen bg-[#0a0a0f] text-[#f0f0f5] antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
