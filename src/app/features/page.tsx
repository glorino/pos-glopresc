"use client";

import React from "react";
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

const sections: { id: string; titleKey: string; descKey: string; features: FeatureItem[] }[] = [
  {
    id: "pos",
    titleKey: "featuresPosTitle",
    descKey: "featuresPosDesc",
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
          <div className="text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d4a843]/20 bg-[#d4a843]/10 px-4 py-1.5 text-sm font-medium text-[#d4a843]">
              <Activity size={14} />
              {t("powerfulFeatures")}
            </div>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              {t("everythingYouNeed")}{" "}
              <span className="bg-gradient-to-r from-[#d4a843] to-[#c49a38] bg-clip-text text-transparent">
                {t("runYourBusiness")}
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-[#9090a0]">
              {t("featuresHeroDesc")}
            </p>
            {/* Features Hero Visual */}
            <div className="mx-auto mt-10 flex justify-center gap-4">
              {[ShoppingCart, Package, BarChart3, Shield, Users].map((Icon, i) => (
                <div key={i} className={`flex h-14 w-14 items-center justify-center rounded-2xl border border-[#2a2a3a] bg-[#16161f] text-[#d4a843] shadow-lg transition-all hover:scale-110 hover:border-[#d4a843]/30`}
                  style={{ animationDelay: `${i * 0.1}s` }}>
                  <Icon size={24} />
                </div>
              ))}
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
            <div className="mb-12">
              <h2 className="text-2xl font-bold sm:text-3xl">
                {t(section.titleKey as any)}
              </h2>
              <p className="mt-2 max-w-xl text-[#9090a0]">
                {t(section.descKey as any)}
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {section.features.map((feature) => {
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
          </div>
        </section>
      ))}

      <PublicFooter />
    </div>
  );
}
