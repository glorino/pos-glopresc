"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { formatCurrency } from "@/lib/utils";
import { useTranslation } from "@/contexts/LanguageContext";
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  AlertTriangle,
  UserCheck,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  BarChart3,
  FileText,
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
  Legend,
} from "recharts";

interface ManagerData {
  todayRevenue: number;
  todaySales: number;
  staffOnDuty: number;
  inventoryValue: number;
  pendingApprovals: number;
  customerVisits: number;
  totalPayments: number;
  weeklyComparison: { name: string; thisWeek: number; lastWeek: number }[];
  staffPerformance: { name: string; sales: number; revenue: number }[];
  expenseSummary: { status: string; count: number; total: number }[];
  lowStockItems: {
    id: string;
    name: string;
    stockQuantity: number;
    minStockLevel: number;
  }[];
}

export default function ManagerDashboard() {
  const router = useRouter();
  const { t } = useTranslation();
  const [data, setData] = useState<ManagerData | null>(null);
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
        const res = await fetch(`/api/dashboard/manager?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
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
      <DashboardLayout role="MANAGER" title={t("managerDashboard")}>
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
      label: t("todaySales"),
      value: (data?.todaySales ?? 0).toLocaleString(),
      icon: ShoppingCart,
      color: "from-[#3b82f6]/20 to-[#3b82f6]/5",
      iconColor: "text-[#3b82f6]",
    },
    {
      label: t("staffOnDuty"),
      value: (data?.staffOnDuty ?? 0).toLocaleString(),
      icon: Users,
      color: "from-[#8b5cf6]/20 to-[#8b5cf6]/5",
      iconColor: "text-[#8b5cf6]",
    },
    {
      label: t("inventoryValue"),
      value: (data?.inventoryValue ?? 0).toLocaleString() + " " + t("units"),
      icon: Package,
      color: "from-[#10b981]/20 to-[#10b981]/5",
      iconColor: "text-[#10b981]",
    },
    {
      label: t("pendingApprovals"),
      value: (data?.pendingApprovals ?? 0).toLocaleString(),
      icon: Clock,
      color: "from-[#f59e0b]/20 to-[#f59e0b]/5",
      iconColor: "text-[#f59e0b]",
    },
    {
      label: t("customerVisits"),
      value: (data?.customerVisits ?? 0).toLocaleString(),
      icon: UserCheck,
      color: "from-[#06b6d4]/20 to-[#06b6d4]/5",
      iconColor: "text-[#06b6d4]",
    },
  ];

  const quickActions = [
    { label: t("approveExpenses"), action: () => router.push('/dashboard/accounting/expenses'), icon: CheckCircle },
    { label: t("viewReports"), action: () => router.push('/dashboard/owner/reports'), icon: BarChart3 },
    { label: t("staffManagement"), action: () => router.push('/dashboard/owner/users'), icon: Users },
  ];

  return (
      <DashboardLayout role="MANAGER" title={t("managerDashboard")}>
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

        {data?.lowStockItems && data.lowStockItems.length > 0 && (
          <button
            onClick={() => router.push("/dashboard/inventory/stock")}
            className="flex w-full items-center justify-between rounded-xl border border-[#f59e0b]/30 bg-gradient-to-r from-[#f59e0b]/10 to-[#f59e0b]/5 p-4 transition-all hover:border-[#f59e0b]/50 hover:from-[#f59e0b]/15 hover:to-[#f59e0b]/10"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f59e0b]/20">
                <AlertTriangle size={18} className="text-[#f59e0b]" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-[#f0f0f5]">
                  {t("stockAlert")} — {data.lowStockItems.length} {data.lowStockItems.length !== 1 ? t("products") : t("product")} {t("belowMinimumLevel")}
                </p>
                <p className="text-xs text-[#9090a0]">{t("clickToViewInventory")}</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-[#f59e0b]" />
          </button>
        )}

        {/* AI Insights */}
        <AIInsightPanel insights={insights} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="glass-card xl:col-span-2 p-6">
            <h3 className="mb-4 text-lg font-semibold text-[#f0f0f5]">
              {t("salesPerformance")}
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.weeklyComparison ?? []}>
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
                    formatter={(value: number) => [formatCurrency(value)]}
                  />
                  <Legend />
                  <Bar
                    dataKey="thisWeek"
                    name={t("thisWeek")}
                    fill="#d4a843"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="lastWeek"
                    name={t("lastWeek")}
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
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
                  <button
                    key={action.label}
                    onClick={action.action}
                    className="flex items-center justify-between rounded-xl border border-[#2a2a3a] bg-[#1c1c28] p-3 transition-all hover:border-[#d4a843]/30"
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={18} className="text-[#d4a843]" />
                      <span className="text-sm font-medium text-[#f0f0f5]">
                        {action.label}
                      </span>
                    </div>
                    <ArrowRight size={14} className="text-[#606070]" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="glass-card p-6">
            <h3 className="mb-4 text-lg font-semibold text-[#f0f0f5]">
              {t("staffPerformance")}
            </h3>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t("staffMember")}</th>
                    <th>{t("sales")}</th>
                    <th>{t("revenue")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.staffPerformance?.map((staff) => (
                    <tr key={staff.name}>
                      <td className="font-medium text-[#f0f0f5]">
                        {staff.name}
                      </td>
                      <td className="text-[#9090a0]">{staff.sales}</td>
                      <td className="font-medium text-[#d4a843]">
                        {formatCurrency(staff.revenue)}
                      </td>
                    </tr>
                  ))}
                  {(!data?.staffPerformance ||
                    data.staffPerformance.length === 0) && (
                    <tr>
                      <td colSpan={3} className="text-center text-[#606070]">
                        {t("noStaffData")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="mb-4 text-lg font-semibold text-[#f0f0f5]">
              {t("expenseSummary")}
            </h3>
            <div className="space-y-3">
              {data?.expenseSummary?.map((expense) => (
                <div
                  key={expense.status}
                  className="flex items-center justify-between rounded-xl border border-[#2a2a3a] bg-[#1c1c28] p-3"
                >
                  <div className="flex items-center gap-3">
                    {expense.status === "APPROVED" ? (
                      <CheckCircle size={18} className="text-[#10b981]" />
                    ) : expense.status === "REJECTED" ? (
                      <XCircle size={18} className="text-[#f43f5e]" />
                    ) : (
                      <Clock size={18} className="text-[#f59e0b]" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-[#f0f0f5]">
                        {expense.status}
                      </p>
                      <p className="text-xs text-[#606070]">
                        {expense.count} expense{expense.count !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-[#d4a843]">
                    {formatCurrency(expense.total)}
                  </p>
                </div>
              ))}
              {(!data?.expenseSummary || data.expenseSummary.length === 0) && (
                <p className="text-center text-sm text-[#606070]">
                  {t("noExpenseData")}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
            <h3 className="mb-4 text-lg font-semibold text-[#f0f0f5]">
              {t("lowStockAlerts")}
            </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data?.lowStockItems?.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-[#f43f5e]/20 bg-[#f43f5e]/5 p-3"
              >
                <div>
                  <p className="text-sm font-medium text-[#f0f0f5]">
                    {item.name}
                  </p>
                  <p className="text-xs text-[#606070]">
                    {t("minLabel")} {item.minStockLevel}
                  </p>
                </div>
                <span className="badge badge-danger">
                  {item.stockQuantity} {t("left")}
                </span>
              </div>
            ))}
            {(!data?.lowStockItems || data.lowStockItems.length === 0) && (
              <p className="col-span-full text-center text-sm text-[#606070]">
                {t("allStockLevelsHealthy")}
              </p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
