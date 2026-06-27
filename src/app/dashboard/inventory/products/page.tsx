"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useTranslation } from "@/contexts/LanguageContext";
import { formatCurrency } from "@/lib/utils";
import {
  Search,
  Plus,
  Edit2,
  Package,
  AlertTriangle,
  Filter,
  X,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku: string;
  stockQuantity: number;
  minStockLevel: number;
  maxStockLevel: number;
  costPrice: number;
  price: number;
  unit: string;
  category: { id: string; name: string } | null;
  supplier: { id: string; name: string } | null;
  isActive: boolean;
  stockValue: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
}

interface Category {
  id: string;
  name: string;
}

export default function InventoryProductsPageWrapper() {
  return (
    <Suspense fallback={
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4a843] border-t-transparent" />
      </div>
    }>
      <InventoryProductsPage />
    </Suspense>
  );
}

function InventoryProductsPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [quickAdjustId, setQuickAdjustId] = useState<string | null>(null);
  const [adjustValue, setAdjustValue] = useState("");
  const [adjustType, setAdjustType] = useState<"add" | "subtract">("add");

  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    description: "",
    price: "",
    costPrice: "",
    stockQuantity: "",
    minStockLevel: "5",
    maxStockLevel: "1000",
    unit: "piece",
    barcode: "",
    categoryId: "",
  });
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState("");

  const userRole = (session?.user as any)?.role as string | undefined;
  const isReadOnly = userRole === "WAREHOUSE_REP";

  useEffect(() => {
    if (searchParams.get("action") === "add") {
      setShowAddModal(true);
    }
  }, [searchParams]);

  async function fetchProducts() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (categoryFilter) params.set("categoryId", categoryFilter);
      params.set("limit", "200");
      const res = await fetch(`/api/products?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(
          data.products.map((p: any) => ({
            ...p,
            stockValue: p.stockQuantity * p.costPrice,
            isLowStock: p.stockQuantity <= p.minStockLevel && p.stockQuantity > 0,
            isOutOfStock: p.stockQuantity === 0,
          }))
        );
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
        const json = await res.json();
        setCategories(json.categories ?? json ?? []);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  }

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [categoryFilter]);

  async function handleQuickAdjust(productId: string) {
    const qty = parseInt(adjustValue);
    if (!qty || qty <= 0) return;
    try {
      const res = await fetch("/api/stock-adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          type: adjustType === "add" ? "ADDITION" : "SUBTRACTION",
          quantity: qty,
          reason: `Quick ${adjustType} by inventory manager`,
        }),
      });
      if (res.ok) {
        setQuickAdjustId(null);
        setAdjustValue("");
        fetchProducts();
      }
    } catch (error) {
      console.error("Failed to adjust stock:", error);
    }
  }

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    setAddSaving(true);
    setAddError("");
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addForm.name,
          description: addForm.description || undefined,
          price: parseFloat(addForm.price),
          costPrice: addForm.costPrice ? parseFloat(addForm.costPrice) : 0,
          stockQuantity: addForm.stockQuantity ? parseInt(addForm.stockQuantity) : 0,
          minStockLevel: parseInt(addForm.minStockLevel) || 5,
          maxStockLevel: parseInt(addForm.maxStockLevel) || 1000,
          unit: addForm.unit || "piece",
          barcode: addForm.barcode || undefined,
          categoryId: addForm.categoryId || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create product");
      }
      setShowAddModal(false);
      setAddForm({
        name: "",
        description: "",
        price: "",
        costPrice: "",
        stockQuantity: "",
        minStockLevel: "5",
        maxStockLevel: "1000",
        unit: "piece",
        barcode: "",
        categoryId: "",
      });
      fetchProducts();
    } catch (err: any) {
      setAddError(err.message);
    } finally {
      setAddSaving(false);
    }
  }

  const totalValue = products.reduce((sum, p) => sum + p.stockValue, 0);
  const lowStockCount = products.filter((p) => p.isLowStock).length;
  const outOfStockCount = products.filter((p) => p.isOutOfStock).length;

  return (
    <DashboardLayout role={(userRole as any) || "WAREHOUSE_MANAGER"} title={t("products")}>
      <div className="space-y-6">
        {isReadOnly && (
          <div className="rounded-lg border border-[#d4a843]/30 bg-[#d4a843]/10 p-4 text-sm text-[#d4a843]">
            {t("viewOnlyAccess")}
          </div>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="stat-card">
            <p className="text-sm text-[#9090a0]">{t("stockValue")}</p>
            <p className="text-2xl font-bold text-[#d4a843]">{formatCurrency(totalValue)}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-[#9090a0]">{t("lowStockItems")}</p>
            <p className="text-2xl font-bold text-[#f59e0b]">{lowStockCount}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-[#9090a0]">{t("outOfStock")}</p>
            <p className="text-2xl font-bold text-[#f43f5e]">{outOfStockCount}</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606070]" />
              <input
                type="text"
                placeholder={t("searchProducts")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchProducts()}
                className="input w-64 pl-10"
              />
            </div>
            <button onClick={fetchProducts} className="btn btn-secondary btn-sm">
              <Filter size={14} />
            </button>
          </div>
          {!isReadOnly && (
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary btn-sm"
            >
              <Plus size={14} />
              {t("addProduct")}
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex h-[40vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4a843] border-t-transparent" />
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{t("productLabel")}</th>
                  <th>{t("skuCol")}</th>
                  <th>{t("categoryCol")}</th>
                  <th>{t("stockCol")}</th>
                  <th>{t("minCol")}</th>
                  <th>{t("statusCol")}</th>
                  <th>{t("valueCol")}</th>
                  {!isReadOnly && <th>{t("quickAdjustCol")}</th>}
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="font-medium text-[#f0f0f5]">{product.name}</td>
                    <td className="text-[#9090a0]">{product.sku}</td>
                    <td className="text-[#9090a0]">{product.category?.name || "-"}</td>
                    <td>
                      <span
                        className={
                          product.isOutOfStock
                            ? "font-bold text-[#f43f5e]"
                            : product.isLowStock
                            ? "font-bold text-[#f59e0b]"
                            : "font-bold text-[#10b981]"
                        }
                      >
                        {product.stockQuantity} {product.unit}
                      </span>
                    </td>
                    <td className="text-[#9090a0]">{product.minStockLevel}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            product.isOutOfStock
                              ? "bg-[#f43f5e]"
                              : product.isLowStock
                              ? "bg-[#f59e0b]"
                              : "bg-[#10b981]"
                          }`}
                        />
                        {product.isOutOfStock && (
                          <AlertTriangle size={12} className="text-[#f43f5e]" />
                        )}
                      </div>
                    </td>
                    <td className="text-[#9090a0]">{formatCurrency(product.stockValue)}</td>
                    {!isReadOnly && (
                      <td>
                      {quickAdjustId === product.id ? (
                        <div className="flex items-center gap-1">
                          <select
                            value={adjustType}
                            onChange={(e) => setAdjustType(e.target.value as any)}
                            className="input select w-20 py-1 text-xs"
                          >
                            <option value="add">+ {t("addBtn")}</option>
                            <option value="subtract">- {t("subBtn")}</option>
                          </select>
                          <input
                            type="number"
                            value={adjustValue}
                            onChange={(e) => setAdjustValue(e.target.value)}
                            className="input w-16 py-1 text-xs"
                            placeholder={t("qtyPlaceholder")}
                          />
                          <button
                            onClick={() => handleQuickAdjust(product.id)}
                            className="rounded bg-[#10b981]/20 px-2 py-1 text-xs text-[#10b981]"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => {
                              setQuickAdjustId(null);
                              setAdjustValue("");
                            }}
                            className="rounded bg-[#2a2a3a] px-2 py-1 text-xs text-[#9090a0]"
                          >
                            ✗
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setQuickAdjustId(product.id)}
                          className="rounded-lg p-2 text-[#9090a0] hover:bg-[#2a2a3a] hover:text-[#d4a843]"
                          title={t("quickStockAdjust")}
                        >
                          <Package size={14} />
                        </button>
                      )}
                    </td>
                    )}
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={isReadOnly ? 7 : 8} className="text-center text-[#606070]">
                      {t("noProductsFound")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-[#f0f0f5]">
                <Plus size={18} className="text-[#d4a843]" />
                {t("addNewProduct")}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-[#9090a0] hover:text-[#f0f0f5]"
              >
                <X size={18} />
              </button>
            </div>

            {addError && (
              <div className="mb-4 rounded-lg border border-[#f43f5e]/20 bg-[#f43f5e]/10 p-3 text-sm text-[#f43f5e]">
                {addError}
              </div>
            )}

            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-[#9090a0]">{t("nameRequired")}</label>
                <input
                  type="text"
                  required
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="input"
                  placeholder={t("namePlaceholder")}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-[#9090a0]">{t("productDescription")}</label>
                <textarea
                  value={addForm.description}
                  onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                  className="input min-h-[60px]"
                  placeholder={t("descriptionPlaceholder")}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-[#9090a0]">{t("priceRequired")}</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={addForm.price}
                    onChange={(e) => setAddForm({ ...addForm, price: e.target.value })}
                    className="input"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-[#9090a0]">{t("costPrice")}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={addForm.costPrice}
                    onChange={(e) => setAddForm({ ...addForm, costPrice: e.target.value })}
                    className="input"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-[#9090a0]">{t("initialStock")}</label>
                  <input
                    type="number"
                    min="0"
                    value={addForm.stockQuantity}
                    onChange={(e) => setAddForm({ ...addForm, stockQuantity: e.target.value })}
                    className="input"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-[#9090a0]">{t("unitLabel")}</label>
                  <select
                    value={addForm.unit}
                    onChange={(e) => setAddForm({ ...addForm, unit: e.target.value })}
                    className="input select"
                  >
                    <option value="piece">{t("unitPiece")}</option>
                    <option value="kg">{t("unitKilogram")}</option>
                    <option value="g">{t("unitGram")}</option>
                    <option value="l">{t("unitLitre")}</option>
                    <option value="ml">{t("unitMillilitre")}</option>
                    <option value="box">{t("unitBox")}</option>
                    <option value="pack">{t("unitPack")}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-[#9090a0]">{t("minStockLevel")}</label>
                  <input
                    type="number"
                    min="0"
                    value={addForm.minStockLevel}
                    onChange={(e) => setAddForm({ ...addForm, minStockLevel: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-[#9090a0]">{t("maxStockLevel")}</label>
                  <input
                    type="number"
                    min="0"
                    value={addForm.maxStockLevel}
                    onChange={(e) => setAddForm({ ...addForm, maxStockLevel: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-[#9090a0]">{t("barcodeLabel")}</label>
                  <input
                    type="text"
                    value={addForm.barcode}
                    onChange={(e) => setAddForm({ ...addForm, barcode: e.target.value })}
                    className="input"
                    placeholder={t("optionalPlaceholder")}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-[#9090a0]">{t("categoryCol")}</label>
                  <select
                    value={addForm.categoryId}
                    onChange={(e) => setAddForm({ ...addForm, categoryId: e.target.value })}
                    className="input select"
                  >
                    <option value="">{t("noCategoryOption")}</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  {t("cancelBtn")}
                </button>
                <button type="submit" disabled={addSaving} className="btn btn-primary flex-1">
                  {addSaving ? t("creatingLabel") : t("createProductBtn")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
