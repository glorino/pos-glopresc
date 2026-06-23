"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useTranslation } from "@/contexts/LanguageContext";
import { formatCurrency } from "@/lib/utils";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Package,
  Filter,
  Upload,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  description: string | null;
  price: number;
  costPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  maxStockLevel: number;
  unit: string;
  image: string | null;
  isActive: boolean;
  isFeatured: boolean;
  category: { id: string; name: string } | null;
  supplier: { id: string; name: string } | null;
}

interface Category {
  id: string;
  name: string;
}

interface ProductFormData {
  name: string;
  barcode: string;
  description: string;
  price: string;
  costPrice: string;
  stockQuantity: string;
  minStockLevel: string;
  maxStockLevel: string;
  unit: string;
  categoryId: string;
  supplierId: string;
  isActive: boolean;
}

const emptyForm: ProductFormData = {
  name: "",
  barcode: "",
  description: "",
  price: "",
  costPrice: "0",
  stockQuantity: "0",
  minStockLevel: "5",
  maxStockLevel: "1000",
  unit: "piece",
  categoryId: "",
  supplierId: "",
  isActive: true,
};

export default function SalesProductsPage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  async function fetchProducts() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (categoryFilter) params.set("categoryId", categoryFilter);
      params.set("limit", "100");
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

  function openAddModal() {
    setEditingProduct(null);
    setFormData(emptyForm);
    setError("");
    setShowModal(true);
  }

  function openEditModal(product: Product) {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      barcode: product.barcode || "",
      description: product.description || "",
      price: String(product.price),
      costPrice: String(product.costPrice),
      stockQuantity: String(product.stockQuantity),
      minStockLevel: String(product.minStockLevel),
      maxStockLevel: String(product.maxStockLevel),
      unit: product.unit,
      categoryId: product.category?.id || "",
      supplierId: product.supplier?.id || "",
      isActive: product.isActive,
    });
    setError("");
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const body = {
        ...(editingProduct ? { id: editingProduct.id } : {}),
        name: formData.name,
        barcode: formData.barcode || null,
        description: formData.description || null,
        price: parseFloat(formData.price),
        costPrice: parseFloat(formData.costPrice),
        stockQuantity: parseInt(formData.stockQuantity),
        minStockLevel: parseInt(formData.minStockLevel),
        maxStockLevel: parseInt(formData.maxStockLevel),
        unit: formData.unit,
        categoryId: formData.categoryId || null,
        supplierId: formData.supplierId || null,
        isActive: formData.isActive,
      };
      const res = await fetch("/api/products", {
        method: editingProduct ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save product");
      }
      setShowModal(false);
      fetchProducts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteConfirm(null);
        fetchProducts();
      }
    } catch (error) {
      console.error("Failed to delete product:", error);
    }
  }

  return (
    <DashboardLayout role="SALES_MANAGER" title={t("products")}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606070]" />
              <input
                type="text"
                placeholder="Search products..."
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
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <button onClick={openAddModal} className="btn btn-primary">
            <Plus size={16} />
            Add Product
          </button>
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
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Cost</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div>
                        <p className="font-medium text-[#f0f0f5]">{product.name}</p>
                        {product.barcode && (
                          <p className="text-xs text-[#606070]">{product.barcode}</p>
                        )}
                      </div>
                    </td>
                    <td className="text-[#9090a0]">{product.sku}</td>
                    <td className="text-[#9090a0]">{product.category?.name || "-"}</td>
                    <td className="font-medium text-[#d4a843]">{formatCurrency(product.price)}</td>
                    <td className="text-[#9090a0]">{formatCurrency(product.costPrice)}</td>
                    <td>
                      <span
                        className={
                          product.stockQuantity === 0
                            ? "text-[#f43f5e]"
                            : product.stockQuantity <= product.minStockLevel
                            ? "text-[#f59e0b]"
                            : "text-[#10b981]"
                        }
                      >
                        {product.stockQuantity} {product.unit}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${product.isActive ? "badge-success" : "badge-danger"}`}>
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(product)}
                          className="rounded-lg p-2 text-[#9090a0] hover:bg-[#2a2a3a] hover:text-[#3b82f6]"
                        >
                          <Edit2 size={14} />
                        </button>
                        {deleteConfirm === product.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="rounded-lg bg-[#f43f5e]/20 px-2 py-1 text-xs text-[#f43f5e]"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="rounded-lg bg-[#2a2a3a] px-2 py-1 text-xs text-[#9090a0]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(product.id)}
                            className="rounded-lg p-2 text-[#9090a0] hover:bg-[#2a2a3a] hover:text-[#f43f5e]"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center text-[#606070]">
                      No products found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#f0f0f5]">
                {editingProduct ? "Edit Product" : "Add Product"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-[#606070] hover:text-[#f0f0f5]">
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-[#f43f5e]/20 bg-[#f43f5e]/10 p-3 text-sm text-[#f43f5e]">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm text-[#9090a0]">Product Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-[#9090a0]">Barcode</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-[#9090a0]">Category</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="input select"
                  >
                    <option value="">No Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-[#9090a0]">Price (₦)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-[#9090a0]">Cost Price (₦)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-[#9090a0]">Stock Quantity</label>
                  <input
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-[#9090a0]">Min Stock Level</label>
                  <input
                    type="number"
                    value={formData.minStockLevel}
                    onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-[#9090a0]">Max Stock Level</label>
                  <input
                    type="number"
                    value={formData.maxStockLevel}
                    onChange={(e) => setFormData({ ...formData, maxStockLevel: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-[#9090a0]">Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="input select"
                  >
                    <option value="piece">Piece</option>
                    <option value="kg">Kilogram</option>
                    <option value="g">Gram</option>
                    <option value="litre">Litre</option>
                    <option value="ml">Millilitre</option>
                    <option value="box">Box</option>
                    <option value="pack">Pack</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm text-[#9090a0]">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input min-h-[80px]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm text-[#9090a0]">Product Image</label>
                  <button type="button" className="btn btn-secondary btn-sm">
                    <Upload size={14} />
                    Upload Image
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-[#2a2a3a] bg-[#1c1c28]"
                />
                <label htmlFor="isActive" className="text-sm text-[#9090a0]">
                  Active
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? "Saving..." : editingProduct ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
