"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { formatCurrency } from "@/lib/utils";
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
  const [data, setData] = useState<ManagerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/dashboard/manager");
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
  }, []);

  if (loading) {
    return (
      <DashboardLayout role="MANAGER" title="Manager Dashboard">
        <div className="flex h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4a843] border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  const stats = [
    {
      label: "Today's Revenue",
      value: formatCurrency(data?.todayRevenue ?? 0),
      icon: DollarSign,
      color: "from-[#d4a843]/20 to-[#d4a843]/5",
      iconColor: "text-[#d4a843]",
    },
    {
      label: "Today's Sales",
      value: (data?.todaySales ?? 0).toLocaleString(),
      icon: ShoppingCart,
      color: "from-[#3b82f6]/20 to-[#3b82f6]/5",
      iconColor: "text-[#3b82f6]",
    },
    {
      label: "Staff on Duty",
      value: (data?.staffOnDuty ?? 0).toLocaleString(),
      icon: Users,
      color: "from-[#8b5cf6]/20 to-[#8b5cf6]/5",
      iconColor: "text-[#8b5cf6]",
    },
    {
      label: "Inventory Value",
      value: (data?.inventoryValue ?? 0).toLocaleString() + " units",
      icon: Package,
      color: "from-[#10b981]/20 to-[#10b981]/5",
      iconColor: "text-[#10b981]",
    },
    {
      label: "Pending Approvals",
      value: (data?.pendingApprovals ?? 0).toLocaleString(),
      icon: Clock,
      color: "from-[#f59e0b]/20 to-[#f59e0b]/5",
      iconColor: "text-[#f59e0b]",
    },
    {
      label: "Customer Visits",
      value: (data?.customerVisits ?? 0).toLocaleString(),
      icon: UserCheck,
      color: "from-[#06b6d4]/20 to-[#06b6d4]/5",
      iconColor: "text-[#06b6d4]",
    },
  ];

  const quickActions = [
    { label: "Approve Expenses", action: () => router.push('/dashboard/accounting/expenses'), icon: CheckCircle },
    { label: "View Reports", action: () => router.push('/dashboard/owner/reports'), icon: BarChart3 },
    { label: "Staff Management", action: () => router.push('/dashboard/owner/users'), icon: Users },
  ];

  return (
    <DashboardLayout role="MANAGER" title="Manager Dashboard">
      <div className="space-y-6">
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
              Sales Performance
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
                    name="This Week"
                    fill="#d4a843"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="lastWeek"
                    name="Last Week"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="mb-4 text-lg font-semibold text-[#f0f0f5]">
              Quick Actions
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
              Staff Performance
            </h3>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Staff Member</th>
                    <th>Sales</th>
                    <th>Revenue</th>
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
                        No staff data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="mb-4 text-lg font-semibold text-[#f0f0f5]">
              Expense Summary
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
                  No expense data available
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-[#f0f0f5]">
            Low Stock Alerts
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
                    Min: {item.minStockLevel}
                  </p>
                </div>
                <span className="badge badge-danger">
                  {item.stockQuantity} left
                </span>
              </div>
            ))}
            {(!data?.lowStockItems || data.lowStockItems.length === 0) && (
              <p className="col-span-full text-center text-sm text-[#606070]">
                All stock levels are healthy
              </p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
