"use client";

import { useState, useEffect } from "react";
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
  TrendingUp,
  TrendingDown,
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
  category: { id: string; name: string } | null;
  supplier: { id: string; name: string } | null;
}

interface Category {
  id: string;
  name: string;
  _count: { products: number };
}

interface ProductData {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}

export default function InventoryDashboard() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const [data, setData] = useState<ProductData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter]);

  useEffect(() => {
    fetchProducts();
  }, [search, categoryFilter, page]);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (categoryFilter) params.set("categoryId", categoryFilter);
      params.set("page", String(page));
      params.set("limit", "10");
      const res = await fetch(`/api/products?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const json = await res.json();
        setCategories(json.categories ?? json ?? []);
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  }

  const allProducts = data?.products ?? [];
  const totalProducts = data?.total ?? 0;
  const lowStockItems = allProducts.filter(
    (p) => p.stockQuantity > 0 && p.stockQuantity <= p.minStockLevel
  ).length;
  const outOfStock = allProducts.filter((p) => p.stockQuantity === 0).length;
  const categoriesCount = categories.length;
  const stockValue = allProducts.reduce(
    (sum, p) => sum + p.price * p.stockQuantity,
    0
  );

  const stats = [
    {
      label: t("totalProducts"),
      value: totalProducts,
      icon: Package,
      color: "from-[#d4a843]/20 to-[#d4a843]/5",
      iconColor: "text-[#d4a843]",
    },
    {
      label: t("lowStockItems"),
      value: lowStockItems,
      icon: AlertTriangle,
      color: "from-[#f59e0b]/20 to-[#f59e0b]/5",
      iconColor: "text-[#f59e0b]",
    },
    {
      label: t("outOfStock"),
      value: outOfStock,
      icon: XCircle,
      color: "from-[#f43f5e]/20 to-[#f43f5e]/5",
      iconColor: "text-[#f43f5e]",
    },
    {
      label: t("categories"),
      value: categoriesCount,
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

  function getStockStatus(product: Product) {
    if (product.stockQuantity === 0) return { label: "Out of Stock", className: "badge-danger" };
    if (product.stockQuantity <= product.minStockLevel) return { label: "Low Stock", className: "badge-warning" };
    return { label: "In Stock", className: "badge-success" };
  }

  const userRole = (session?.user as any)?.role as string | undefined;

  return (
    <DashboardLayout role={(userRole as any) || "WAREHOUSE_MANAGER"} title={t("inventoryDashboard")}>
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

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-[#f0f0f5]">{t("products")}</h3>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606070]" />
              <input
                type="text"
                placeholder="Search products..."
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
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <button onClick={fetchProducts} className="btn btn-secondary btn-sm">
              <RefreshCw size={14} />
            </button>
          </div>
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
                    <th>Image</th>
                    <th>Name</th>
                    <th>SKU</th>
                    <th>Category</th>
                    <th>Stock Qty</th>
                    <th>Min Level</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allProducts.map((product) => {
                    const status = getStockStatus(product);
                    return (
                      <tr key={product.id}>
                        <td>
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="h-10 w-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1c1c28]">
                              <Package size={16} className="text-[#606070]" />
                            </div>
                          )}
                        </td>
                        <td className="font-medium text-[#f0f0f5]">{product.name}</td>
                        <td className="font-mono text-xs text-[#9090a0]">{product.sku}</td>
                        <td className="text-[#9090a0]">{product.category?.name ?? "—"}</td>
                        <td>
                          <span className={`font-semibold ${
                            product.stockQuantity === 0
                              ? "text-[#f43f5e]"
                              : product.stockQuantity <= product.minStockLevel
                              ? "text-[#f59e0b]"
                              : "text-[#10b981]"
                          }`}>
                            {product.stockQuantity} {product.unit}
                          </span>
                        </td>
                        <td className="text-[#9090a0]">{product.minStockLevel}</td>
                        <td className="font-medium text-[#d4a843]">
                          {formatCurrency(product.price)}
                        </td>
                        <td>
                          <span className={`badge ${status.className}`}>{status.label}</span>
                        </td>
                        <td>
                          <Link
                            href={`/dashboard/inventory/products?id=${product.id}`}
                            className="btn btn-secondary btn-sm"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                  {allProducts.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center text-[#606070] py-8">
                        No products found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <Pagination currentPage={data?.page ?? 1} totalPages={data?.totalPages ?? 1} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
