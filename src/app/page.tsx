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
import { useTranslation } from "@/contexts/LanguageContext";

const topFeatureKeys = [
  {
    icon: ShoppingCart,
    titleKey: "salesManagement",
    descKey: "salesManagementDesc",
  },
  {
    icon: Package,
    titleKey: "inventoryControl",
    descKey: "inventoryControlDesc",
  },
  {
    icon: BarChart3,
    titleKey: "financialReporting",
    descKey: "financialReportingDesc",
  },
];

const phraseKeys = [
  "posSystem",
  "inventoryManagement",
  "customerTracking",
  "financialReportingLabel",
  "multiBranchSetup",
  "smartAnalytics",
];

const statKeys = [
  { value: "10K+", labelKey: "transactions" },
  { value: "100%", labelKey: "secure" },
  { value: "99.9%", labelKey: "uptime" },
  { value: "24/7", labelKey: "support" },
];

const ctaFeatureKeys = [
  "realTimeTracking",
  "multiPaymentSupport",
  "roleBasedAccess",
  "comprehensiveReporting",
];

export default function LandingPage() {
  const { t } = useTranslation();
  const [currentPhrase, setCurrentPhrase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhrase((prev) => (prev + 1) % phraseKeys.length);
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
              {t("builtForModernRetail")}
            </div>
            <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              SSV Shop{" "}
              <span
                key={currentPhrase}
                className="inline-block bg-gradient-to-r from-[#d4a843] to-[#c49a38] bg-clip-text text-transparent animate-[fadeIn_0.5s_ease-in-out]"
              >
                {t(phraseKeys[currentPhrase] as any)}
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#9090a0]">
              {t("heroDescription")}
            </p>
            {/* Hero Visual */}
            <div className="mx-auto mt-12 max-w-3xl">
              <div className="relative rounded-2xl border border-[#2a2a3a] bg-[#111118]/80 p-1 shadow-2xl shadow-[#d4a843]/5">
                <div className="rounded-xl bg-[#16161f] p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-3 w-3 rounded-full bg-[#f43f5e]" />
                    <div className="h-3 w-3 rounded-full bg-[#f59e0b]" />
                    <div className="h-3 w-3 rounded-full bg-[#10b981]" />
                    <span className="ml-2 text-xs text-[#606070]">SSV Shop POS Terminal</span>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {["Coffee", "Shirt", "Phone", "Book", "耳机", "Watch", "Bag", "Shoes"].map((item, i) => (
                      <div key={i} className="rounded-lg border border-[#2a2a3a] bg-[#1c1c28] p-3 text-center transition-all hover:border-[#d4a843]/30">
                        <div className={`mx-auto mb-2 h-10 w-10 rounded-lg bg-gradient-to-br ${
                          ["from-[#d4a843]/20 to-[#d4a843]/5", "from-[#3b82f6]/20 to-[#3b82f6]/5", "from-[#8b5cf6]/20 to-[#8b5cf6]/5", "from-[#10b981]/20 to-[#10b981]/5",
                           "from-[#f43f5e]/20 to-[#f43f5e]/5", "from-[#f59e0b]/20 to-[#f59e0b]/5", "from-[#06b6d4]/20 to-[#06b6d4]/5", "from-[#ec4899]/20 to-[#ec4899]/5"][i]
                        }`} />
                        <p className="text-xs text-[#9090a0]">{item}</p>
                        <p className="text-xs font-semibold text-[#d4a843]">₦{(Math.random() * 5000 + 500).toFixed(0)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/dashboard/owner"
                className="btn btn-primary btn-lg group"
              >
                {t("goToDashboard")}
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
              <Link href="/features" className="btn btn-secondary btn-lg">
                {t("exploreFeatures")}
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
              {t("everythingYouNeed")}{" "}
              <span className="text-[#d4a843]">{t("runYourBusiness")}</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[#9090a0]">
              {t("streamlineOperations")}
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {topFeatureKeys.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.titleKey}
                  className="feature-card group cursor-default"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4a843]/15 to-[#3b82f6]/10 text-[#d4a843] transition-colors group-hover:from-[#d4a843]/25 group-hover:to-[#3b82f6]/15">
                    <Icon size={22} />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-[#f0f0f5]">
                    {t(feature.titleKey as any)}
                  </h3>
                  <p className="text-sm leading-relaxed text-[#9090a0]">
                    {t(feature.descKey as any)}
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
              {t("viewAllFeatures")}
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
            {statKeys.map((stat) => (
              <div key={stat.labelKey} className="text-center">
                <div className="text-3xl font-bold text-[#d4a843] sm:text-4xl">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-[#9090a0]">{t(stat.labelKey as any)}</div>
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
              {t("readyToTransform")}
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-[#9090a0]">
              {t("joinHundreds")}
            </p>
            <div className="relative mx-auto mt-8 grid max-w-lg gap-3 text-left sm:grid-cols-2">
              {ctaFeatureKeys.map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm text-[#9090a0]">
                  <Check size={16} className="text-[#d4a843]" />
                  {t(f as any)}
                </div>
              ))}
            </div>
            <div className="relative mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/dashboard/owner"
                className="btn btn-primary btn-lg group"
              >
                {t("getStartedFree")}
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
              <Link href="/pricing" className="btn btn-secondary btn-lg">
                {t("requestQuote")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
