"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Package, RefreshCw } from "lucide-react";

interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  stockQuantity: number;
  minStockLevel: number;
  unit: string;
  category: { name: string } | null;
}

export default function StockAlert() {
  const [products, setProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLowStock();
  }, []);

  async function fetchLowStock() {
    setLoading(true);
    try {
      const res = await fetch("/api/products?lowStock=true");
      if (res.ok) {
        const json = await res.json();
        setProducts(json.products ?? json ?? []);
      }
    } catch (err) {
      console.error("Failed to fetch low stock products:", err);
    } finally {
      setLoading(false);
    }
  }

  function getSeverity(product: LowStockProduct) {
    if (product.stockQuantity === 0) {
      return {
        label: "Out of Stock",
        bgColor: "bg-[#f43f5e]/10",
        borderColor: "border-[#f43f5e]/30",
        textColor: "text-[#f43f5e]",
        dotColor: "bg-[#f43f5e]",
      };
    }
    return {
      label: "Low Stock",
      bgColor: "bg-[#f59e0b]/10",
      borderColor: "border-[#f59e0b]/30",
      textColor: "text-[#f59e0b]",
      dotColor: "bg-[#f59e0b]",
    };
  }

  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="flex h-20 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#d4a843] border-t-transparent" />
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="glass-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#f59e0b]/20 to-[#f59e0b]/5">
            <AlertTriangle size={18} className="text-[#f59e0b]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#f0f0f5]">
              Stock Alerts
            </h3>
            <p className="text-sm text-[#9090a0]">
              {products.length} product{products.length !== 1 ? "s" : ""} need attention
            </p>
          </div>
        </div>
        <button onClick={fetchLowStock} className="btn btn-secondary btn-sm">
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="space-y-2">
        {products.map((product) => {
          const severity = getSeverity(product);
          return (
            <div
              key={product.id}
              className={`flex items-center justify-between rounded-xl border ${severity.borderColor} ${severity.bgColor} p-3`}
            >
              <div className="flex items-center gap-3">
                <div className={`h-2 w-2 rounded-full ${severity.dotColor}`} />
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1c1c28]/80">
                  <Package size={16} className="text-[#9090a0]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#f0f0f5]">
                    {product.name}
                  </p>
                  <p className="text-xs text-[#606070]">
                    SKU: {product.sku}
                    {product.category && ` · ${product.category.name}`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${severity.textColor}`}>
                  {product.stockQuantity} {product.unit}
                </p>
                <p className="text-xs text-[#606070]">
                  Min: {product.minStockLevel}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
