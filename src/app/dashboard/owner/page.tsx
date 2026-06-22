"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Shield,
  Settings,
  FileText,
  ArrowRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DashboardData {
  totalRevenue: number;
  totalSales: number;
  activeProducts: number;
  totalCustomers: number;
  pendingExpenses: number;
  lowStockItems: number;
  monthlyRevenue: { name: string; revenue: number }[];
  recentSales: {
    id: string;
    invoiceNumber: string;
    customer: string;
    total: number;
    createdAt: string;
    status: string;
  }[];
  topProducts: { name: string; totalSold: number; totalRevenue: number }[];
}

export default function OwnerDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/dashboard/owner");
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
      <DashboardLayout role="OWNER" title="Owner Dashboard">
        <div className="flex h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4a843] border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  const stats = [
    {
      label: "Total Revenue",
      value: formatCurrency(data?.totalRevenue ?? 0),
      icon: DollarSign,
      color: "from-[#d4a843]/20 to-[#d4a843]/5",
      iconColor: "text-[#d4a843]",
      trend: "+12.5%",
      trendUp: true,
    },
    {
      label: "Total Sales",
      value: (data?.totalSales ?? 0).toLocaleString(),
      icon: ShoppingCart,
      color: "from-[#3b82f6]/20 to-[#3b82f6]/5",
      iconColor: "text-[#3b82f6]",
      trend: "+8.2%",
      trendUp: true,
    },
    {
      label: "Active Products",
      value: (data?.activeProducts ?? 0).toLocaleString(),
      icon: Package,
      color: "from-[#8b5cf6]/20 to-[#8b5cf6]/5",
      iconColor: "text-[#8b5cf6]",
      trend: "+3",
      trendUp: true,
    },
    {
      label: "Total Customers",
      value: (data?.totalCustomers ?? 0).toLocaleString(),
      icon: Users,
      color: "from-[#10b981]/20 to-[#10b981]/5",
      iconColor: "text-[#10b981]",
      trend: "+15",
      trendUp: true,
    },
    {
      label: "Pending Expenses",
      value: (data?.pendingExpenses ?? 0).toLocaleString(),
      icon: AlertTriangle,
      color: "from-[#f59e0b]/20 to-[#f59e0b]/5",
      iconColor: "text-[#f59e0b]",
      trend: data?.pendingExpenses ?? 0,
      trendUp: false,
    },
    {
      label: "Low Stock Items",
      value: (data?.lowStockItems ?? 0).toLocaleString(),
      icon: AlertTriangle,
      color: "from-[#f43f5e]/20 to-[#f43f5e]/5",
      iconColor: "text-[#f43f5e]",
      trend: data?.lowStockItems ?? 0,
      trendUp: false,
    },
  ];

  const quickActions = [
    { label: "View Reports", href: "/dashboard/reports", icon: BarChart3 },
    { label: "Manage Users", href: "/dashboard/users", icon: Shield },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
    { label: "View Audit Logs", href: "/dashboard/audit-logs", icon: FileText },
  ];

  return (
    <DashboardLayout role="OWNER" title="Owner Dashboard">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="stat-card">
                <div className="flex items-start justify-between">
                  <div className={`stat-icon bg-gradient-to-br ${stat.color}`}>
                    <Icon size={20} className={stat.iconColor} />
                  </div>
                  <span
                    className={`flex items-center gap-1 text-xs font-medium ${
                      stat.trendUp ? "text-[#10b981]" : "text-[#f43f5e]"
                    }`}
                  >
                    {stat.trendUp ? (
                      <TrendingUp size={12} />
                    ) : (
                      <TrendingDown size={12} />
                    )}
                    {stat.trendUp ? stat.trend : `${stat.trend} pending`}
                  </span>
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
              Monthly Revenue ({new Date().getFullYear()})
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.monthlyRevenue ?? []}>
                  <defs>
                    <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d4a843" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#d4a843" stopOpacity={0} />
                    </linearGradient>
                  </defs>
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
                    formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#d4a843"
                    strokeWidth={2}
                    fill="url(#goldGradient)"
                  />
                </AreaChart>
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
                  <Link
                    key={action.label}
                    href={action.href}
                    className="flex items-center justify-between rounded-xl border border-[#2a2a3a] bg-[#1c1c28] p-3 transition-all hover:border-[#d4a843]/30 hover:bg-[#1c1c28]/80"
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

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="glass-card p-6">
            <h3 className="mb-4 text-lg font-semibold text-[#f0f0f5]">
              Recent Sales
            </h3>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.recentSales?.map((sale) => (
                    <tr key={sale.id}>
                      <td className="font-medium text-[#f0f0f5]">
                        {sale.invoiceNumber}
                      </td>
                      <td className="text-[#9090a0]">{sale.customer}</td>
                      <td className="font-medium text-[#d4a843]">
                        {formatCurrency(sale.total)}
                      </td>
                      <td className="text-[#9090a0]">
                        {formatDateTime(sale.createdAt)}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            sale.status === "COMPLETED"
                              ? "badge-success"
                              : sale.status === "RETURNED"
                              ? "badge-warning"
                              : sale.status === "CANCELLED"
                              ? "badge-danger"
                              : "badge-info"
                          }`}
                        >
                          {sale.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!data?.recentSales || data.recentSales.length === 0) && (
                    <tr>
                      <td colSpan={5} className="text-center text-[#606070]">
                        No recent sales
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="mb-4 text-lg font-semibold text-[#f0f0f5]">
              Top Selling Products
            </h3>
            <div className="space-y-3">
              {data?.topProducts?.map((product, index) => (
                <div
                  key={product.name}
                  className="flex items-center justify-between rounded-xl border border-[#2a2a3a] bg-[#1c1c28] p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#d4a843]/20 to-[#d4a843]/5 text-sm font-bold text-[#d4a843]">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#f0f0f5]">
                        {product.name}
                      </p>
                      <p className="text-xs text-[#606070]">
                        {product.totalSold} sold
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-[#d4a843]">
                    {formatCurrency(product.totalRevenue)}
                  </p>
                </div>
              ))}
              {(!data?.topProducts || data.topProducts.length === 0) && (
                <p className="text-center text-sm text-[#606070]">
                  No product data available
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
