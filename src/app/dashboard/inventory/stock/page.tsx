"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useTranslation } from "@/contexts/LanguageContext";
import { formatDateTime } from "@/lib/utils";
import {
  Plus,
  Search,
  AlertTriangle,
  Package,
  ArrowDown,
  ArrowUp,
  RefreshCw,
  ScanBarcode,
  Check,
  X,
  Clock,
} from "lucide-react";
import BarcodeScanner from "@/components/ui/BarcodeScanner";

interface StockAdjustment {
  id: string;
  productName: string;
  productSku: string;
  currentStock: number;
  type: string;
  quantity: number;
  reason: string;
  reference: string | null;
  status: string;
  performedBy: string;
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  stockQuantity: number;
}

export default function InventoryStockPage() {
  const { t } = useTranslation();

  const adjustmentTypes = [
    { value: "ADDITION", label: t("addStockLabel"), icon: ArrowUp, color: "text-[#10b981]" },
    { value: "SUBTRACTION", label: t("subtractStock"), icon: ArrowDown, color: "text-[#f43f5e]" },
    { value: "DAMAGE", label: t("damageLabel"), icon: AlertTriangle, color: "text-[#f59e0b]" },
    { value: "EXPIRED", label: t("expiredLabel"), icon: AlertTriangle, color: "text-[#f59e0b]" },
    { value: "RETURN", label: t("returnLabel"), icon: RefreshCw, color: "text-[#3b82f6]" },
  ];

  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [pendingAdjustments, setPendingAdjustments] = useState<StockAdjustment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [userRole, setUserRole] = useState<string>("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    productId: "",
    type: "ADDITION",
    quantity: "",
    reason: "",
    reference: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [lowStockAlerts, setLowStockAlerts] = useState<Product[]>([]);
  const [showScanner, setShowScanner] = useState(false);

  const isManager = ["OWNER", "MANAGER", "WAREHOUSE_MANAGER"].includes(userRole);

  async function fetchUserRole() {
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const data = await res.json();
        setUserRole(data?.user?.role || "");
      }
    } catch (error) {
      console.error("Failed to fetch user role:", error);
    }
  }

  async function fetchAdjustments() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("limit", "50");
      const res = await fetch(`/api/stock-adjustments?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAdjustments(data.adjustments);
      }
    } catch (error) {
      console.error("Failed to fetch adjustments:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPendingAdjustments() {
    if (!isManager) return;
    try {
      const res = await fetch("/api/stock-adjustments?status=PENDING&limit=50");
      if (res.ok) {
        const data = await res.json();
        setPendingAdjustments(data.adjustments);
      }
    } catch (error) {
      console.error("Failed to fetch pending adjustments:", error);
    }
  }

  async function fetchProducts() {
    try {
      const res = await fetch("/api/products?limit=200");
      if (res.ok) {
        const data = await res.json();
        const allProducts = data.products;
        setProducts(allProducts);
        setLowStockAlerts(
          allProducts.filter(
            (p: Product & { minStockLevel: number }) =>
              (p as any).stockQuantity <= (p as any).minStockLevel || (p as any).stockQuantity === 0
          )
        );
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  }

  function handleBarcodeScan(barcode: string) {
    setShowScanner(false);
    const match = products.find(
      (p) =>
        p.sku.toLowerCase() === barcode.toLowerCase() ||
        (p as any).barcode?.toLowerCase() === barcode.toLowerCase()
    );
    if (match) {
      setFormData({ ...formData, productId: match.id });
    } else {
      setSearch(barcode);
    }
  }

  useEffect(() => {
    fetchUserRole();
    fetchAdjustments();
    fetchProducts();
  }, []);

  useEffect(() => {
    if (isManager) {
      fetchPendingAdjustments();
    }
  }, [userRole]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/stock-adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: formData.productId,
          type: formData.type,
          quantity: parseInt(formData.quantity),
          reason: formData.reason,
          reference: formData.reference || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create adjustment");
      }
      setSuccess(data.message || "Adjustment created successfully");
      setFormData({ productId: "", type: "ADDITION", quantity: "", reason: "", reference: "" });
      fetchAdjustments();
      fetchProducts();
      if (isManager) {
        fetchPendingAdjustments();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleApproval(adjustmentId: string, action: "APPROVED" | "REJECTED") {
    setProcessingId(adjustmentId);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/stock-adjustments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: adjustmentId, status: action }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Failed to ${action.toLowerCase()} adjustment`);
      }
      setSuccess(`Adjustment ${action.toLowerCase()} successfully`);
      fetchPendingAdjustments();
      fetchAdjustments();
      fetchProducts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessingId(null);
    }
  }

  function getTypeBadge(type: string) {
    switch (type) {
      case "ADDITION":
        return "badge-success";
      case "SUBTRACTION":
        return "badge-danger";
      case "DAMAGE":
      case "EXPIRED":
        return "badge-warning";
      case "RETURN":
        return "badge-info";
      default:
        return "badge-info";
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "PENDING":
        return "badge-warning";
      case "APPROVED":
        return "badge-success";
      case "REJECTED":
        return "badge-danger";
      default:
        return "badge-info";
    }
  }

  return (
    <DashboardLayout role="WAREHOUSE_MANAGER" title={t("stock")}>
      <div className="space-y-6">
        {error && (
          <div className="rounded-lg border border-[#f43f5e]/20 bg-[#f43f5e]/10 p-3 text-sm text-[#f43f5e]">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg border border-[#10b981]/20 bg-[#10b981]/10 p-3 text-sm text-[#10b981]">
            {success}
          </div>
        )}

        {isManager && pendingAdjustments.length > 0 && (
          <div className="glass-card p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#f0f0f5]">
              <Clock size={18} className="text-[#f59e0b]" />
              {t("pendingApprovals")} ({pendingAdjustments.length})
            </h3>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t("productCol")}</th>
                    <th>{t("typeCol")}</th>
                    <th>{t("qtyLabel")}</th>
                    <th>{t("reasonLabel")}</th>
                    <th>{t("requestedByCol")}</th>
                    <th>{t("dateCol")}</th>
                    <th>{t("actionsCol")}</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingAdjustments.map((adj) => (
                    <tr key={adj.id}>
                      <td>
                        <div>
                          <p className="font-medium text-[#f0f0f5]">{adj.productName}</p>
                          <p className="text-xs text-[#606070]">{adj.productSku}</p>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getTypeBadge(adj.type)}`}>
                          {adj.type}
                        </span>
                      </td>
                      <td className="font-medium text-[#f0f0f5]">{adj.quantity}</td>
                      <td className="max-w-[200px] truncate text-[#9090a0]">{adj.reason}</td>
                      <td className="text-[#9090a0]">{adj.performedBy}</td>
                      <td className="text-[#9090a0]">{formatDateTime(adj.createdAt)}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleApproval(adj.id, "APPROVED")}
                            disabled={processingId === adj.id}
                            className="rounded-lg bg-[#10b981]/20 p-2 text-[#10b981] hover:bg-[#10b981]/30 disabled:opacity-50"
                            title="Approve"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => handleApproval(adj.id, "REJECTED")}
                            disabled={processingId === adj.id}
                            className="rounded-lg bg-[#f43f5e]/20 p-2 text-[#f43f5e] hover:bg-[#f43f5e]/30 disabled:opacity-50"
                            title="Reject"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="glass-card p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#f0f0f5]">
              <Plus size={18} className="text-[#d4a843]" />
              {t("stockAdjustment")}
            </h3>

            {!isManager && (
              <div className="mb-4 rounded-lg border border-[#f59e0b]/20 bg-[#f59e0b]/10 p-3 text-sm text-[#f59e0b]">
                Stock adjustments require manager approval. Your request will be submitted as pending.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-sm text-[#9090a0]">{t("productCol")}</label>
                  <button
                    type="button"
                    onClick={() => setShowScanner(true)}
                    className="flex items-center gap-1 text-xs font-medium text-[#d4a843] hover:text-[#c49a38]"
                  >
                    <ScanBarcode size={12} />
                    {t("scanProduct")}
                  </button>
                </div>
                <select
                  required
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  className="input select"
                >
                  <option value="">{t("selectProductPlaceholder")}</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) - Stock: {p.stockQuantity}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm text-[#9090a0]">{t("typeLabel")}</label>
                <div className="flex flex-wrap gap-2">
                  {adjustmentTypes.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: t.value })}
                      className={`rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                        formData.type === t.value
                          ? "border border-[#d4a843]/30 bg-[#d4a843]/10 text-[#d4a843]"
                          : "border border-[#2a2a3a] bg-[#1c1c28] text-[#9090a0] hover:text-[#f0f0f5]"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm text-[#9090a0]">{t("quantityLabel")}</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="input"
                  placeholder={t("quantityPlaceholder")}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-[#9090a0]">{t("reasonLabel")}</label>
                <textarea
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="input min-h-[80px]"
                  placeholder={t("reasonPlaceholder")}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-[#9090a0]">{t("referenceOptional")}</label>
                <input
                  type="text"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  className="input"
                  placeholder={t("referencePlaceholder")}
                />
              </div>

              <button type="submit" disabled={saving} className="btn btn-primary w-full">
                {saving
                  ? t("processing")
                  : isManager
                  ? t("submitAdjustment")
                  : t("submitForApproval")}
              </button>
            </form>
          </div>

          <div className="glass-card p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#f0f0f5]">
              <AlertTriangle size={18} className="text-[#f59e0b]" />
              {t("lowStockAlerts")}
            </h3>
            {lowStockAlerts.length === 0 ? (
              <p className="text-center text-sm text-[#606070]">{t("noLowStockAlerts")}</p>
            ) : (
              <div className="space-y-3">
                {lowStockAlerts.slice(0, 10).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between rounded-xl border border-[#2a2a3a] bg-[#1c1c28] p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-2.5 w-2.5 rounded-full ${
                          (product as any).stockQuantity === 0 ? "bg-[#f43f5e]" : "bg-[#f59e0b]"
                        }`}
                      />
                      <div>
                        <p className="text-sm font-medium text-[#f0f0f5]">{product.name}</p>
                        <p className="text-xs text-[#606070]">{product.sku}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-bold ${
                          (product as any).stockQuantity === 0 ? "text-[#f43f5e]" : "text-[#f59e0b]"
                        }`}
                      >
                        {product.stockQuantity} {t("left")}
                      </p>
                      <p className="text-xs text-[#606070]">
                        {t("minLabelShort")} {(product as any).minStockLevel}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#f0f0f5]">
            <Package size={18} className="text-[#3b82f6]" />
            {t("recentAdjustments")}
          </h3>

          <div className="mb-4 flex items-center gap-3">
            <div className="relative flex-1 sm:w-72">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606070]" />
              <input
                type="text"
                placeholder={t("searchAdjustments")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchAdjustments()}
                className="input pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex h-[30vh] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4a843] border-t-transparent" />
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t("productCol")}</th>
                    <th>{t("typeCol")}</th>
                    <th>{t("qtyLabel")}</th>
                    <th>{t("reasonLabel")}</th>
                    <th>{t("statusCol")}</th>
                    <th>{t("byCol")}</th>
                    <th>{t("dateCol")}</th>
                  </tr>
                </thead>
                <tbody>
                  {adjustments.map((adj) => (
                    <tr key={adj.id}>
                      <td>
                        <div>
                          <p className="font-medium text-[#f0f0f5]">{adj.productName}</p>
                          <p className="text-xs text-[#606070]">{adj.productSku}</p>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getTypeBadge(adj.type)}`}>
                          {adj.type}
                        </span>
                      </td>
                      <td className="font-medium text-[#f0f0f5]">{adj.quantity}</td>
                      <td className="max-w-[200px] truncate text-[#9090a0]">{adj.reason}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(adj.status)}`}>
                          {adj.status}
                        </span>
                      </td>
                      <td className="text-[#9090a0]">{adj.performedBy}</td>
                      <td className="text-[#9090a0]">{formatDateTime(adj.createdAt)}</td>
                    </tr>
                  ))}
                  {adjustments.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center text-[#606070]">
                        {t("noAdjustmentsFound")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showScanner && (
        <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setShowScanner(false)} />
      )}
    </DashboardLayout>
  );
}
