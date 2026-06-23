"use client";

import React from "react";
import Image from "next/image";
import {
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Shield,
  Activity,
  CreditCard,
  Truck,
  RefreshCw,
  Receipt,
  Layers,
  GitBranch,
  ClipboardList,
  AlertTriangle,
  Warehouse,
  FileText,
  TrendingUp,
  UserCheck,
  Clock,
  Settings,
  Bell,
  Tag,
  Smartphone,
  Globe,
  Zap,
  Database,
  Lock,
  Headphones,
} from "lucide-react";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";
import { useTranslation } from "@/contexts/LanguageContext";

interface FeatureItem {
  icon: React.ElementType;
  titleKey: string;
  descKey: string;
}

const sections: { id: string; titleKey: string; descKey: string; image: string; features: FeatureItem[] }[] = [
  {
    id: "pos",
    titleKey: "featuresPosTitle",
    descKey: "featuresPosDesc",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop",
    features: [
      { icon: ShoppingCart, titleKey: "featuresPosQuickCheckout", descKey: "featuresPosQuickCheckoutDesc" },
      { icon: CreditCard, titleKey: "featuresPosMultiplePayment", descKey: "featuresPosMultiplePaymentDesc" },
      { icon: Receipt, titleKey: "featuresPosReceipt", descKey: "featuresPosReceiptDesc" },
      { icon: Tag, titleKey: "featuresPosDiscounts", descKey: "featuresPosDiscountsDesc" },
      { icon: RefreshCw, titleKey: "featuresPosReturns", descKey: "featuresPosReturnsDesc" },
      { icon: Smartphone, titleKey: "featuresPosMobile", descKey: "featuresPosMobileDesc" },
    ],
  },
  {
    id: "inventory",
    titleKey: "featuresInvTitle",
    descKey: "featuresInvDesc",
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=400&fit=crop",
    features: [
      { icon: Package, titleKey: "featuresInvCatalog", descKey: "featuresInvCatalogDesc" },
      { icon: Warehouse, titleKey: "featuresInvStockTracking", descKey: "featuresInvStockTrackingDesc" },
      { icon: AlertTriangle, titleKey: "featuresInvLowStock", descKey: "featuresInvLowStockDesc" },
      { icon: Truck, titleKey: "featuresInvSupplier", descKey: "featuresInvSupplierDesc" },
      { icon: ClipboardList, titleKey: "featuresInvPurchase", descKey: "featuresInvPurchaseDesc" },
      { icon: Layers, titleKey: "featuresInvTransfers", descKey: "featuresInvTransfersDesc" },
    ],
  },
  {
    id: "sales",
    titleKey: "featuresSalesTitle",
    descKey: "featuresSalesDesc",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop",
    features: [
      { icon: Users, titleKey: "featuresSalesProfiles", descKey: "featuresSalesProfilesDesc" },
      { icon: TrendingUp, titleKey: "featuresSalesTracking", descKey: "featuresSalesTrackingDesc" },
      { icon: UserCheck, titleKey: "featuresSalesLoyalty", descKey: "featuresSalesLoyaltyDesc" },
      { icon: Bell, titleKey: "featuresSalesNotifications", descKey: "featuresSalesNotificationsDesc" },
      { icon: BarChart3, titleKey: "featuresSalesAnalytics", descKey: "featuresSalesAnalyticsDesc" },
      { icon: Clock, titleKey: "featuresSalesHistory", descKey: "featuresSalesHistoryDesc" },
    ],
  },
  {
    id: "procurement",
    titleKey: "featuresProcTitle",
    descKey: "featuresProcDesc",
    image: "https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&h=400&fit=crop",
    features: [
      { icon: Truck, titleKey: "featuresProcVendor", descKey: "featuresProcVendorDesc" },
      { icon: ClipboardList, titleKey: "featuresProcRequisition", descKey: "featuresProcRequisitionDesc" },
      { icon: FileText, titleKey: "featuresProcInvoice", descKey: "featuresProcInvoiceDesc" },
      { icon: RefreshCw, titleKey: "featuresProcReorder", descKey: "featuresProcReorderDesc" },
    ],
  },
  {
    id: "accounting",
    titleKey: "featuresAccTitle",
    descKey: "featuresAccDesc",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=400&fit=crop",
    features: [
      { icon: Receipt, titleKey: "featuresAccExpense", descKey: "featuresAccExpenseDesc" },
      { icon: BarChart3, titleKey: "featuresAccProfit", descKey: "featuresAccProfitDesc" },
      { icon: Database, titleKey: "featuresAccCashFlow", descKey: "featuresAccCashFlowDesc" },
      { icon: FileText, titleKey: "featuresAccTax", descKey: "featuresAccTaxDesc" },
      { icon: CreditCard, titleKey: "featuresAccReconciliation", descKey: "featuresAccReconciliationDesc" },
    ],
  },
  {
    id: "reporting",
    titleKey: "featuresReportTitle",
    descKey: "featuresReportDesc",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop",
    features: [
      { icon: BarChart3, titleKey: "featuresReportSales", descKey: "featuresReportSalesDesc" },
      { icon: TrendingUp, titleKey: "featuresReportInventory", descKey: "featuresReportInventoryDesc" },
      { icon: FileText, titleKey: "featuresReportFinancial", descKey: "featuresReportFinancialDesc" },
      { icon: Globe, titleKey: "featuresReportMultiBranch", descKey: "featuresReportMultiBranchDesc" },
      { icon: Zap, titleKey: "featuresReportDashboards", descKey: "featuresReportDashboardsDesc" },
    ],
  },
  {
    id: "multi-branch",
    titleKey: "featuresMultiTitle",
    descKey: "featuresMultiDesc",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=400&fit=crop",
    features: [
      { icon: GitBranch, titleKey: "featuresMultiSupport", descKey: "featuresMultiSupportDesc" },
      { icon: Shield, titleKey: "featuresMultiAccess", descKey: "featuresMultiAccessDesc" },
      { icon: Lock, titleKey: "featuresMultiAudit", descKey: "featuresMultiAuditDesc" },
      { icon: Settings, titleKey: "featuresMultiBranchSettings", descKey: "featuresMultiBranchSettingsDesc" },
      { icon: Headphones, titleKey: "featuresMultiSupport247", descKey: "featuresMultiSupport247Desc" },
    ],
  },
];

export default function FeaturesPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <PublicHeader />

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d4a843]/20 bg-[#d4a843]/10 px-4 py-1.5 text-sm font-medium text-[#d4a843] animate-fade-in-down">
                <Activity size={14} />
                {t("powerfulFeatures")}
              </div>
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl animate-fade-in-up">
                {t("everythingYouNeed")}{" "}
                <span className="bg-gradient-to-r from-[#d4a843] to-[#c49a38] bg-clip-text text-transparent">
                  {t("runYourBusiness")}
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-lg text-[#9090a0] animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                {t("featuresHeroDesc")}
              </p>
              <div className="mt-8 flex flex-wrap gap-3 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                {sections.slice(0, 4).map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="rounded-lg border border-[#2a2a3a] bg-[#1c1c28]/50 px-3 py-1.5 text-xs font-medium text-[#9090a0] transition-all hover:border-[#d4a843]/30 hover:text-[#d4a843]"
                  >
                    {t(s.titleKey as any)}
                  </a>
                ))}
              </div>
            </div>
            <div className="relative hidden lg:block animate-fade-in-right">
              <div className="overflow-hidden rounded-2xl border border-[#2a2a3a] shadow-2xl shadow-[#d4a843]/10">
                <Image
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=500&fit=crop"
                  alt="Features Dashboard"
                  width={800}
                  height={500}
                  className="h-[400px] w-full object-cover"
                  unoptimized
                />
              </div>
              <div className="absolute -bottom-6 -left-6 grid grid-cols-2 gap-3">
                {[Shield, Zap, Users, Globe].map((Icon, i) => (
                  <div key={i} className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#2a2a3a] bg-[#111118]/90 text-[#d4a843] shadow-lg backdrop-blur-xl animate-float" style={{ animationDelay: `${i * 0.15}s` }}>
                    <Icon size={20} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-[#d4a843]/5 blur-[120px]" />
      </section>

      {/* ── Feature Sections ───────────────────────────────── */}
      {sections.map((section, idx) => (
        <section
          key={section.id}
          id={section.id}
          className={`relative py-20 ${idx % 2 === 1 ? "bg-[#111118]/30" : ""}`}
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className={`grid items-center gap-12 ${idx % 2 === 0 ? "lg:grid-cols-[1fr_1.2fr]" : "lg:grid-cols-[1.2fr_1fr]"}`}>
              <div className={idx % 2 === 0 ? "order-1" : "order-2"}>
                <h2 className="text-2xl font-bold sm:text-3xl">
                  {t(section.titleKey as any)}
                </h2>
                <p className="mt-3 max-w-xl text-[#9090a0]">
                  {t(section.descKey as any)}
                </p>
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {section.features.map((feature) => {
                    const Icon = feature.icon;
                    return (
                      <div
                        key={feature.titleKey}
                        className="group flex gap-3"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4a843]/15 to-[#3b82f6]/10 text-[#d4a843] transition-colors group-hover:from-[#d4a843]/25 group-hover:to-[#3b82f6]/15">
                          <Icon size={18} />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-[#f0f0f5]">
                            {t(feature.titleKey as any)}
                          </h3>
                          <p className="mt-0.5 text-xs leading-relaxed text-[#9090a0]">
                            {t(feature.descKey as any)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className={`${idx % 2 === 0 ? "order-2" : "order-1"} relative hidden lg:block`}>
                <div className="overflow-hidden rounded-2xl border border-[#2a2a3a] shadow-xl">
                  <Image
                    src={section.image}
                    alt={t(section.titleKey as any)}
                    width={800}
                    height={400}
                    className="h-[350px] w-full object-cover"
                    unoptimized
                  />
                </div>
                <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-2xl bg-gradient-to-br from-[#d4a843]/10 to-[#3b82f6]/10 blur-2xl" />
              </div>
            </div>
          </div>
        </section>
      ))}

      <PublicFooter />
    </div>
  );
}
