"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  ShoppingCart,
  TrendingUp,
  DollarSign,
  ArrowRight,
  Lock,
  Unlock,
  Receipt,
  Eye,
} from "lucide-react";

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
  const [data, setData] = useState<CashierData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/dashboard/manager");
        if (res.ok) {
          const json = await res.json();
          setData({
            todaySales: json.todayRevenue ?? 0,
            transactions: json.todaySales ?? 0,
            averageSale:
              json.todaySales > 0
                ? Math.round((json.todayRevenue ?? 0) / json.todaySales)
                : 0,
            openDrawer: true,
            pendingOrders: 0,
            recentSales: [],
            drawerStatus: {
              isOpen: true,
              openingBalance: 50000,
              openedAt: new Date().toISOString(),
            },
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
      <DashboardLayout role="SALES_REP" title="Cashier Dashboard">
        <div className="flex h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4a843] border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  const stats = [
    {
      label: "Today's Sales",
      value: formatCurrency(data?.todaySales ?? 0),
      icon: DollarSign,
      color: "from-[#d4a843]/20 to-[#d4a843]/5",
      iconColor: "text-[#d4a843]",
    },
    {
      label: "Transactions",
      value: (data?.transactions ?? 0).toLocaleString(),
      icon: ShoppingCart,
      color: "from-[#3b82f6]/20 to-[#3b82f6]/5",
      iconColor: "text-[#3b82f6]",
    },
    {
      label: "Average Sale",
      value: formatCurrency(data?.averageSale ?? 0),
      icon: TrendingUp,
      color: "from-[#8b5cf6]/20 to-[#8b5cf6]/5",
      iconColor: "text-[#8b5cf6]",
    },
    {
      label: "Open Drawer",
      value: data?.drawerStatus.isOpen ? "Open" : "Closed",
      icon: data?.drawerStatus.isOpen ? Unlock : Lock,
      color: data?.drawerStatus.isOpen
        ? "from-[#10b981]/20 to-[#10b981]/5"
        : "from-[#f43f5e]/20 to-[#f43f5e]/5",
      iconColor: data?.drawerStatus.isOpen
        ? "text-[#10b981]"
        : "text-[#f43f5e]",
    },
    {
      label: "Pending Orders",
      value: (data?.pendingOrders ?? 0).toLocaleString(),
      icon: Receipt,
      color: "from-[#f59e0b]/20 to-[#f59e0b]/5",
      iconColor: "text-[#f59e0b]",
    },
  ];

  const quickActions = [
    {
      label: "Open POS Terminal",
      href: "/dashboard/pos",
      icon: ShoppingCart,
      primary: true,
    },
    {
      label: "Open Drawer",
      href: "#",
      icon: Unlock,
      primary: false,
    },
    {
      label: "Close Drawer",
      href: "#",
      icon: Lock,
      primary: false,
    },
    {
      label: "View My Sales",
      href: "/dashboard/my-sales",
      icon: Eye,
      primary: false,
    },
  ];

  return (
    <DashboardLayout role="SALES_REP" title="Cashier Dashboard">
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

        <div className="glass-card p-8">
          <div className="text-center">
            <h3 className="mb-2 text-lg font-semibold text-[#f0f0f5]">
              POS Terminal
            </h3>
            <p className="mb-6 text-sm text-[#9090a0]">
              Start a new sale transaction
            </p>
            <Link
              href="/dashboard/pos"
              className="btn-primary btn-lg inline-flex items-center gap-3 rounded-2xl px-12 py-6 text-lg font-bold"
            >
              <ShoppingCart size={24} />
              Open POS Terminal
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="glass-card p-6">
            <h3 className="mb-4 text-lg font-semibold text-[#f0f0f5]">
              Drawer Status
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-[#2a2a3a] bg-[#1c1c28] p-4">
                <div className="flex items-center gap-3">
                  {data?.drawerStatus.isOpen ? (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#10b981]/15">
                      <Unlock size={20} className="text-[#10b981]" />
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f43f5e]/15">
                      <Lock size={20} className="text-[#f43f5e]" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-[#f0f0f5]">
                      Cash Drawer
                    </p>
                    <p className="text-xs text-[#606070]">
                      {data?.drawerStatus.isOpen
                        ? "Drawer is open"
                        : "Drawer is closed"}
                    </p>
                  </div>
                </div>
                <span
                  className={`badge ${
                    data?.drawerStatus.isOpen ? "badge-success" : "badge-danger"
                  }`}
                >
                  {data?.drawerStatus.isOpen ? "OPEN" : "CLOSED"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[#2a2a3a] bg-[#1c1c28] p-3">
                  <p className="text-xs text-[#606070]">Opening Balance</p>
                  <p className="text-lg font-bold text-[#d4a843]">
                    {formatCurrency(data?.drawerStatus.openingBalance ?? 0)}
                  </p>
                </div>
                <div className="rounded-xl border border-[#2a2a3a] bg-[#1c1c28] p-3">
                  <p className="text-xs text-[#606070]">Opened At</p>
                  <p className="text-sm font-medium text-[#f0f0f5]">
                    {data?.drawerStatus.openedAt
                      ? formatDateTime(data.drawerStatus.openedAt)
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="mb-4 text-lg font-semibold text-[#f0f0f5]">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.label}
                    href={action.href}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-4 transition-all ${
                      action.primary
                        ? "border-[#d4a843]/30 bg-gradient-to-br from-[#d4a843]/20 to-[#d4a843]/5 text-[#d4a843] hover:from-[#d4a843]/30 hover:to-[#d4a843]/10"
                        : "border-[#2a2a3a] bg-[#1c1c28] text-[#9090a0] hover:border-[#3a3a4a] hover:text-[#f0f0f5]"
                    }`}
                  >
                    <Icon size={20} />
                    <span className="text-sm font-medium">{action.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-[#f0f0f5]">
            Today's Recent Sales
          </h3>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Amount</th>
                  <th>Payment</th>
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
                    <td className="font-medium text-[#d4a843]">
                      {formatCurrency(sale.total)}
                    </td>
                    <td className="text-[#9090a0]">{sale.paymentMethod}</td>
                    <td className="text-[#9090a0]">
                      {formatDateTime(sale.createdAt)}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          sale.status === "COMPLETED"
                            ? "badge-success"
                            : "badge-warning"
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
                      No sales recorded today
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
