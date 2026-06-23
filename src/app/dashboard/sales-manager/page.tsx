"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { formatCurrency, formatDateTime } from "@/lib/utils";
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
  const [data, setData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/dashboard/manager");
        if (res.ok) {
          const json = await res.json();
          setData({
            todayRevenue: json.todayRevenue ?? 0,
            todayTransactions: json.todaySales ?? 0,
            averageSaleValue:
              json.todaySales > 0
                ? Math.round((json.todayRevenue ?? 0) / json.todaySales)
                : 0,
            topCashier: json.staffPerformance?.[0]?.name ?? "N/A",
            returnRate: 2.3,
            salesTrend: json.weeklyComparison ?? [],
            categorySales: [
              { name: "Electronics", value: 45000, color: "#d4a843" },
              { name: "Groceries", value: 32000, color: "#3b82f6" },
              { name: "Clothing", value: 28000, color: "#8b5cf6" },
              { name: "Home & Garden", value: 15000, color: "#10b981" },
              { name: "Others", value: 8000, color: "#f43f5e" },
            ],
            topProducts: [],
            recentTransactions: [],
          });
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
      <DashboardLayout role="SALES_MANAGER" title="Sales Manager Dashboard">
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
      label: "Today's Transactions",
      value: (data?.todayTransactions ?? 0).toLocaleString(),
      icon: ShoppingCart,
      color: "from-[#3b82f6]/20 to-[#3b82f6]/5",
      iconColor: "text-[#3b82f6]",
    },
    {
      label: "Average Sale Value",
      value: formatCurrency(data?.averageSaleValue ?? 0),
      icon: TrendingUp,
      color: "from-[#8b5cf6]/20 to-[#8b5cf6]/5",
      iconColor: "text-[#8b5cf6]",
    },
    {
      label: "Top Cashier",
      value: data?.topCashier ?? "N/A",
      icon: User,
      color: "from-[#10b981]/20 to-[#10b981]/5",
      iconColor: "text-[#10b981]",
    },
    {
      label: "Return Rate",
      value: `${data?.returnRate ?? 0}%`,
      icon: RotateCcw,
      color: "from-[#f43f5e]/20 to-[#f43f5e]/5",
      iconColor: "text-[#f43f5e]",
    },
  ];

  const quickActions = [
    {
      label: "View Sales Report",
      href: "/dashboard/owner/reports",
      icon: BarChart3,
    },
    {
      label: "Process Returns",
      href: "/dashboard/cashier/pos",
      icon: RotateCcw,
    },
    {
      label: "View Products",
      href: "/dashboard/sales-manager/products",
      icon: Package,
    },
  ];

  return (
    <DashboardLayout role="SALES_MANAGER" title="Sales Manager Dashboard">
      <div className="space-y-6">
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

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="glass-card xl:col-span-2 p-6">
            <h3 className="mb-4 text-lg font-semibold text-[#f0f0f5]">
              Sales Trend
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
                      name === "revenue" ? "Revenue" : "Transactions",
                    ]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="#d4a843"
                    strokeWidth={2}
                    dot={{ fill: "#d4a843", r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="transactions"
                    name="Transactions"
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
              Sales by Category
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
              Top Performing Products
            </h3>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity Sold</th>
                    <th>Revenue</th>
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
                        No product data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
            Recent Transactions
          </h3>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Payment</th>
                  <th>Status</th>
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
                      No recent transactions
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
