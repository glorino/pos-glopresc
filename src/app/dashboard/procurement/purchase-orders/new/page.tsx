"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { formatCurrency } from "@/lib/utils";
import { useTranslation } from "@/contexts/LanguageContext";
import { Plus, Trash2, ArrowLeft, ShoppingCart } from "lucide-react";

interface Supplier {
  id: string;
  name: string;
  avgItemCost?: number;
  totalItemsSupplied?: number;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  costPrice: number;
}

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
}

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [supplierId, setSupplierId] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/suppliers?isActive=true&limit=100").then((r) => r.json()),
      fetch("/api/products?isActive=true&limit=100").then((r) => r.json()),
    ])
      .then(([supData, prodData]) => {
        setSuppliers(supData.suppliers || []);
        setProducts(prodData.products || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function addItem() {
    setItems([...items, { productId: "", productName: "", quantity: 1, unitCost: 0 }]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof OrderItem, value: any) {
    const updated = [...items];
    if (field === "productId") {
      const product = products.find((p) => p.id === value);
      updated[index] = {
        ...updated[index],
        productId: value,
        productName: product?.name || "",
        unitCost: product?.costPrice || 0,
      };
    } else {
      (updated[index] as any)[field] = value;
    }
    setItems(updated);
  }

  const total = items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supplierId) {
      setError("Please select a supplier");
      return;
    }
    if (items.length === 0) {
      setError("Please add at least one item");
      return;
    }
    if (items.some((item) => !item.productId || item.quantity <= 0)) {
      setError("Please fill in all item details with valid quantities");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId,
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitCost: item.unitCost,
          })),
          expectedDate: expectedDate || null,
          notes: notes || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create purchase order");
      }
      router.push("/dashboard/procurement/purchase-orders");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout role="PROCUREMENT_MANAGER" title={t("createPOTitle")}>
      <div className="mx-auto max-w-3xl space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-[#9090a0] hover:text-[#f0f0f5]"
        >
          <ArrowLeft size={16} />
          {t("backBtn")}
        </button>

        <div className="glass-card p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4a843]/20 to-[#d4a843]/5">
              <ShoppingCart size={18} className="text-[#d4a843]" />
            </div>
            <h2 className="text-xl font-semibold text-[#f0f0f5]">{t("createPOBtn")}</h2>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-[#f43f5e]/20 bg-[#f43f5e]/10 p-3 text-sm text-[#f43f5e]">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4a843] border-t-transparent" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm text-[#9090a0]">{t("supplierLabel")}</label>
                  <select
                    required
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="input"
                  >
                    <option value="">{t("selectSupplier")}</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}{s.avgItemCost ? ` (Avg: ₦${s.avgItemCost.toLocaleString()})` : ""}
                      </option>
                    ))}
                  </select>
                  {supplierId && (() => {
                    const selected = suppliers.find((s) => s.id === supplierId);
                    if (selected && selected.avgItemCost && selected.avgItemCost > 0) {
                      return (
                        <div className="mt-2 flex items-center gap-2 rounded-lg border border-[#d4a843]/20 bg-[#d4a843]/5 px-3 py-2 text-xs">
                          <span className="text-[#9090a0]">{t("supplierAvgCost")}</span>
                          <span className="font-semibold text-[#d4a843]">{formatCurrency(selected.avgItemCost)}</span>
                          <span className="text-[#606070]">| {selected.totalItemsSupplied ?? 0} items</span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
                <div>
                  <label className="mb-1 block text-sm text-[#9090a0]">{t("expectedDeliveryDate")}</label>
                  <input
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm text-[#9090a0]">{t("notesLabel")}</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input"
                  rows={2}
                  placeholder={t("notesPlaceholder")}
                />
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-[#f0f0f5]">{t("itemsLabel")}</h3>
                  <button type="button" onClick={addItem} className="btn btn-secondary btn-sm">
                    <Plus size={14} />
                    {t("addItemBtn")}
                  </button>
                </div>

                {items.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#2a2a3a] bg-[#12121a] p-8 text-center">
                    <p className="text-sm text-[#606070]">{t("noItemsAdded")}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-end gap-3 rounded-xl border border-[#2a2a3a] bg-[#12121a] p-3"
                      >
                        <div className="flex-1">
                          <label className="mb-1 block text-xs text-[#606070]">{t("productLabel")}</label>
                          <select
                            required
                            value={item.productId}
                            onChange={(e) => updateItem(index, "productId", e.target.value)}
                            className="input text-sm"
                          >
                            <option value="">{t("selectProduct")}</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.sku})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="w-24">
                          <label className="mb-1 block text-xs text-[#606070]">{t("qtyLabel")}</label>
                          <input
                            type="number"
                            min={1}
                            required
                            value={item.quantity}
                            onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                            className="input text-sm"
                          />
                        </div>
                        <div className="w-32">
                          <label className="mb-1 block text-xs text-[#606070]">{t("unitCost")}</label>
                          <input
                            type="number"
                            step="0.01"
                            min={0}
                            required
                            value={item.unitCost}
                            onChange={(e) => updateItem(index, "unitCost", parseFloat(e.target.value) || 0)}
                            className="input text-sm"
                          />
                        </div>
                        <div className="w-32 text-right text-sm font-medium text-[#d4a843]">
                          {formatCurrency(item.quantity * item.unitCost)}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="rounded-lg p-2 text-[#9090a0] hover:bg-[#f43f5e]/20 hover:text-[#f43f5e]"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {items.length > 0 && (
                <div className="rounded-xl border border-[#2a2a3a] bg-[#1c1c28] p-4">
                  <div className="flex justify-between">
                    <span className="font-semibold text-[#f0f0f5]">{t("totalLabel")}</span>
                    <span className="font-semibold text-[#d4a843]">{formatCurrency(total)}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => router.back()} className="btn btn-secondary">
                  {t("cancelBtn")}
                </button>
                <button type="submit" disabled={saving || items.length === 0} className="btn btn-primary">
                  {saving ? t("creatingLabel") : t("createPOBtn")}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
