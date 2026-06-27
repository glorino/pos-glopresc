"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { useTranslation } from "@/contexts/LanguageContext";
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  FileText,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  Plus,
  Eye,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import AIInsightPanel from "@/components/ai/AIInsightPanel";
import type { AIInsight } from "@/lib/ai-insights";
import {
  BarChart,
  Bar,
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

interface AccountingSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  pendingInvoices: number;
  pendingExpenses: number;
  overdueInvoices: number;
  totalPayments: number;
  monthlyCashFlow: { name: string; income: number; expenses: number }[];
  expenseByCategory: { name: string; value: number }[];
  recentTransactions: {
    id: string;
    description: string;
    amount: number;
    type: string;
    date: string;
    status: string;
  }[];
  pendingExpenseApprovals: {
    id: string;
    description: string;
    amount: number;
    status: string;
    date: string;
    user: string;
  }[];
}

const PIE_COLORS = ["#d4a843", "#3b82f6", "#8b5cf6", "#10b981", "#f43f5e", "#06b6d4", "#f59e0b"];

export default function AccountingDashboard() {
  const { t } = useTranslation();
  const [data, setData] = useState<AccountingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    fetchData();
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetch("/api/ai-insights").then(r => r.json()).then(d => setInsights(d.insights ?? []));
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      const res = await fetch(`/api/accounting/summary?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to fetch accounting data:", err);
    } finally {
      setLoading(false);
    }
  }

  const stats = [
    {
      label: t("totalRevenue"),
      value: formatCurrency(data?.totalRevenue ?? 0),
      icon: DollarSign,
      color: "from-[#10b981]/20 to-[#10b981]/5",
      iconColor: "text-[#10b981]",
    },
    {
      label: t("totalExpenses"),
      value: formatCurrency(data?.totalExpenses ?? 0),
      icon: TrendingDown,
      color: "from-[#f43f5e]/20 to-[#f43f5e]/5",
      iconColor: "text-[#f43f5e]",
    },
    {
      label: t("netProfit"),
      value: formatCurrency(data?.netProfit ?? 0),
      icon: TrendingUp,
      color: "from-[#d4a843]/20 to-[#d4a843]/5",
      iconColor: "text-[#d4a843]",
    },
    {
      label: t("invoices"),
      value: (data?.pendingInvoices ?? 0).toLocaleString(),
      icon: FileText,
      color: "from-[#f59e0b]/20 to-[#f59e0b]/5",
      iconColor: "text-[#f59e0b]",
    },
    {
      label: t("pendingExpenses"),
      value: (data?.pendingExpenses ?? 0).toLocaleString(),
      icon: Clock,
      color: "from-[#8b5cf6]/20 to-[#8b5cf6]/5",
      iconColor: "text-[#8b5cf6]",
    },
    {
      label: t("overdueInvoices"),
      value: (data?.overdueInvoices ?? 0).toLocaleString(),
      icon: AlertTriangle,
      color: "from-[#f43f5e]/20 to-[#f43f5e]/5",
      iconColor: "text-[#f43f5e]",
    },
    {
      label: t("monthlyCashFlow"),
      value: formatCurrency(
        (data?.monthlyCashFlow ?? []).reduce((s, m) => s + m.income - m.expenses, 0)
      ),
      icon: ArrowUpRight,
      color: "from-[#06b6d4]/20 to-[#06b6d4]/5",
      iconColor: "text-[#06b6d4]",
    },
  ];

  const quickActions = [
    { label: t("addExpense"), href: "/dashboard/accounting/expenses", icon: Plus },
    { label: t("viewInvoices"), href: "/dashboard/accounting/invoices", icon: Eye },
    { label: t("generateReport"), href: "/dashboard/owner/reports", icon: BarChart3 },
    { label: t("expenseReport"), href: "/dashboard/accounting/expenses", icon: FileText },
  ];

  const transactions = data?.recentTransactions ?? [];
  const pendingApprovals = data?.pendingExpenseApprovals ?? [];

  return (
    <DashboardLayout role="ACCOUNTANT" title={t("accountingDashboard")}>
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

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="stat-card">
                <div className="flex items-start justify-between">
                  <div className={`stat-icon bg-gradient-to-br ${stat.color}`}>
                    <Icon size={20} className={stat.iconColor} />
                  </div>
                </div>
                <p className="mt-3 text-xl font-bold text-[#f0f0f5]">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-[#9090a0]">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="glass-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-[#f0f0f5]">{t("quickActions")}</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-3 rounded-xl border border-[#2a2a3a] bg-[#1c1c28] p-3 transition-all hover:border-[#d4a843]/30 hover:bg-[#1c1c28]/80"
                >
                  <Icon size={18} className="text-[#d4a843]" />
                  <span className="text-sm font-medium text-[#f0f0f5]">{action.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* AI Insights */}
        <AIInsightPanel insights={insights} />

        {/* Cash Drawer Report */}
        <div className="glass-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-base font-semibold text-[#f0f0f5]">{t("cashDrawerOverShort")}</h4>
            <Link href="/dashboard/accounting/cash-reports" className="text-xs text-[#d4a843] hover:underline">
              {t("viewFullReport")}
            </Link>
          </div>
          <p className="text-sm text-[#9090a0]">{t("cashDrawerOverShortDesc")}</p>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4a843] border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Charts */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              {/* Revenue vs Expenses */}
              <div className="glass-card p-6 xl:col-span-2">
                <h3 className="mb-4 text-lg font-semibold text-[#f0f0f5]">
                  {t("revenueVsExpenses")}
                </h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.monthlyCashFlow ?? []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
                      <XAxis dataKey="name" stroke="#606070" fontSize={12} />
                      <YAxis
                        stroke="#606070"
                        fontSize={12}
                        tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#16161f",
                          border: "1px solid #2a2a3a",
                          borderRadius: "8px",
                          color: "#f0f0f5",
                        }}
                        formatter={(value: number, name: string) => [
                          formatCurrency(value),
                          name === "income" ? t("revenue") : t("totalExpenses"),
                        ]}
                      />
                      <Legend
                        wrapperStyle={{ color: "#9090a0", fontSize: 12 }}
                      />
                      <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Expense Breakdown */}
              <div className="glass-card p-6">
                <h3 className="mb-4 text-lg font-semibold text-[#f0f0f5]">
                  {t("expenseBreakdown")}
                </h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data?.expenseByCategory ?? []}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                      >
                        {(data?.expenseByCategory ?? []).map((_, index) => (
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
                        formatter={(value: number) => [formatCurrency(value), t("amount")]}
                      />
                      <Legend
                        wrapperStyle={{ color: "#9090a0", fontSize: 11 }}
                        formatter={(value) => <span style={{ color: "#9090a0" }}>{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Tables */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              {/* Recent Transactions */}
              <div className="glass-card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="text-base font-semibold text-[#f0f0f5]">{t("recentTransactions")}</h4>
                  <Link href="/dashboard/accounting/expenses" className="text-xs text-[#d4a843] hover:underline">
                    {t("viewAll")}
                  </Link>
                </div>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>{t("description")}</th>
                        <th>{t("amount")}</th>
                        <th>{t("type")}</th>
                        <th>{t("date")}</th>
                        <th>{t("status")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.slice(0, 6).map((txn) => (
                        <tr key={txn.id}>
                          <td className="font-medium text-[#f0f0f5]">{txn.description}</td>
                          <td className={`font-medium ${
                            txn.type === "INCOME" ? "text-[#10b981]" : "text-[#f43f5e]"
                          }`}>
                            {txn.type === "INCOME" ? "+" : "-"}{formatCurrency(txn.amount)}
                          </td>
                          <td>
                            <span className={`badge ${txn.type === "INCOME" ? "badge-success" : "badge-danger"}`}>
                              {txn.type}
                            </span>
                          </td>
                          <td className="text-[#9090a0]">{formatDateTime(txn.date)}</td>
                          <td>
                            <span className={`badge ${
                              txn.status === "COMPLETED" ? "badge-success"
                              : txn.status === "PENDING" ? "badge-warning"
                              : "badge-danger"
                            }`}>
                              {txn.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {transactions.length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center text-[#606070] py-6">
                            {t("noRecentTransactions")}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pending Expense Approvals */}
              <div className="glass-card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="text-base font-semibold text-[#f0f0f5]">
                    {t("pendingExpenseApprovals")}
                  </h4>
                  <Link href="/dashboard/accounting/expenses" className="text-xs text-[#d4a843] hover:underline">
                    {t("viewAll")}
                  </Link>
                </div>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>{t("description")}</th>
                        <th>{t("amount")}</th>
                        <th>{t("userLabel")}</th>
                        <th>{t("date")}</th>
                        <th>{t("status")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingApprovals.slice(0, 6).map((exp) => (
                        <tr key={exp.id}>
                          <td className="font-medium text-[#f0f0f5]">{exp.description}</td>
                          <td className="font-medium text-[#d4a843]">
                            {formatCurrency(exp.amount)}
                          </td>
                          <td className="text-[#9090a0]">{exp.user}</td>
                          <td className="text-[#9090a0]">{formatDateTime(exp.date)}</td>
                          <td>
                            <span className="badge badge-warning">{exp.status}</span>
                          </td>
                        </tr>
                      ))}
                      {pendingApprovals.length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center text-[#606070] py-6">
                            {t("noPendingApprovals")}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
