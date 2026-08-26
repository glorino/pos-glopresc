"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useTranslation } from "@/contexts/LanguageContext";
import { formatCurrency } from "@/lib/utils";
import Pagination from "@/components/ui/Pagination";
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  AlertTriangle,
} from "lucide-react";

interface FinishedProduct {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  quantityProduced: number;
  unitCost: number;
  sellingPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  unit: string;
  image: string | null;
  isActive: boolean;
  addedToStore: boolean;
  categoryId: string | null;
  branchId: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
}

const ITEMS_PER_PAGE = 10;

export default function FinishedProductsPage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<FinishedProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<FinishedProduct | null>(null);
  const [form, setForm] = useState({
    name: "",
    sku: "",
    description: "",
    quantityProduced: "",
    unitCost: "",
    sellingPrice: "",
    stockQuantity: "",
    minStockLevel: "5",
    unit: "piece",
    isActive: true,
    addedToStore: false,
    categoryId: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<FinishedProduct | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    try {
      const res = await fetch("/api/finished-products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data.items ?? data.products ?? data ?? []);
      }
    } catch (error) {
      console.error("Failed to fetch finished products:", error);
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

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && p.isActive) ||
      (statusFilter === "inactive" && !p.isActive);
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedProducts = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  function resetForm() {
    setForm({
      name: "",
      sku: "",
      description: "",
      quantityProduced: "",
      unitCost: "",
      sellingPrice: "",
      stockQuantity: "",
      minStockLevel: "5",
      unit: "piece",
      isActive: true,
      addedToStore: false,
      categoryId: "",
    });
  }

  function openAddModal() {
    resetForm();
    setEditingProduct(null);
    setError("");
    setShowModal(true);
  }

  function openEditModal(product: FinishedProduct) {
    setForm({
      name: product.name,
      sku: product.sku,
      description: product.description ?? "",
      quantityProduced: String(product.quantityProduced),
      unitCost: String(product.unitCost),
      sellingPrice: String(product.sellingPrice),
      stockQuantity: String(product.stockQuantity),
      minStockLevel: String(product.minStockLevel),
      unit: product.unit,
      isActive: product.isActive,
      addedToStore: product.addedToStore,
      categoryId: product.categoryId ?? "",
    });
    setEditingProduct(product);
    setError("");
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name,
        sku: form.sku,
        description: form.description || undefined,
        quantityProduced: form.quantityProduced ? parseInt(form.quantityProduced) : 0,
        unitCost: form.unitCost ? parseFloat(form.unitCost) : 0,
        sellingPrice: form.sellingPrice ? parseFloat(form.sellingPrice) : 0,
        stockQuantity: form.stockQuantity ? parseInt(form.stockQuantity) : 0,
        minStockLevel: parseInt(form.minStockLevel) || 5,
        unit: form.unit || "piece",
        isActive: form.isActive,
        addedToStore: form.addedToStore,
        categoryId: form.categoryId || undefined,
      };

      const url = editingProduct
        ? `/api/finished-products/${editingProduct.id}`
        : "/api/finished-products";
      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save product");
      }

      setShowModal(false);
      resetForm();
      setEditingProduct(null);
      fetchProducts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/finished-products/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete product");
      }
      setDeleteTarget(null);
      fetchProducts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <DashboardLayout title="Finished Products">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606070]" />
              <input
                type="text"
                placeholder="Search finished products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input w-full max-w-xs pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
              className="input select"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <button onClick={openAddModal} className="btn btn-primary btn-sm">
            <Plus size={14} />
            Add Finished Product
          </button>
        </div>

        {loading ? (
          <div className="flex h-[40vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4a843] border-t-transparent" />
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>SKU</th>
                    <th>Qty Produced</th>
                    <th>Unit Cost</th>
                    <th>Selling Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map((product) => {
                    const isLowStock =
                      product.stockQuantity <= product.minStockLevel &&
                      product.stockQuantity > 0;
                    const isOutOfStock = product.stockQuantity === 0;

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
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1a1a25]">
                              <Package size={16} className="text-[#606070]" />
                            </div>
                          )}
                        </td>
                        <td className="font-medium text-[#f0f0f5]">{product.name}</td>
                        <td className="text-[#9090a0]">{product.sku}</td>
                        <td className="text-[#9090a0]">{product.quantityProduced}</td>
                        <td className="text-[#9090a0]">{formatCurrency(product.unitCost)}</td>
                        <td className="text-[#9090a0]">{formatCurrency(product.sellingPrice)}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <span
                              className={
                                isOutOfStock
                                  ? "font-bold text-[#f43f5e]"
                                  : isLowStock
                                  ? "font-bold text-[#f59e0b]"
                                  : "font-bold text-[#10b981]"
                              }
                            >
                              {product.stockQuantity} {product.unit}
                            </span>
                            {isLowStock && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#f59e0b]/15 px-2 py-0.5 text-xs font-medium text-[#f59e0b]">
                                <AlertTriangle size={12} />
                                Low
                              </span>
                            )}
                            {isOutOfStock && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#f43f5e]/15 px-2 py-0.5 text-xs font-medium text-[#f43f5e]">
                                <AlertTriangle size={12} />
                                Out
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                              product.isActive
                                ? "bg-[#10b981]/15 text-[#10b981]"
                                : "bg-[#606070]/15 text-[#606070]"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                product.isActive ? "bg-[#10b981]" : "bg-[#606070]"
                              }`}
                            />
                            {product.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEditModal(product)}
                              className="rounded-lg p-2 text-[#9090a0] hover:bg-[#2a2a3a] hover:text-[#d4a843]"
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(product)}
                              className="rounded-lg p-2 text-[#9090a0] hover:bg-[#2a2a3a] hover:text-[#f43f5e]"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {paginatedProducts.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center text-[#606070]">
                        No finished products found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-[#f0f0f5]">
                {editingProduct ? (
                  <>
                    <Edit2 size={18} className="text-[#d4a843]" />
                    Edit Finished Product
                  </>
                ) : (
                  <>
                    <Plus size={18} className="text-[#d4a843]" />
                    Add Finished Product
                  </>
                )}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingProduct(null);
                }}
                className="rounded-lg p-1 text-[#9090a0] hover:text-[#f0f0f5]"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-[#f43f5e]/20 bg-[#f43f5e]/10 p-3 text-sm text-[#f43f5e]">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-[#9090a0]">Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input"
                    placeholder="Product name"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-[#9090a0]">SKU *</label>
                  <input
                    type="text"
                    required
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    className="input"
                    placeholder="SKU-001"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm text-[#9090a0]">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input min-h-[60px]"
                  placeholder="Product description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-[#9090a0]">Quantity Produced</label>
                  <input
                    type="number"
                    min="0"
                    value={form.quantityProduced}
                    onChange={(e) => setForm({ ...form, quantityProduced: e.target.value })}
                    className="input"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-[#9090a0]">Unit</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="input select"
                  >
                    <option value="piece">Piece</option>
                    <option value="kg">Kilogram</option>
                    <option value="g">Gram</option>
                    <option value="l">Litre</option>
                    <option value="ml">Millilitre</option>
                    <option value="box">Box</option>
                    <option value="pack">Pack</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-[#9090a0]">Unit Cost</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.unitCost}
                    onChange={(e) => setForm({ ...form, unitCost: e.target.value })}
                    className="input"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-[#9090a0]">Selling Price</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.sellingPrice}
                    onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
                    className="input"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-[#9090a0]">Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={form.stockQuantity}
                    onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
                    className="input"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-[#9090a0]">Min Stock Level</label>
                  <input
                    type="number"
                    min="0"
                    value={form.minStockLevel}
                    onChange={(e) => setForm({ ...form, minStockLevel: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm text-[#9090a0]">Category</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="input select"
                >
                  <option value="">No Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-[#9090a0]">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="h-4 w-4 rounded border-[#2a2a3a] bg-[#111118] text-[#d4a843] focus:ring-[#d4a843]"
                  />
                  Active
                </label>
                <label className="flex items-center gap-2 text-sm text-[#9090a0]">
                  <input
                    type="checkbox"
                    checked={form.addedToStore}
                    onChange={(e) => setForm({ ...form, addedToStore: e.target.checked })}
                    className="h-4 w-4 rounded border-[#2a2a3a] bg-[#111118] text-[#d4a843] focus:ring-[#d4a843]"
                  />
                  Added to Store
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingProduct(null);
                  }}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary flex-1">
                  {saving
                    ? "Saving..."
                    : editingProduct
                    ? "Update Product"
                    : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card mx-4 w-full max-w-md p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f43f5e]/15">
                <AlertTriangle size={20} className="text-[#f43f5e]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#f0f0f5]">Delete Product</h3>
                <p className="text-sm text-[#9090a0]">
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <p className="mb-6 text-sm text-[#9090a0]">
              Are you sure you want to delete{" "}
              <span className="font-medium text-[#f0f0f5]">{deleteTarget.name}</span>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="btn flex-1 rounded-lg bg-[#f43f5e] px-4 py-2 text-sm font-medium text-white hover:bg-[#f43f5e]/80"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
