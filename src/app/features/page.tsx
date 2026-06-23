import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Features — SSV Shop POS",
  description:
    "Explore all features of SSV Shop POS: sales management, inventory control, customer tracking, procurement, accounting, reporting, and multi-branch support.",
};

interface FeatureItem {
  icon: React.ElementType;
  title: string;
  description: string;
}

const sections: { id: string; title: string; description: string; features: FeatureItem[] }[] = [
  {
    id: "pos",
    title: "Point of Sale",
    description: "Fast, reliable transaction processing for every checkout.",
    features: [
      { icon: ShoppingCart, title: "Quick Checkout", description: "Process sales in seconds with an intuitive terminal designed for speed and accuracy." },
      { icon: CreditCard, title: "Multiple Payment Methods", description: "Accept cash, cards, bank transfers, USSD, mobile wallets, and QR payments." },
      { icon: Receipt, title: "Receipt Generation", description: "Auto-generate and print digital or paper receipts for every transaction." },
      { icon: Tag, title: "Discounts & Promotions", description: "Apply percentage or fixed discounts, run promotions, and manage coupon codes." },
      { icon: RefreshCw, title: "Returns & Refunds", description: "Handle returns and partial refunds with a clear audit trail." },
      { icon: Smartphone, title: "Mobile POS", description: "Sell from anywhere using a tablet or phone with our responsive terminal." },
    ],
  },
  {
    id: "inventory",
    title: "Inventory Management",
    description: "Keep track of every item across your stockroom and shelves.",
    features: [
      { icon: Package, title: "Product Catalog", description: "Organize products with variants, categories, images, barcodes, and custom attributes." },
      { icon: Warehouse, title: "Stock Tracking", description: "Monitor stock levels in real-time across all locations with automatic adjustments." },
      { icon: AlertTriangle, title: "Low Stock Alerts", description: "Get notified when inventory drops below your configured thresholds." },
      { icon: Truck, title: "Supplier Management", description: "Maintain a supplier directory and streamline your procurement workflow." },
      { icon: ClipboardList, title: "Purchase Orders", description: "Create, track, and receive purchase orders to keep shelves stocked." },
      { icon: Layers, title: "Stock Transfers", description: "Move inventory between branches with full tracking and approval workflows." },
    ],
  },
  {
    id: "sales",
    title: "Sales & Customers",
    description: "Build relationships and drive repeat business.",
    features: [
      { icon: Users, title: "Customer Profiles", description: "Store contact details, purchase history, and preferences for each customer." },
      { icon: TrendingUp, title: "Sales Tracking", description: "Monitor daily, weekly, and monthly sales with real-time dashboards." },
      { icon: UserCheck, title: "Loyalty Program", description: "Reward repeat customers with points, tiers, and special offers." },
      { icon: Bell, title: "Customer Notifications", description: "Send SMS or email notifications for orders, promotions, and account updates." },
      { icon: BarChart3, title: "Sales Analytics", description: "Identify top-selling products, peak hours, and revenue trends." },
      { icon: Clock, title: "Transaction History", description: "Access a complete, searchable log of every transaction with filters." },
    ],
  },
  {
    id: "procurement",
    title: "Procurement",
    description: "Streamline your purchasing from request to delivery.",
    features: [
      { icon: Truck, title: "Vendor Management", description: "Track vendor performance, pricing, and lead times in one place." },
      { icon: ClipboardList, title: "Requisition Workflows", description: "Route purchase requests through approval chains before orders are placed." },
      { icon: FileText, title: "Invoice Matching", description: "Automatically match incoming invoices against purchase orders and receipts." },
      { icon: RefreshCw, title: "Automated Reordering", description: "Trigger reorder points based on sales velocity and stock thresholds." },
    ],
  },
  {
    id: "accounting",
    title: "Accounting & Finance",
    description: "Keep your books balanced without the complexity.",
    features: [
      { icon: Receipt, title: "Expense Tracking", description: "Log and categorize business expenses with receipt attachments." },
      { icon: BarChart3, title: "Profit & Loss", description: "Generate P&L statements filtered by date range, branch, or category." },
      { icon: Database, title: "Cash Flow Management", description: "Track money in and out with projected cash flow forecasts." },
      { icon: FileText, title: "Tax Reporting", description: "Automate VAT calculations and generate tax-ready reports." },
      { icon: CreditCard, title: "Payment Reconciliation", description: "Match payments received against invoices to identify discrepancies." },
    ],
  },
  {
    id: "reporting",
    title: "Reporting & Analytics",
    description: "Turn data into actionable insights.",
    features: [
      { icon: BarChart3, title: "Sales Reports", description: "Detailed breakdowns by product, category, cashier, payment method, and time period." },
      { icon: TrendingUp, title: "Inventory Reports", description: "Stock valuation, movement history, shrinkage, and turnover analysis." },
      { icon: FileText, title: "Financial Reports", description: "Balance sheets, cash flow statements, and expense summaries on demand." },
      { icon: Globe, title: "Multi-Branch Reports", description: "Compare performance across locations with consolidated and per-branch views." },
      { icon: Zap, title: "Custom Dashboards", description: "Build personalized dashboards with the KPIs that matter to your role." },
    ],
  },
  {
    id: "multi-branch",
    title: "Multi-Branch & Access",
    description: "Scale your business while maintaining control.",
    features: [
      { icon: GitBranch, title: "Multi-Branch Support", description: "Manage multiple locations from a single account with centralized reporting." },
      { icon: Shield, title: "Role-Based Access", description: "Granular permissions for owners, managers, cashiers, accountants, and more." },
      { icon: Lock, title: "Audit Logs", description: "Track every action taken in the system with timestamped, user-attributed logs." },
      { icon: Settings, title: "Branch Settings", description: "Configure tax rates, receipt templates, and payment options per location." },
      { icon: Headphones, title: "24/7 Support", description: "Reach our support team anytime via chat, email, or phone." },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <PublicHeader />

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d4a843]/20 bg-[#d4a843]/10 px-4 py-1.5 text-sm font-medium text-[#d4a843]">
              <Activity size={14} />
              Powerful Features
            </div>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Everything You Need to{" "}
              <span className="bg-gradient-to-r from-[#d4a843] to-[#c49a38] bg-clip-text text-transparent">
                Run Your Business
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-[#9090a0]">
              From point of sale to financial reporting, SSV Shop gives you the
              tools to manage every aspect of your retail operations.
            </p>
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
                {section.title}
              </h2>
              <p className="mt-2 max-w-xl text-[#9090a0]">
                {section.description}
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {section.features.map((feature) => {
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
          </div>
        </section>
      ))}

      <PublicFooter />
    </div>
  );
}
