"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Package,
  BarChart3,
  ArrowRight,
  Activity,
  Check,
} from "lucide-react";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";

const topFeatures = [
  {
    icon: ShoppingCart,
    title: "Sales Management",
    description:
      "Process transactions quickly with an intuitive interface. Support for cash, card, transfer, USSD, and mobile payments.",
  },
  {
    icon: Package,
    title: "Inventory Control",
    description:
      "Track stock levels in real-time. Set minimum thresholds, manage suppliers, and automate purchase orders.",
  },
  {
    icon: BarChart3,
    title: "Financial Reporting",
    description:
      "Generate comprehensive reports on sales, expenses, profits, and cash flow. Export to PDF or Excel.",
  },
];

const phrases = [
  "Point of Sale System",
  "Inventory Management",
  "Customer Tracking",
  "Financial Reporting",
  "Multi-Branch Setup",
  "Smart Analytics",
];

const stats = [
  { value: "10K+", label: "Transactions" },
  { value: "100%", label: "Secure" },
  { value: "99.9%", label: "Uptime" },
  { value: "24/7", label: "Support" },
];

const ctaFeatures = [
  "Real-time inventory tracking",
  "Multi-payment support",
  "Role-based access control",
  "Comprehensive reporting",
];

export default function LandingPage() {
  const [currentPhrase, setCurrentPhrase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhrase((prev) => (prev + 1) % phrases.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <PublicHeader />

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d4a843]/20 bg-[#d4a843]/10 px-4 py-1.5 text-sm font-medium text-[#d4a843]">
              <Activity size={14} />
              Built for Nigerian Businesses
            </div>
            <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              SSV Shop{" "}
              <span
                key={currentPhrase}
                className="inline-block bg-gradient-to-r from-[#d4a843] to-[#c49a38] bg-clip-text text-transparent animate-[fadeIn_0.5s_ease-in-out]"
              >
                {phrases[currentPhrase]}
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#9090a0]">
              Manage sales, inventory, customers, and finances in one place.
              Everything you need to run your retail business — from sales and
              inventory to customer management and financial reporting.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/dashboard/owner"
                className="btn btn-primary btn-lg group"
              >
                Go to Dashboard
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
              <Link href="/features" className="btn btn-secondary btn-lg">
                Explore Features
              </Link>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-[#d4a843]/5 blur-[120px]" />
      </section>

      {/* ── Feature Preview ────────────────────────────────── */}
      <section className="relative py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Everything You Need to{" "}
              <span className="text-[#d4a843]">Run Your Business</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[#9090a0]">
              Streamline operations, boost efficiency, and make smarter
              decisions with our powerful POS platform.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {topFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="feature-card group cursor-default"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4a843]/15 to-[#3b82f6]/10 text-[#d4a843] transition-colors group-hover:from-[#d4a843]/25 group-hover:to-[#3b82f6]/15">
                    <Icon size={22} />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-[#f0f0f5]">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[#9090a0]">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="mt-12 text-center">
            <Link
              href="/features"
              className="btn btn-secondary group inline-flex items-center gap-2"
            >
              View All Features
              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────── */}
      <section className="border-y border-[#2a2a3a] bg-[#111118]/50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-[#d4a843] sm:text-4xl">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-[#9090a0]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section className="relative py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="glass-card relative overflow-hidden px-8 py-16 text-center sm:px-16">
            <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-[#d4a843]/10 blur-[80px]" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-[#3b82f6]/10 blur-[80px]" />
            <h2 className="relative text-3xl font-bold sm:text-4xl">
              Ready to Transform Your Business?
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-[#9090a0]">
              Join hundreds of businesses using SSV Shop to streamline their
              operations and boost profitability.
            </p>
            <div className="relative mx-auto mt-8 grid max-w-lg gap-3 text-left sm:grid-cols-2">
              {ctaFeatures.map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm text-[#9090a0]">
                  <Check size={16} className="text-[#d4a843]" />
                  {f}
                </div>
              ))}
            </div>
            <div className="relative mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/dashboard/owner"
                className="btn btn-primary btn-lg group"
              >
                Get Started Free
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
              <Link href="/pricing" className="btn btn-secondary btn-lg">
                Request a Quote
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
