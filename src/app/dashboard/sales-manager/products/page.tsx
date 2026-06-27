"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useTranslation } from "@/contexts/LanguageContext";
import { formatCurrency } from "@/lib/utils";
import { Search, Package, Eye } from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stockQuantity: number;
  unit: string;
  image: string | null;
  category: { id: string; name: string } | null;
}

interface Category {
  id: string;
  name: string;
}

export default function SalesProductsPage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  async function fetchProducts() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (categoryFilter) params.set("categoryId", categoryFilter);
      params.set("limit", "100");
      params.set("isActive", "true");
      const res = await fetch(`/api/products?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  }

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [categoryFilter]);

  return (
    <DashboardLayout role="SALES_MANAGER" title={t("products")}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#f0f0f5]">{t("products")}</h2>
            <p className="text-sm text-[#9090a0]">{t("viewOnlyAccess")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white" />
              <input
                type="text"
                placeholder={t("searchProducts")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchProducts()}
                className="input w-64 pl-10"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input select w-auto"
            >
              <option value="">{t("allCategories")}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex h-[40vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4a843] border-t-transparent" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="rounded-2xl border border-[#2a2a3a] bg-[#111118] p-4 transition-all hover:border-[#d4a843]/30"
              >
                <div className="mb-3 flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-[#1c1c28]">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Package size={32} className="text-[#3a3a4a]" />
                  )}
                </div>
                <h3 className="truncate text-sm font-medium text-[#f0f0f5]">
                  {product.name}
                </h3>
                <p className="mt-0.5 text-xs text-[#606070]">{product.sku}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-lg font-bold text-[#d4a843]">
                    {formatCurrency(product.price)}
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      product.stockQuantity > 10
                        ? "text-[#10b981]"
                        : product.stockQuantity > 0
                        ? "text-[#f59e0b]"
                        : "text-[#f43f5e]"
                    }`}
                  >
                    {product.stockQuantity} {product.unit}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="rounded-md bg-[#1c1c28] px-2 py-0.5 text-[10px] text-[#9090a0]">
                    {product.category?.name || t("noCategoryOption")}
                  </span>
                  <button
                    onClick={() => setSelectedProduct(product)}
                    className="rounded-lg p-1.5 text-[#606070] hover:bg-[#1c1c28] hover:text-[#9090a0]"
                  >
                    <Eye size={14} />
                  </button>
                </div>
              </div>
            ))}
            {products.length === 0 && (
              <div className="col-span-full flex h-48 items-center justify-center text-[#606070]">
                {t("noProductsFound")}
              </div>
            )}
          </div>
        )}

        {/* Product Detail Modal */}
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSelectedProduct(null)}>
            <div className="w-full max-w-md rounded-2xl border border-[#2a2a3a] bg-[#111118] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#f0f0f5]">{t("product")}</h3>
                <button onClick={() => setSelectedProduct(null)} className="text-[#606070] hover:text-[#f0f0f5]">✕</button>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#9090a0]">{t("nameCol")}</span>
                  <span className="text-[#f0f0f5]">{selectedProduct.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#9090a0]">{t("skuCol")}</span>
                  <span className="text-[#f0f0f5]">{selectedProduct.sku}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#9090a0]">{t("priceCol")}</span>
                  <span className="font-bold text-[#d4a843]">{formatCurrency(selectedProduct.price)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#9090a0]">{t("stockCol")}</span>
                  <span className="text-[#f0f0f5]">{selectedProduct.stockQuantity} {selectedProduct.unit}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#9090a0]">{t("categoryCol")}</span>
                  <span className="text-[#f0f0f5]">{selectedProduct.category?.name || "N/A"}</span>
                </div>
              </div>
              <div className="mt-6">
                <p className="text-xs text-[#606070] text-center">{t("viewOnlyAccess")}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
