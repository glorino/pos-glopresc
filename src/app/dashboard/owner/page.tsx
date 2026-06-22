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
  Activity,
  CreditCard,
  Clock,
  Zap,
  Store,
  UserPlus,
  RefreshCw,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
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

const COLORS = ["#d4a843", "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b"];

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
      gradient: "from-[#d4a843] to-[#b8942f]",
      bgGradient: "from-[#d4a843]/15 via-[#d4a843]/5 to-transparent",
      iconColor: "text-[#d4a843]",
      trend: "+12.5%",
      trendUp: true,
    },
    {
      label: "Total Sales",
      value: (data?.totalSales ?? 0).toLocaleString(),
      icon: ShoppingCart,
      gradient: "from-[#3b82f6] to-[#2563eb]",
      bgGradient: "from-[#3b82f6]/15 via-[#3b82f6]/5 to-transparent",
      iconColor: "text-[#3b82f6]",
      trend: "+8.2%",
      trendUp: true,
    },
    {
      label: "Active Products",
      value: (data?.activeProducts ?? 0).toLocaleString(),
      icon: Package,
      gradient: "from-[#8b5cf6] to-[#7c3aed]",
      bgGradient: "from-[#8b5cf6]/15 via-[#8b5cf6]/5 to-transparent",
      iconColor: "text-[#8b5cf6]",
      trend: "+3",
      trendUp: true,
    },
    {
      label: "Total Customers",
      value: (data?.totalCustomers ?? 0).toLocaleString(),
      icon: Users,
      gradient: "from-[#10b981] to-[#059669]",
      bgGradient: "from-[#10b981]/15 via-[#10b981]/5 to-transparent",
      iconColor: "text-[#10b981]",
      trend: "+15",
      trendUp: true,
    },
    {
      label: "Pending Expenses",
      value: (data?.pendingExpenses ?? 0).toLocaleString(),
      icon: AlertTriangle,
      gradient: "from-[#f43f5e] to-[#e11d48]",
      bgGradient: "from-[#f43f5e]/15 via-[#f43f5e]/5 to-transparent",
      iconColor: "text-[#f43f5e]",
      trend: `${data?.pendingExpenses ?? 0}`,
      trendUp: false,
    },
    {
      label: "Low Stock Items",
      value: (data?.lowStockItems ?? 0).toLocaleString(),
      icon: AlertTriangle,
      gradient: "from-[#f59e0b] to-[#d97706]",
      bgGradient: "from-[#f59e0b]/15 via-[#f59e0b]/5 to-transparent",
      iconColor: "text-[#f59e0b]",
      trend: `${data?.lowStockItems ?? 0}`,
      trendUp: false,
    },
  ];

  const quickActions = [
    { label: "View Reports", href: "/dashboard/reports", icon: BarChart3, color: "text-[#3b82f6]" },
    { label: "Manage Users", href: "/dashboard/users", icon: Shield, color: "text-[#8b5cf6]" },
    { label: "Shop", href: "/shop", icon: Store, color: "text-[#d4a843]" },
    { label: "Settings", href: "/dashboard/settings", icon: Settings, color: "text-[#10b981]" },
    { label: "Audit Logs", href: "/dashboard/audit-logs", icon: FileText, color: "text-[#f59e0b]" },
    { label: "Add User", href: "/dashboard/users", icon: UserPlus, color: "text-[#f43f5e]" },
  ];

  const recentActivity = [
    { icon: ShoppingCart, label: "New sale recorded", detail: "Invoice #INV-2024-042", time: "2 min ago", color: "text-[#10b981]" },
    { icon: CreditCard, label: "Payment received", detail: "₦45,000 via Flutterwave", time: "5 min ago", color: "text-[#3b82f6]" },
    { icon: AlertTriangle, label: "Low stock alert", detail: "3 products below threshold", time: "12 min ago", color: "text-[#f59e0b]" },
    { icon: Package, label: "Stock updated", detail: "25 items added to inventory", time: "1 hr ago", color: "text-[#8b5cf6]" },
    { icon: Users, label: "New customer", detail: "Oluwaseun Adebayo registered", time: "2 hr ago", color: "text-[#d4a843]" },
  ];

  const salesBreakdown = [
    { name: "Products", value: 68 },
    { name: "Services", value: 22 },
    { name: "Bookings", value: 10 },
  ];

  return (
    <DashboardLayout role="OWNER" title="Owner Dashboard">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="glass-card group relative overflow-hidden p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
                <div className="relative">
                  <div className="flex items-start justify-between">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                      <Icon size={18} className="text-white" />
                    </div>
                    <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                      stat.trendUp ? "bg-[#10b981]/15 text-[#10b981]" : "bg-[#f43f5e]/15 text-[#f43f5e]"
                    }`}>
                      {stat.trendUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {stat.trendUp ? stat.trend : stat.trend}
                    </span>
                  </div>
                  <p className="mt-3 text-2xl font-bold text-[#f0f0f5]">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-sm text-[#9090a0]">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Revenue Chart */}
          <div className="glass-card p-6 xl:col-span-2">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#f0f0f5]">
                  Revenue Overview
                </h3>
                <p className="text-sm text-[#9090a0]">Monthly revenue for {new Date().getFullYear()}</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#10b981]">
                <TrendingUp size={16} />
                <span className="font-medium">+12.5% vs last year</span>
              </div>
            </div>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.monthlyRevenue ?? []}>
                  <defs>
                    <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d4a843" stopOpacity={0.4} />
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
                      borderRadius: "12px",
                      color: "#f0f0f5",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                    }}
                    formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#d4a843"
                    strokeWidth={2.5}
                    fill="url(#goldGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sales Breakdown Donut */}
          <div className="glass-card p-6">
            <h3 className="mb-2 text-lg font-semibold text-[#f0f0f5]">
              Sales Breakdown
            </h3>
            <p className="mb-4 text-sm text-[#9090a0]">By category</p>
            <div className="flex h-[200px] items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={salesBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    dataKey="value"
                    strokeWidth={2}
                    stroke="#16161f"
                  >
                    {salesBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#16161f",
                      border: "1px solid #2a2a3a",
                      borderRadius: "8px",
                      color: "#f0f0f5",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-2">
              {salesBreakdown.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                    <span className="text-sm text-[#9090a0]">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium text-[#f0f0f5]">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions + Recent Activity */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="glass-card p-6">
            <h3 className="mb-4 text-lg font-semibold text-[#f0f0f5]">
              Quick Actions
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="group flex flex-col items-center gap-2 rounded-xl border border-[#2a2a3a] bg-[#1c1c28]/50 p-4 transition-all duration-200 hover:border-[#d4a843]/30 hover:bg-[#1c1c28] hover:shadow-lg hover:shadow-black/20"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2a2a3a]/50 transition-all group-hover:bg-[#2a2a3a]">
                      <Icon size={20} className={action.color} />
                    </div>
                    <span className="text-xs font-medium text-[#f0f0f5]">{action.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#f0f0f5]">
                Recent Activity
              </h3>
              <Clock size={16} className="text-[#606070]" />
            </div>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <div key={index} className="flex items-center gap-3 rounded-xl border border-[#2a2a3a] bg-[#1c1c28]/50 p-3 transition-all hover:bg-[#1c1c28]">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-[#2a2a3a]/50 ${activity.color}`}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#f0f0f5]">{activity.label}</p>
                      <p className="text-xs text-[#606070]">{activity.detail}</p>
                    </div>
                    <span className="text-xs text-[#606070]">{activity.time}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Sales + Top Products */}
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
                  className="flex items-center justify-between rounded-xl border border-[#2a2a3a] bg-[#1c1c28] p-3 transition-all hover:bg-[#1c1c28]/80"
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
