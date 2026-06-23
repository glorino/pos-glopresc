"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingCart,
  Package,
  BarChart3,
  ArrowRight,
  Activity,
  Check,
  Shield,
  Zap,
  Globe,
  Users,
} from "lucide-react";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";
import { useTranslation } from "@/contexts/LanguageContext";

const topFeatureKeys = [
  {
    icon: ShoppingCart,
    titleKey: "salesManagement",
    descKey: "salesManagementDesc",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop",
  },
  {
    icon: Package,
    titleKey: "inventoryControl",
    descKey: "inventoryControlDesc",
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&h=400&fit=crop",
  },
  {
    icon: BarChart3,
    titleKey: "financialReporting",
    descKey: "financialReportingDesc",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop",
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

const showcaseImages = [
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1556742111-a301076d9d18?w=800&h=500&fit=crop",
];

export default function LandingPage() {
  const { t } = useTranslation();
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhrase((prev) => (prev + 1) % phraseKeys.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % showcaseImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <PublicHeader />

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d4a843]/20 bg-[#d4a843]/10 px-4 py-1.5 text-sm font-medium text-[#d4a843] animate-fade-in-down">
                <Activity size={14} />
                {t("builtForModernRetail")}
              </div>
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl animate-fade-in-up">
                SSV Shop{" "}
                <span
                  key={currentPhrase}
                  className="inline-block bg-gradient-to-r from-[#d4a843] to-[#c49a38] bg-clip-text text-transparent animate-[fadeIn_0.5s_ease-in-out]"
                >
                  {t(phraseKeys[currentPhrase] as any)}
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#9090a0] animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                {t("heroDescription")}
              </p>
              <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                <Link href="/dashboard/owner" className="btn btn-primary btn-lg group">
                  {t("goToDashboard")}
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link href="/features" className="btn btn-secondary btn-lg">
                  {t("exploreFeatures")}
                </Link>
              </div>
              <div className="mt-10 flex items-center gap-6 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                <div className="flex -space-x-3">
                  {[1,2,3,4].map((i) => (
                    <div key={i} className="h-9 w-9 rounded-full border-2 border-[#0a0a0f] bg-gradient-to-br from-[#d4a843]/30 to-[#3b82f6]/30" />
                  ))}
                </div>
                <p className="text-sm text-[#9090a0]">
                  <span className="font-semibold text-[#f0f0f5]">500+</span> businesses trust SSV Shop
                </p>
              </div>
            </div>
            <div className="relative hidden lg:block animate-fade-in-right">
              <div className="relative overflow-hidden rounded-2xl border border-[#2a2a3a] shadow-2xl shadow-[#d4a843]/10">
                <Image
                  src={showcaseImages[currentImage]}
                  alt="SSV Shop Dashboard"
                  width={800}
                  height={500}
                  className="h-[420px] w-full object-cover transition-opacity duration-1000"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f]/80 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="rounded-xl border border-[#2a2a3a] bg-[#111118]/90 p-4 backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#10b981]/15">
                        <ShoppingCart size={18} className="text-[#10b981]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#f0f0f5]">New sale completed</p>
                        <p className="text-xs text-[#9090a0]">₦45,200.00 via Card</p>
                      </div>
                      <span className="ml-auto text-xs text-[#10b981]">Just now</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-2xl border border-[#2a2a3a] bg-[#111118]/90 p-4 backdrop-blur-xl animate-float">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#d4a843]/15 mb-2">
                  <BarChart3 size={16} className="text-[#d4a843]" />
                </div>
                <p className="text-xs font-semibold text-[#f0f0f5]">+24.5%</p>
                <p className="text-[10px] text-[#9090a0]">Revenue growth</p>
              </div>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-[#d4a843]/5 blur-[120px]" />
      </section>

      {/* ── Trusted By ────────────────────────────────────── */}
      <section className="border-y border-[#2a2a3a] bg-[#111118]/50 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="mb-8 text-center text-sm text-[#606070] uppercase tracking-wider">Trusted by leading retailers</p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-40">
            {["Retail Corp", "MegaMart", "ShopHub", "QuickTrade", "ValueStore"].map((name) => (
              <div key={name} className="text-lg font-bold text-[#9090a0]">{name}</div>
            ))}
          </div>
        </div>
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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
            {topFeatureKeys.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.titleKey}
                  className="feature-card group cursor-default overflow-hidden opacity-0 animate-fade-in-up"
                >
                  <div className="relative mb-5 h-44 overflow-hidden rounded-xl">
                    <Image
                      src={feature.image}
                      alt={t(feature.titleKey as any)}
                      width={600}
                      height={400}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111118] via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#d4a843]/20 backdrop-blur-sm">
                      <Icon size={20} className="text-[#d4a843]" />
                    </div>
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
            <Link href="/features" className="btn btn-secondary group inline-flex items-center gap-2">
              {t("viewAllFeatures")}
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────── */}
      <section className="relative border-y border-[#2a2a3a] bg-[#111118]/30 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              How It <span className="text-[#d4a843]">Works</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[#9090a0]">
              Get started in three simple steps
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3 stagger-children">
            {[
              { step: "01", icon: Users, title: "Create Account", desc: "Sign up and set up your business profile in minutes" },
              { step: "02", icon: Package, title: "Add Products", desc: "Import your inventory or add products manually" },
              { step: "03", icon: Zap, title: "Start Selling", desc: "Process sales, track inventory, and grow your business" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="relative text-center opacity-0 animate-fade-in-up">
                  <div className="mb-4 text-5xl font-extrabold text-[#d4a843]/15">{item.step}</div>
                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d4a843]/15 to-[#3b82f6]/10 text-[#d4a843]">
                    <Icon size={24} />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-[#f0f0f5]">{item.title}</h3>
                  <p className="text-sm text-[#9090a0]">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────── */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 stagger-children">
            {statKeys.map((stat) => (
              <div key={stat.labelKey} className="text-center opacity-0 animate-scale-in">
                <div className="text-3xl font-bold text-[#d4a843] sm:text-4xl">{stat.value}</div>
                <div className="mt-1 text-sm text-[#9090a0]">{t(stat.labelKey as any)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonial ───────────────────────────────────── */}
      <section className="relative border-y border-[#2a2a3a] bg-[#111118]/30 py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8 text-4xl text-[#d4a843]/20">&ldquo;</div>
          <p className="text-xl leading-relaxed text-[#f0f0f5] sm:text-2xl">
            SSV Shop transformed how we manage our retail business. The real-time inventory tracking and sales analytics have saved us countless hours.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#d4a843]/30 to-[#3b82f6]/30" />
            <div className="text-left">
              <p className="font-semibold text-[#f0f0f5]">Adewale SSV</p>
              <p className="text-sm text-[#9090a0]">Founder & CEO</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section className="relative py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="glass-card relative overflow-hidden px-8 py-16 text-center sm:px-16 animate-fade-in-up">
            <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-[#d4a843]/10 blur-[80px]" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-[#3b82f6]/10 blur-[80px]" />
            <h2 className="relative text-3xl font-bold sm:text-4xl">{t("readyToTransform")}</h2>
            <p className="relative mx-auto mt-4 max-w-xl text-[#9090a0]">{t("joinHundreds")}</p>
            <div className="relative mx-auto mt-8 grid max-w-lg gap-3 text-left sm:grid-cols-2">
              {ctaFeatureKeys.map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm text-[#9090a0]">
                  <Check size={16} className="text-[#d4a843]" />
                  {t(f as any)}
                </div>
              ))}
            </div>
            <div className="relative mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/dashboard/owner" className="btn btn-primary btn-lg group">
                {t("getStartedFree")}
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link href="/features" className="btn btn-secondary btn-lg">
                {t("exploreFeatures")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
