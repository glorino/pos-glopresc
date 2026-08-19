"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useTranslation } from "@/contexts/LanguageContext";
import {
  ChefHat,
  Package,
  AlertTriangle,
  ClipboardList,
  Utensils,
  ArrowRight,
  TrendingDown,
  Clock,
  Download,
  CheckCircle,
} from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  isAvailable: boolean;
  stockQuantity?: number;
}

interface Order {
  id: string;
  invoiceNumber: string;
  total: number;
  status: string;
  createdAt: string;
  items?: { name: string; quantity: number }[];
}

interface LowStockItem {
  id: string;
  name: string;
  stockQuantity: number;
  minStockLevel: number;
  unit?: string;
}

interface WasteReport {
  id: string;
  itemName: string;
  quantityWasted: number;
  reason: string;
  date: string;
}

export default function ChefDashboard() {
  const router = useRouter();
  const { t } = useTranslation();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [prodRes, orderRes, stockRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/sales"),
          fetch("/api/inventory/stock"),
        ]);
        if (prodRes.ok) {
          const d = await prodRes.json();
          setMenuItems(Array.isArray(d) ? d : d.products ?? []);
        }
        if (orderRes.ok) {
          const d = await orderRes.json();
          setOrders(Array.isArray(d) ? d : d.sales ?? []);
        }
        if (stockRes.ok) {
          const d = await stockRes.json();
          const items = Array.isArray(d) ? d : d.stock ?? [];
          setLowStock(items.filter((i: LowStockItem) => i.stockQuantity <= i.minStockLevel));
        }
      } catch (error) {
        console.error("Failed to fetch chef dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayOrders = orders.filter((o) => o.createdAt?.startsWith(todayStr));

  const mockWasteReports: WasteReport[] = [
    { id: "1", itemName: "Fresh Tomatoes", quantityWasted: 5, reason: "Spoiled", date: "2026-08-17" },
    { id: "2", itemName: "Chicken Breast", quantityWasted: 3, reason: "Expired", date: "2026-08-16" },
    { id: "3", itemName: "Lettuce", quantityWasted: 2, reason: "Wilting", date: "2026-08-15" },
  ];

  const exportToCSV = () => {
    const rows = orders.map((o) => [o.invoiceNumber, o.total, o.status, o.createdAt].join(","));
    const csv = "Invoice,Total,Status,Date\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kitchen-orders.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <DashboardLayout title="Chief Chef Dashboard">
        <div className="flex h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4a843] border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  const stats = [
    {
      label: "Menu Items",
      value: menuItems.length.toLocaleString(),
      icon: ChefHat,
      gradient: "from-[#d4a843] to-[#b8942f]",
      bgGradient: "from-[#d4a843]/15 via-[#d4a843]/5 to-transparent",
      iconColor: "text-[#d4a843]",
    },
    {
      label: "Low Stock",
      value: lowStock.length.toLocaleString(),
      icon: AlertTriangle,
      gradient: "from-[#f43f5e] to-[#e11d48]",
      bgGradient: "from-[#f43f5e]/15 via-[#f43f5e]/5 to-transparent",
      iconColor: "text-[#f43f5e]",
    },
    {
      label: "Today's Orders",
      value: todayOrders.length.toLocaleString(),
      icon: ClipboardList,
      gradient: "from-[#3b82f6] to-[#2563eb]",
      bgGradient: "from-[#3b82f6]/15 via-[#3b82f6]/5 to-transparent",
      iconColor: "text-[#3b82f6]",
    },
    {
      label: "Waste Reports",
      value: mockWasteReports.length.toLocaleString(),
      icon: Package,
      gradient: "from-[#f59e0b] to-[#d97706]",
      bgGradient: "from-[#f59e0b]/15 via-[#f59e0b]/5 to-transparent",
      iconColor: "text-[#f59e0b]",
    },
  ];

  const quickActions = [
    { label: "View Products", action: () => router.push("/dashboard/inventory/products"), icon: Utensils, color: "text-[#d4a843]" },
    { label: "Stock", action: () => router.push("/dashboard/inventory/stock"), icon: Package, color: "text-[#3b82f6]" },
    { label: "Categories", action: () => router.push("/dashboard/inventory/categories"), icon: ClipboardList, color: "text-[#8b5cf6]" },
    { label: "Finished Products", action: () => router.push("/dashboard/inventory/finished"), icon: ChefHat, color: "text-[#10b981]" },
  ];

  return (
    <DashboardLayout title="Chief Chef Dashboard">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="glass-card group relative overflow-hidden p-5 transition-all duration-300 hover:scale-[1.02]"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
                <div className="relative">
                  <div className="flex items-start justify-between">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                      <Icon size={18} className="text-white" />
                    </div>
                    {stat.label === "Low Stock" && lowStock.length > 0 && (
                      <span className="rounded-full bg-[#f43f5e]/15 px-2 py-0.5 text-xs font-medium text-[#f43f5e]">
                        {lowStock.length}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-2xl font-bold text-[#f0f0f5]">{stat.value}</p>
                  <p className="mt-1 text-sm text-[#9090a0]">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="glass-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-[#f0f0f5]">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={action.action}
                  className="group flex flex-col items-center gap-2 rounded-xl border border-[#2a2a3a] bg-[#1c1c28]/50 p-4 transition-all duration-200 hover:border-[#d4a843]/30 hover:bg-[#1c1c28] hover:shadow-lg"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2a2a3a]/50 transition-all group-hover:bg-[#2a2a3a]">
                    <Icon size={20} className={action.color} />
                  </div>
                  <span className="text-xs font-medium text-[#f0f0f5]">{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {/* Low Stock Alerts */}
          <div className="glass-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-[#f43f5e]" />
                <h3 className="text-lg font-semibold text-[#f0f0f5]">Low Stock Alerts</h3>
              </div>
              <button
                onClick={() => router.push("/dashboard/inventory/stock")}
                className="flex items-center gap-1 text-sm text-[#d4a843] hover:text-[#b8942f]"
              >
                View All <ArrowRight size={14} />
              </button>
            </div>
            <div className="space-y-3">
              {lowStock.length === 0 ? (
                <div className="flex items-center justify-center rounded-xl border border-[#10b981]/20 bg-[#10b981]/5 p-6">
                  <CheckCircle size={18} className="mr-2 text-[#10b981]" />
                  <span className="text-sm text-[#9090a0]">All ingredients are well stocked</span>
                </div>
              ) : (
                lowStock.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-[#f43f5e]/20 bg-[#f43f5e]/5 p-3 transition-all hover:bg-[#f43f5e]/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f43f5e]/10">
                        <Package size={14} className="text-[#f43f5e]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#f0f0f5]">{item.name}</p>
                        <p className="text-xs text-[#606070]">Min: {item.minStockLevel} {item.unit ?? "units"}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-[#f43f5e]/15 px-2 py-0.5 text-xs font-medium text-[#f43f5e]">
                      {item.stockQuantity} left
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="glass-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#f0f0f5]">Recent Orders</h3>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-1 rounded-lg border border-[#2a2a3a] bg-[#1c1c28]/50 px-3 py-1.5 text-xs font-medium text-[#9090a0] transition-all hover:border-[#d4a843]/30 hover:text-[#f0f0f5]"
              >
                <Download size={12} /> Export
              </button>
            </div>
            <div className="space-y-3">
              {orders.slice(0, 6).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-xl border border-[#2a2a3a] bg-[#1c1c28]/50 p-3 transition-all hover:bg-[#1c1c28]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2a2a3a]/50">
                      <ClipboardList size={14} className="text-[#3b82f6]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#f0f0f5]">{order.invoiceNumber}</p>
                      <p className="text-xs text-[#606070]">
                        {order.items?.length ?? 0} item{(order.items?.length ?? 0) !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[#d4a843]">₦{order.total?.toLocaleString()}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        order.status === "COMPLETED"
                          ? "bg-[#10b981]/15 text-[#10b981]"
                          : order.status === "CANCELLED"
                          ? "bg-[#f43f5e]/15 text-[#f43f5e]"
                          : "bg-[#f59e0b]/15 text-[#f59e0b]"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
              {orders.length === 0 && (
                <p className="text-center text-sm text-[#606070]">No orders today</p>
              )}
            </div>
          </div>
        </div>

        {/* Waste Reports */}
        <div className="glass-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown size={18} className="text-[#f59e0b]" />
              <h3 className="text-lg font-semibold text-[#f0f0f5]">Recent Waste Reports</h3>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {mockWasteReports.map((report) => (
              <div
                key={report.id}
                className="rounded-xl border border-[#f59e0b]/20 bg-[#f59e0b]/5 p-4 transition-all hover:bg-[#f59e0b]/10"
              >
                <div className="mb-2 flex items-center gap-2">
                  <TrendingDown size={14} className="text-[#f59e0b]" />
                  <span className="text-sm font-medium text-[#f0f0f5]">{report.itemName}</span>
                </div>
                <p className="text-xs text-[#9090a0]">{report.reason}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-lg font-bold text-[#f59e0b]">{report.quantityWasted}</span>
                  <span className="text-xs text-[#606070]">{report.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
