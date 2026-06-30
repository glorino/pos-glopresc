"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { useTranslation } from "@/contexts/LanguageContext";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  User,
  RotateCcw,
  ArrowRight,
  BarChart3,
  Package,
  Eye,
} from "lucide-react";
import AIInsightPanel from "@/components/ai/AIInsightPanel";
import type { AIInsight } from "@/lib/ai-insights";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface SalesData {
  todayRevenue: number;
  todayTransactions: number;
  averageSaleValue: number;
  topCashier: string;
  returnRate: number;
  totalPayments: number;
  salesTrend: { name: string; revenue: number; transactions: number }[];
  categorySales: { name: string; value: number; color: string }[];
  topProducts: {
    name: string;
    quantity: number;
    revenue: number;
  }[];
  recentTransactions: {
    id: string;
    invoiceNumber: string;
    customer: string;
    total: number;
    createdAt: string;
    status: string;
    paymentMethod: string;
  }[];
}

const PIE_COLORS = ["#d4a843", "#3b82f6", "#8b5cf6", "#10b981", "#f43f5e", "#06b6d4"];

export default function SalesManagerDashboard() {
  const { t } = useTranslation();
  const [data, setData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const params = new URLSearchParams();
        if (dateFrom) params.set("dateFrom", dateFrom);
        if (dateTo) params.set("dateTo", dateTo);
        const res = await fetch(`/api/dashboard/sales-manager?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          setData({
            todayRevenue: json.todayRevenue ?? 0,
            todayTransactions: json.todayTransactions ?? 0,
            averageSaleValue: json.averageSaleValue ?? 0,
            topCashier: json.topCashier ?? "N/A",
            returnRate: json.returnRate ?? 0,
            totalPayments: json.totalPayments ?? 0,
            salesTrend: json.salesTrend ?? [],
            categorySales: json.categorySales ?? [],
            topProducts: json.topProducts ?? [],
            recentTransactions: json.recentTransactions ?? [],
          });
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetch("/api/ai-insights").then(r => r.json()).then(d => setInsights(d.insights ?? []));
  }, []);

  if (loading) {
    return (
      <DashboardLayout title={t("salesManagerDashboard")}>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4a843] border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  const stats = [
    {
      label: t("todayRevenue"),
      value: formatCurrency(data?.todayRevenue ?? 0),
      icon: DollarSign,
      color: "from-[#d4a843]/20 to-[#d4a843]/5",
      iconColor: "text-[#d4a843]",
    },
    {
      label: t("todayTransactions"),
      value: (data?.todayTransactions ?? 0).toLocaleString(),
      icon: ShoppingCart,
      color: "from-[#3b82f6]/20 to-[#3b82f6]/5",
      iconColor: "text-[#3b82f6]",
    },
    {
      label: t("averageSaleValue"),
      value: formatCurrency(data?.averageSaleValue ?? 0),
      icon: TrendingUp,
      color: "from-[#8b5cf6]/20 to-[#8b5cf6]/5",
      iconColor: "text-[#8b5cf6]",
    },
    {
      label: t("topCashier"),
      value: data?.topCashier ?? "N/A",
      icon: User,
      color: "from-[#10b981]/20 to-[#10b981]/5",
      iconColor: "text-[#10b981]",
    },
    {
      label: t("returnRate"),
      value: `${data?.returnRate ?? 0}%`,
      icon: RotateCcw,
      color: "from-[#f43f5e]/20 to-[#f43f5e]/5",
      iconColor: "text-[#f43f5e]",
    },
  ];

  const quickActions = [
    {
      label: t("viewSalesReport"),
      href: "/dashboard/owner/reports",
      icon: BarChart3,
    },
    {
      label: t("processReturns"),
      href: "/dashboard/cashier/pos",
      icon: RotateCcw,
    },
    {
      label: t("viewProducts"),
      href: "/dashboard/sales-manager/products",
      icon: Package,
    },
  ];

  return (
    <DashboardLayout title={t("salesManagerDashboard")}>
      <div className="space-y-6">
        {/* Date Range Filter & Total Payments */}
        <div className="glass-card p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="input w-40"
              />
              <span className="text-sm text-[#606070]">{t("toLabel")}</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="input w-40"
              />
              {(dateFrom || dateTo) && (
                <button
                  onClick={() => { setDateFrom(""); setDateTo(""); }}
                  className="btn btn-secondary btn-sm"
                >
                  {t("clear")}
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-[#10b981]/30 bg-[#10b981]/10 px-4 py-2">
              <DollarSign size={18} className="text-[#10b981]" />
              <span className="text-sm font-medium text-[#9090a0]">{t("totalPaymentsLabel")}</span>
              <span className="text-lg font-bold text-[#10b981]">
                {formatCurrency(data?.totalPayments ?? 0)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="stat-card">
                <div className={`stat-icon bg-gradient-to-br ${stat.color}`}>
                  <Icon size={20} className={stat.iconColor} />
                </div>
                <p className="mt-3 text-2xl font-bold text-[#f0f0f5]">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-[#9090a0]">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* AI Insights */}
        <AIInsightPanel insights={insights} />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="glass-card xl:col-span-2 p-6">
            <h3 className="mb-4 text-lg font-semibold text-[#f0f0f5]">
              {t("salesTrend")}
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.salesTrend ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
                  <XAxis dataKey="name" stroke="#606070" fontSize={12} />
                  <YAxis stroke="#606070" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "#16161f",
                      border: "1px solid #2a2a3a",
                      borderRadius: "8px",
                      color: "#f0f0f5",
                    }}
                    formatter={(value: number, name: string) => [
                      name === "revenue" ? formatCurrency(value) : value,
                      name === "revenue" ? t("revenue") : t("transactionsLabel"),
                    ]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name={t("revenue")}
                    stroke="#d4a843"
                    strokeWidth={2}
                    dot={{ fill: "#d4a843", r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="transactions"
                    name={t("transactionsLabel")}
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="mb-4 text-lg font-semibold text-[#f0f0f5]">
              {t("salesByCategory")}
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.categorySales ?? []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {(data?.categorySales ?? []).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#16161f",
                      border: "1px solid #2a2a3a",
                      borderRadius: "8px",
                      color: "#f0f0f5",
                    }}
                    formatter={(value: number) => [formatCurrency(value)]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="glass-card xl:col-span-2 p-6">
            <h3 className="mb-4 text-lg font-semibold text-[#f0f0f5]">
              {t("topPerformingProducts")}
            </h3>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t("product")}</th>
                    <th>{t("quantitySold")}</th>
                    <th>{t("revenue")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.topProducts?.map((product) => (
                    <tr key={product.name}>
                      <td className="font-medium text-[#f0f0f5]">
                        {product.name}
                      </td>
                      <td className="text-[#9090a0]">{product.quantity}</td>
                      <td className="font-medium text-[#d4a843]">
                        {formatCurrency(product.revenue)}
                      </td>
                    </tr>
                  ))}
                  {(!data?.topProducts || data.topProducts.length === 0) && (
                    <tr>
                      <td colSpan={3} className="text-center text-[#606070]">
                        {t("noProductData")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="mb-4 text-lg font-semibold text-[#f0f0f5]">
              {t("quickActions")}
            </h3>
            <div className="space-y-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="flex items-center justify-between rounded-xl border border-[#2a2a3a] bg-[#1c1c28] p-3 transition-all hover:border-[#d4a843]/30"
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={18} className="text-[#d4a843]" />
                      <span className="text-sm font-medium text-[#f0f0f5]">
                        {action.label}
                      </span>
                    </div>
                    <ArrowRight size={14} className="text-[#606070]" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
            <h3 className="mb-4 text-lg font-semibold text-[#f0f0f5]">
              {t("recentTransactions")}
            </h3>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{t("invoice")}</th>
                  <th>{t("customer")}</th>
                  <th>{t("amount")}</th>
                  <th>{t("date")}</th>
                  <th>{t("paymentMethodLabel")}</th>
                  <th>{t("status")}</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentTransactions?.map((tx) => (
                  <tr key={tx.id}>
                    <td className="font-medium text-[#f0f0f5]">
                      {tx.invoiceNumber}
                    </td>
                    <td className="text-[#9090a0]">{tx.customer}</td>
                    <td className="font-medium text-[#d4a843]">
                      {formatCurrency(tx.total)}
                    </td>
                    <td className="text-[#9090a0]">
                      {formatDateTime(tx.createdAt)}
                    </td>
                    <td className="text-[#9090a0]">{tx.paymentMethod}</td>
                    <td>
                      <span
                        className={`badge ${
                          tx.status === "COMPLETED"
                            ? "badge-success"
                            : tx.status === "RETURNED"
                            ? "badge-warning"
                            : "badge-info"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!data?.recentTransactions ||
                  data.recentTransactions.length === 0) && (
                  <tr>
                    <td colSpan={6} className="text-center text-[#606070]">
                      {t("noRecentTransactions")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
