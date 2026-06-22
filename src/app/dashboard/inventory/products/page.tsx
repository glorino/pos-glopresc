"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { formatCurrency } from "@/lib/utils";
import {
  Search,
  Plus,
  Edit2,
  Package,
  AlertTriangle,
  Filter,
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

export default function InventoryProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [quickAdjustId, setQuickAdjustId] = useState<string | null>(null);
  const [adjustValue, setAdjustValue] = useState("");
  const [adjustType, setAdjustType] = useState<"add" | "subtract">("add");

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

  useEffect(() => {
    fetchProducts();
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

  const totalValue = products.reduce((sum, p) => sum + p.stockValue, 0);
  const lowStockCount = products.filter((p) => p.isLowStock).length;
  const outOfStockCount = products.filter((p) => p.isOutOfStock).length;

  return (
    <DashboardLayout role="WAREHOUSE_MANAGER" title="Products">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="stat-card">
            <p className="text-sm text-[#9090a0]">Total Stock Value</p>
            <p className="text-2xl font-bold text-[#d4a843]">{formatCurrency(totalValue)}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-[#9090a0]">Low Stock Items</p>
            <p className="text-2xl font-bold text-[#f59e0b]">{lowStockCount}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-[#9090a0]">Out of Stock</p>
            <p className="text-2xl font-bold text-[#f43f5e]">{outOfStockCount}</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
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
            <button onClick={fetchProducts} className="btn btn-secondary btn-sm">
              <Filter size={14} />
            </button>
          </div>
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
                  <th>Stock</th>
                  <th>Min</th>
                  <th>Status</th>
                  <th>Value</th>
                  <th>Quick Adjust</th>
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
                    <td>
                      {quickAdjustId === product.id ? (
                        <div className="flex items-center gap-1">
                          <select
                            value={adjustType}
                            onChange={(e) => setAdjustType(e.target.value as any)}
                            className="input select w-20 py-1 text-xs"
                          >
                            <option value="add">+ Add</option>
                            <option value="subtract">- Sub</option>
                          </select>
                          <input
                            type="number"
                            value={adjustValue}
                            onChange={(e) => setAdjustValue(e.target.value)}
                            className="input w-16 py-1 text-xs"
                            placeholder="Qty"
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
                          title="Quick Stock Adjust"
                        >
                          <Package size={14} />
                        </button>
                      )}
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
    </DashboardLayout>
  );
}
