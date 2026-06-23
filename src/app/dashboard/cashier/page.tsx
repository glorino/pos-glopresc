"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { useTranslation } from "@/contexts/LanguageContext";
import {
  ShoppingCart,
  TrendingUp,
  DollarSign,
  ArrowRight,
  Lock,
  Unlock,
  Receipt,
  Eye,
  Search,
  CreditCard,
  Banknote,
  Smartphone,
  Clock,
  Zap,
  Package,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface CashierData {
  todaySales: number;
  transactions: number;
  averageSale: number;
  openDrawer: boolean;
  pendingOrders: number;
  recentSales: {
    id: string;
    invoiceNumber: string;
    total: number;
    createdAt: string;
    paymentMethod: string;
    status: string;
  }[];
  drawerStatus: {
    isOpen: boolean;
    openingBalance: number;
    openedAt: string | null;
  };
}

export default function CashierDashboard() {
  const { t } = useTranslation();
  const [data, setData] = useState<CashierData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [animatedValues, setAnimatedValues] = useState({
    todaySales: 0,
    transactions: 0,
    averageSale: 0,
  });
  const [paymentMethods, setPaymentMethods] = useState<{ name: string; count: number; color: string }[]>([]);
  const [registerDate, setRegisterDate] = useState(new Date().toISOString().split("T")[0]);
  const [dailySummary, setDailySummary] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/dashboard/cashier");
        if (res.ok) {
          const json = await res.json();
          setData({
            todaySales: json.todaySales ?? 0,
            transactions: json.transactions ?? 0,
            averageSale: json.averageSale ?? 0,
            openDrawer: json.drawerStatus?.isOpen ?? false,
            pendingOrders: json.pendingOrders ?? 0,
            recentSales: json.recentSales ?? [],
            drawerStatus: {
              isOpen: json.drawerStatus?.isOpen ?? false,
              openingBalance: json.drawerStatus?.openingBalance ?? 0,
              openedAt: json.drawerStatus?.openedAt ?? null,
            },
          });
          const paymentMethodsData = (json.paymentMethods ?? []).map((pm: any) => ({
            name: pm.name,
            count: pm.count,
            color: pm.name === "CASH" ? "#10b981" : pm.name === "CARD" ? "#3b82f6" : pm.name === "TRANSFER" ? "#8b5cf6" : pm.name === "USSD" ? "#f59e0b" : "#ec4899",
          }));
          setPaymentMethods(paymentMethodsData);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (!data) return;
    const duration = 1200;
    const steps = 40;
    const interval = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedValues({
        todaySales: Math.round((data.todaySales ?? 0) * eased),
        transactions: Math.round((data.transactions ?? 0) * eased),
        averageSale: Math.round((data.averageSale ?? 0) * eased),
      });
      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, [data]);

  useEffect(() => {
    fetch(`/api/cashier/daily-summary?date=${registerDate}`)
      .then((res) => res.json())
      .then((data) => setDailySummary(data))
      .catch(() => {});
  }, [registerDate]);

  if (loading) {
    return (
      <DashboardLayout role="SALES_REP" title={t("salesRepDashboard")}>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4a843] border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  const stats = [
    {
      label: t("todaySales"),
      value: formatCurrency(animatedValues.todaySales),
      icon: DollarSign,
      gradient: "from-[#d4a843] to-[#b8942f]",
      bgGradient: "from-[#d4a843]/15 via-[#d4a843]/5 to-transparent",
      iconColor: "text-white",
    },
    {
      label: t("transactions"),
      value: animatedValues.transactions.toLocaleString(),
      icon: ShoppingCart,
      gradient: "from-[#3b82f6] to-[#2563eb]",
      bgGradient: "from-[#3b82f6]/15 via-[#3b82f6]/5 to-transparent",
      iconColor: "text-white",
    },
    {
      label: t("averageSale"),
      value: formatCurrency(animatedValues.averageSale),
      icon: TrendingUp,
      gradient: "from-[#8b5cf6] to-[#7c3aed]",
      bgGradient: "from-[#8b5cf6]/15 via-[#8b5cf6]/5 to-transparent",
      iconColor: "text-white",
    },
    {
      label: t("cashDrawer"),
      value: data?.drawerStatus.isOpen ? "Open" : "Closed",
      icon: data?.drawerStatus.isOpen ? Unlock : Lock,
      gradient: data?.drawerStatus.isOpen ? "from-[#10b981] to-[#059669]" : "from-[#f43f5e] to-[#e11d48]",
      bgGradient: data?.drawerStatus.isOpen ? "from-[#10b981]/15 via-[#10b981]/5 to-transparent" : "from-[#f43f5e]/15 via-[#f43f5e]/5 to-transparent",
      iconColor: "text-white",
    },
    {
      label: t("pendingOrders"),
      value: (data?.pendingOrders ?? 0).toLocaleString(),
      icon: Receipt,
      gradient: "from-[#f59e0b] to-[#d97706]",
      bgGradient: "from-[#f59e0b]/15 via-[#f59e0b]/5 to-transparent",
      iconColor: "text-white",
    },
  ];

  return (
    <DashboardLayout role="SALES_REP" title="Sales Rep Dashboard">
      <div className="space-y-6">
        {/* Hero POS Card */}
        <div className="glass-card relative overflow-hidden p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-[#d4a843]/10 via-[#d4a843]/5 to-transparent" />
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#d4a843]/10 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-[#d4a843]/5 blur-3xl" />
          <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-bold text-[#f0f0f5]">
                Ready to sell?
              </h2>
              <p className="mt-2 text-[#9090a0]">
                Open your POS terminal to start processing transactions
              </p>
            </div>
            <Link
              href="/dashboard/cashier/pos"
              className="group flex items-center gap-4 rounded-2xl bg-gradient-to-r from-[#d4a843] to-[#b8942f] px-8 py-5 text-lg font-bold text-black shadow-lg shadow-[#d4a843]/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-[#d4a843]/30"
            >
              <ShoppingCart size={24} className="transition-transform group-hover:rotate-12" />
              Open POS Terminal
              <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="glass-card group relative overflow-hidden p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
                <div className="relative">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                    <Icon size={18} className={stat.iconColor} />
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

        {/* Daily Cash Register Summary */}
        <div className="glass-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#10b981] to-[#059669]">
                <Clock size={18} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#f0f0f5]">Daily Cash Register</h3>
                <p className="text-sm text-[#9090a0]">View register summary by date</p>
              </div>
            </div>
            <input
              type="date"
              value={registerDate}
              onChange={(e) => setRegisterDate(e.target.value)}
              className="input text-sm"
            />
          </div>
          {dailySummary && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-xl border border-[#2a2a3a] bg-[#1c1c28] p-4">
                <p className="text-xs text-[#9090a0]">Opening Balance</p>
                <p className="mt-1 text-lg font-bold text-[#f0f0f5]">{formatCurrency(dailySummary.drawer?.openingBalance ?? 0)}</p>
              </div>
              <div className="rounded-xl border border-[#2a2a3a] bg-[#1c1c28] p-4">
                <p className="text-xs text-[#9090a0]">Total Sales</p>
                <p className="mt-1 text-lg font-bold text-[#10b981]">{formatCurrency(dailySummary.totalSales)}</p>
              </div>
              <div className="rounded-xl border border-[#2a2a3a] bg-[#1c1c28] p-4">
                <p className="text-xs text-[#9090a0]">Cash Sales</p>
                <p className="mt-1 text-lg font-bold text-[#d4a843]">{formatCurrency(dailySummary.cashSales)}</p>
              </div>
              <div className="rounded-xl border border-[#2a2a3a] bg-[#1c1c28] p-4">
                <p className="text-xs text-[#9090a0]">Transactions</p>
                <p className="mt-1 text-lg font-bold text-[#3b82f6]">{dailySummary.totalTransactions}</p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Product Search */}
        <div className="glass-card p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4a843] to-[#b8942f]">
              <Search size={18} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#f0f0f5]">Quick Search</h3>
              <p className="text-sm text-[#9090a0]">Find products by name, barcode, or SKU</p>
            </div>
          </div>
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#606070]" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[#2a2a3a] bg-[#1c1c28] py-3 pl-12 pr-4 text-[#f0f0f5] placeholder-[#606070] outline-none transition-all focus:border-[#d4a843]/50 focus:ring-1 focus:ring-[#d4a843]/30"
            />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Recent Transactions */}
          <div className="glass-card p-6 xl:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#f0f0f5]">
                {t("recentTransactions")}
              </h3>
              <Link
                href="/dashboard/sales-manager/sales"
                className="flex items-center gap-1 text-sm text-[#d4a843] transition-colors hover:text-[#b8942f]"
              >
                View All <ArrowRight size={14} />
              </Link>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Amount</th>
                    <th>Payment</th>
                    <th>Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.recentSales?.map((sale) => (
                    <tr key={sale.id}>
                      <td className="font-medium text-[#f0f0f5]">
                        {sale.invoiceNumber}
                      </td>
                      <td className="font-medium text-[#d4a843]">
                        {formatCurrency(sale.total)}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          {sale.paymentMethod === "CASH" && <Banknote size={14} className="text-[#10b981]" />}
                          {sale.paymentMethod === "CARD" && <CreditCard size={14} className="text-[#3b82f6]" />}
                          {sale.paymentMethod === "TRANSFER" && <Banknote size={14} className="text-[#8b5cf6]" />}
                          {sale.paymentMethod === "MOBILE" && <Smartphone size={14} className="text-[#f59e0b]" />}
                          <span className="text-[#9090a0]">{sale.paymentMethod}</span>
                        </div>
                      </td>
                      <td className="text-[#9090a0]">
                        {formatDateTime(sale.createdAt)}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            sale.status === "COMPLETED"
                              ? "badge-success"
                              : sale.status === "PENDING"
                              ? "badge-warning"
                              : "badge-danger"
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
                        No transactions yet today
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Method Breakdown */}
          <div className="glass-card p-6">
            <h3 className="mb-4 text-lg font-semibold text-[#f0f0f5]">
              {t("paymentMethods")}
            </h3>
            <p className="mb-4 text-sm text-[#9090a0]">Today&apos;s breakdown</p>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentMethods} layout="vertical" barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" horizontal={false} />
                  <XAxis type="number" stroke="#606070" fontSize={12} />
                  <YAxis type="category" dataKey="name" stroke="#606070" fontSize={12} width={70} />
                  <Tooltip
                    contentStyle={{
                      background: "#16161f",
                      border: "1px solid #2a2a3a",
                      borderRadius: "8px",
                      color: "#f0f0f5",
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {paymentMethods.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {paymentMethods.map((method) => (
                <div key={method.name} className="flex items-center justify-between rounded-lg bg-[#1c1c28]/50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: method.color }} />
                    <span className="text-xs text-[#9090a0]">{method.name}</span>
                  </div>
                  <span className="text-xs font-medium text-[#f0f0f5]">{method.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Link
            href="/dashboard/cashier/pos"
            className="group glass-card flex flex-col items-center gap-3 p-5 transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4a843] to-[#b8942f] shadow-lg">
              <ShoppingCart size={22} className="text-white" />
            </div>
            <span className="text-sm font-medium text-[#f0f0f5]">POS Terminal</span>
          </Link>
          <Link
            href="/dashboard/sales-manager/sales"
            className="group glass-card flex flex-col items-center gap-3 p-5 transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#2563eb] shadow-lg">
              <BarChart3 size={22} className="text-white" />
            </div>
            <span className="text-sm font-medium text-[#f0f0f5]">My Sales</span>
          </Link>
          <Link
            href="/dashboard/sales-manager/products"
            className="group glass-card flex flex-col items-center gap-3 p-5 transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] shadow-lg">
              <Package size={22} className="text-white" />
            </div>
            <span className="text-sm font-medium text-[#f0f0f5]">Products</span>
          </Link>
          <Link
            href="/dashboard/sales-manager/customers"
            className="group glass-card flex flex-col items-center gap-3 p-5 transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#10b981] to-[#059669] shadow-lg">
              <Receipt size={22} className="text-white" />
            </div>
            <span className="text-sm font-medium text-[#f0f0f5]">Customers</span>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
