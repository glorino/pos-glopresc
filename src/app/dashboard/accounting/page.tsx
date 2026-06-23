"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { formatCurrency, formatDateTime } from "@/lib/utils";
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
  const [data, setData] = useState<AccountingSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch("/api/accounting/summary");
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
      label: "Total Revenue",
      value: formatCurrency(data?.totalRevenue ?? 0),
      icon: DollarSign,
      color: "from-[#10b981]/20 to-[#10b981]/5",
      iconColor: "text-[#10b981]",
    },
    {
      label: "Total Expenses",
      value: formatCurrency(data?.totalExpenses ?? 0),
      icon: TrendingDown,
      color: "from-[#f43f5e]/20 to-[#f43f5e]/5",
      iconColor: "text-[#f43f5e]",
    },
    {
      label: "Net Profit",
      value: formatCurrency(data?.netProfit ?? 0),
      icon: TrendingUp,
      color: "from-[#d4a843]/20 to-[#d4a843]/5",
      iconColor: "text-[#d4a843]",
    },
    {
      label: "Pending Invoices",
      value: (data?.pendingInvoices ?? 0).toLocaleString(),
      icon: FileText,
      color: "from-[#f59e0b]/20 to-[#f59e0b]/5",
      iconColor: "text-[#f59e0b]",
    },
    {
      label: "Pending Expenses",
      value: (data?.pendingExpenses ?? 0).toLocaleString(),
      icon: Clock,
      color: "from-[#8b5cf6]/20 to-[#8b5cf6]/5",
      iconColor: "text-[#8b5cf6]",
    },
    {
      label: "Overdue Invoices",
      value: (data?.overdueInvoices ?? 0).toLocaleString(),
      icon: AlertTriangle,
      color: "from-[#f43f5e]/20 to-[#f43f5e]/5",
      iconColor: "text-[#f43f5e]",
    },
    {
      label: "Monthly Cash Flow",
      value: formatCurrency(
        (data?.monthlyCashFlow ?? []).reduce((s, m) => s + m.income - m.expenses, 0)
      ),
      icon: ArrowUpRight,
      color: "from-[#06b6d4]/20 to-[#06b6d4]/5",
      iconColor: "text-[#06b6d4]",
    },
  ];

  const quickActions = [
    { label: "Add Expense", href: "/dashboard/accounting/expenses", icon: Plus },
    { label: "View Invoices", href: "/dashboard/accounting/invoices", icon: Eye },
    { label: "Generate Report", href: "/dashboard/owner/reports", icon: BarChart3 },
    { label: "Expense Report", href: "/dashboard/accounting/expenses", icon: FileText },
  ];

  const transactions = data?.recentTransactions ?? [];
  const pendingApprovals = data?.pendingExpenseApprovals ?? [];

  return (
    <DashboardLayout role="ACCOUNTANT" title="Accounting & Finance">
      <div className="space-y-6">
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
          <h3 className="mb-4 text-lg font-semibold text-[#f0f0f5]">Quick Actions</h3>
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
                  Revenue vs Expenses
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
                          name === "income" ? "Revenue" : "Expenses",
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
                  Expense Breakdown
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
                        formatter={(value: number) => [formatCurrency(value), "Amount"]}
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
                  <h4 className="text-base font-semibold text-[#f0f0f5]">Recent Transactions</h4>
                  <Link href="/dashboard/accounting/expenses" className="text-xs text-[#d4a843] hover:underline">
                    View All
                  </Link>
                </div>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Amount</th>
                        <th>Type</th>
                        <th>Date</th>
                        <th>Status</th>
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
                            No recent transactions
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
                    Pending Expense Approvals
                  </h4>
                  <Link href="/dashboard/accounting/expenses" className="text-xs text-[#d4a843] hover:underline">
                    View All
                  </Link>
                </div>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Amount</th>
                        <th>User</th>
                        <th>Date</th>
                        <th>Status</th>
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
                            No pending approvals
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
