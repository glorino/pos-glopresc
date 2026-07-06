"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useTranslation } from "@/contexts/LanguageContext";
import { formatCurrency } from "@/lib/utils";
import {
  Package,
  AlertTriangle,
  XCircle,
  FolderOpen,
  DollarSign,
  Plus,
  ArrowUpDown,
  Eye,
  BarChart3,
  Search,
  Filter,
  RefreshCw,
} from "lucide-react";
import Pagination from "@/components/ui/Pagination";

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  costPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  maxStockLevel: number;
  unit: string;
  image: string | null;
  isActive: boolean;
  isRawMaterial: boolean;
  category: { id: string; name: string } | null;
  supplier: { id: string; name: string } | null;
}

interface FinishedProduct {
  id: string;
  name: string;
  sku: string;
  sellingPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  unit: string;
  image: string | null;
  isActive: boolean;
  addedToStore: boolean;
  quantityProduced: number;
  unitCost: number;
  category: { id: string; name: string } | null;
}

interface Category {
  id: string;
  name: string;
  _count: { products: number };
}

interface TabData {
  items: Product[] | FinishedProduct[];
  total: number;
  page: number;
  totalPages: number;
}

type TabKey = "all" | "raw" | "finished";

export default function InventoryDashboard() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [rawData, setRawData] = useState<TabData | null>(null);
  const [finishedData, setFinishedData] = useState<TabData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, activeTab]);

  const fetchRaw = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (categoryFilter) params.set("categoryId", categoryFilter);
    params.set("page", String(page));
    params.set("limit", "10");
    params.set("isRawMaterial", "true");
    const res = await fetch(`/api/products?${params.toString()}`);
    if (res.ok) {
      const json = await res.json();
      setRawData(json);
    }
  }, [search, categoryFilter, page]);

  const fetchFinished = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (categoryFilter) params.set("categoryId", categoryFilter);
    params.set("page", String(page));
    params.set("limit", "10");
    const res = await fetch(`/api/finished-products?${params.toString()}`);
    if (res.ok) {
      const json = await res.json();
      setFinishedData(json);
    }
  }, [search, categoryFilter, page]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchRaw(), fetchFinished()]).finally(() => setLoading(false));
  }, [fetchRaw, fetchFinished]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((json) => setCategories(json.categories ?? json ?? []))
      .catch(() => {});
  }, []);

  const rawProducts = rawData?.items ?? [];
  const finishedProducts = finishedData?.items ?? [];
  const rawTotal = rawData?.total ?? 0;
  const finishedTotal = finishedData?.total ?? 0;
  const allTotal = rawTotal + finishedTotal;

  const getDisplayData = (): (Product | FinishedProduct)[] => {
    if (activeTab === "raw") return rawProducts;
    if (activeTab === "finished") return finishedProducts;
    return [...rawProducts, ...finishedProducts];
  };

  const displayItems = getDisplayData();
  const displayTotal = activeTab === "raw" ? rawTotal : activeTab === "finished" ? finishedTotal : allTotal;
  const displayTotalPages = activeTab === "raw" ? (rawData?.totalPages ?? 1) : activeTab === "finished" ? (finishedData?.totalPages ?? 1) : Math.max(rawData?.totalPages ?? 1, finishedData?.totalPages ?? 1);

  const lowStockCount = [...rawProducts, ...finishedProducts].filter(
    (p) => {
      const sq = "stockQuantity" in p ? p.stockQuantity : 0;
      const ml = "minStockLevel" in p ? p.minStockLevel : 5;
      return sq > 0 && sq <= ml;
    }
  ).length;

  const outOfStockCount = [...rawProducts, ...finishedProducts].filter((p) => {
    const sq = "stockQuantity" in p ? p.stockQuantity : 0;
    return sq === 0;
  }).length;

  const stockValue = [...rawProducts, ...finishedProducts].reduce((sum, p) => {
    const price = "price" in p ? p.price : ("sellingPrice" in p ? (p as FinishedProduct).sellingPrice : 0);
    const sq = "stockQuantity" in p ? p.stockQuantity : 0;
    return sum + price * sq;
  }, 0);

  const stats = [
    {
      label: t("totalProducts"),
      value: displayTotal,
      icon: Package,
      color: "from-[#d4a843]/20 to-[#d4a843]/5",
      iconColor: "text-[#d4a843]",
    },
    {
      label: t("lowStockItems"),
      value: lowStockCount,
      icon: AlertTriangle,
      color: "from-[#f59e0b]/20 to-[#f59e0b]/5",
      iconColor: "text-[#f59e0b]",
    },
    {
      label: t("outOfStock"),
      value: outOfStockCount,
      icon: XCircle,
      color: "from-[#f43f5e]/20 to-[#f43f5e]/5",
      iconColor: "text-[#f43f5e]",
    },
    {
      label: t("categories"),
      value: categories.length,
      icon: FolderOpen,
      color: "from-[#8b5cf6]/20 to-[#8b5cf6]/5",
      iconColor: "text-[#8b5cf6]",
    },
    {
      label: t("stockValue"),
      value: formatCurrency(stockValue),
      icon: DollarSign,
      color: "from-[#10b981]/20 to-[#10b981]/5",
      iconColor: "text-[#10b981]",
    },
  ];

  const quickActions = [
    { label: t("addProduct"), href: "/dashboard/inventory/products?action=add", icon: Plus },
    { label: t("stockAdjustment"), href: "/dashboard/inventory/stock", icon: ArrowUpDown },
    { label: t("categories"), href: "/dashboard/inventory/categories", icon: Eye },
    { label: t("reports"), href: "/dashboard/owner/reports", icon: BarChart3 },
  ];

  const tabs: { key: TabKey; label: string }[] = [
    { key: "all", label: "All Products" },
    { key: "raw", label: "Raw Materials" },
    { key: "finished", label: "Finished Products" },
  ];

  function getStockStatus(item: Product | FinishedProduct) {
    const sq = item.stockQuantity;
    const ml = item.minStockLevel;
    if (sq === 0) return { label: t("outOfStock"), className: "badge-danger" };
    if (sq <= ml) return { label: t("lowStock"), className: "badge-warning" };
    return { label: t("inStock"), className: "badge-success" };
  }

  function isFinishedProduct(item: Product | FinishedProduct): item is FinishedProduct {
    return "quantityProduced" in item;
  }

  return (
    <DashboardLayout title={t("inventoryDashboard")}>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="stat-card">
                <div className="flex items-start justify-between">
                  <div className={`stat-icon bg-gradient-to-br ${stat.color}`}>
                    <Icon size={20} className={stat.iconColor} />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-bold text-[#f0f0f5]">
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

        {/* Products Section */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-[#f0f0f5]">{t("products")}</h3>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606070]" />
              <input
                type="text"
                placeholder={t("searchProducts")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10 w-64"
              />
            </div>
            <div className="relative">
              <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606070]" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="input select pl-10 w-48"
              >
                <option value="">{t("allCategories")}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <button onClick={() => { setLoading(true); Promise.all([fetchRaw(), fetchFinished()]).finally(() => setLoading(false)); }} className="btn btn-secondary btn-sm">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-[#d4a843] text-black"
                  : "bg-[#1c1c28] text-[#9090a0] hover:bg-[#2a2a3a] hover:text-[#f0f0f5]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="glass-card p-6">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4a843] border-t-transparent" />
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t("image")}</th>
                    <th>{t("name")}</th>
                    <th>{t("sku")}</th>
                    <th>{t("category")}</th>
                    <th>{t("stockQty")}</th>
                    <th>{t("minLevel")}</th>
                    <th>{activeTab === "finished" ? "Selling Price" : t("price")}</th>
                    <th>{t("status")}</th>
                    <th>{t("actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {displayItems.map((item) => {
                    const status = getStockStatus(item);
                    const fp = isFinishedProduct(item);
                    const price = fp ? item.sellingPrice : (item as Product).price;
                    return (
                      <tr key={item.id}>
                        <td>
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-10 w-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1c1c28]">
                              <Package size={16} className="text-[#606070]" />
                            </div>
                          )}
                        </td>
                        <td className="font-medium text-[#f0f0f5]">{item.name}</td>
                        <td className="font-mono text-xs text-[#9090a0]">{item.sku}</td>
                        <td className="text-[#9090a0]">{item.category?.name ?? "—"}</td>
                        <td>
                          <span className={`font-semibold ${
                            item.stockQuantity === 0
                              ? "text-[#f43f5e]"
                              : item.stockQuantity <= item.minStockLevel
                              ? "text-[#f59e0b]"
                              : "text-[#10b981]"
                          }`}>
                            {item.stockQuantity} {item.unit}
                          </span>
                        </td>
                        <td className="text-[#9090a0]">{item.minStockLevel}</td>
                        <td className="font-medium text-[#d4a843]">
                          {formatCurrency(price)}
                        </td>
                        <td>
                          <span className={`badge ${status.className}`}>{status.label}</span>
                        </td>
                        <td>
                          <Link
                            href={fp ? `/dashboard/inventory/products?id=${item.id}&type=finished` : `/dashboard/inventory/products?id=${item.id}`}
                            className="btn btn-secondary btn-sm"
                          >
                            {t("view")}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                  {displayItems.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center text-[#606070] py-8">
                        {t("noProductsFound")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {activeTab === "all" ? (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-[#9090a0]">
                    Showing {displayItems.length} of {displayTotal} products
                  </p>
                </div>
              ) : (
                <Pagination currentPage={page} totalPages={displayTotalPages} onPageChange={setPage} />
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
