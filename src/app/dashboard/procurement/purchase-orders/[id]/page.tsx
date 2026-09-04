"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useTranslation } from "@/contexts/LanguageContext";
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  CreditCard,
  AlertTriangle,
  Loader2,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";

interface PurchaseOrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitCost: number;
  total: number;
  receivedQty: number;
  product: { id: string; name: string; sku: string };
}

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  expectedDate: string | null;
  notes: string | null;
  createdAt: string;
  supplier: { id: string; name: string; contactName: string | null; email: string | null; phone: string | null };
  items: PurchaseOrderItem[];
}

interface Payment {
  id: string;
  amount: number;
  method: string;
  reference: string | null;
  notes: string | null;
  paidAt: string;
  paidBy: string;
  payer: { firstName: string; lastName: string };
}

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [payError, setPayError] = useState("");
  const [activeTab, setActiveTab] = useState<"items" | "payments">("items");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: "",
    method: "TRANSFER",
    reference: "",
    notes: "",
  });

  const orderId = params.id as string;

  useEffect(() => {
    fetchOrder();
    fetchPayments();
  }, [orderId]);

  async function fetchOrder() {
    setLoading(true);
    try {
      const res = await fetch(`/api/purchase-orders/${orderId}`);
      if (res.ok) {
        const json = await res.json();
        setOrder(json.purchaseOrder || json);
      }
    } catch (err) {
      console.error("Failed to fetch order:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPayments() {
    try {
      const res = await fetch(`/api/purchase-orders/${orderId}/payments`);
      if (res.ok) {
        const json = await res.json();
        setPayments(json.purchaseOrder?.payments || []);
      }
    } catch (err) {
      console.error("Failed to fetch payments:", err);
    }
  }

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remainingAmount = Math.max(0, (order?.total || 0) - totalPaid);

  const statusColors: Record<string, string> = {
    PENDING: "badge-warning",
    APPROVED: "badge-info",
    ORDERED: "badge-purple",
    PAID: "badge-blue",
    PARTIALLY_RECEIVED: "badge-warning",
    RECEIVED: "badge-success",
    CANCELLED: "badge-danger",
  };

  const statusIcons: Record<string, any> = {
    PENDING: Clock,
    APPROVED: CheckCircle,
    ORDERED: Truck,
    PAID: DollarSign,
    PARTIALLY_RECEIVED: Package,
    RECEIVED: Package,
    CANCELLED: XCircle,
  };

  const paymentMethods = ["CASH", "CARD", "TRANSFER", "USSD", "MOBILE", "ONLINE"];

  async function handleReceive() {
    if (!order) return;
    setSaving(true);
    setError("");

    // Build items with received quantities
    const items = order.items.map((item) => ({
      id: item.id,
      receivedQty: item.receivedQty,
    }));

    try {
      const res = await fetch(`/api/purchase-orders/${orderId}/receive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (res.ok) {
        fetchOrder();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to receive order");
      }
    } catch (err: any) {
      setError(err.message || "Failed to receive order");
    } finally {
      setSaving(false);
    }
  }

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault();
    if (!order) return;

    const amount = parseFloat(paymentData.amount);
    if (!amount || amount <= 0) {
      setPayError("Please enter a valid amount");
      return;
    }
    if (amount > remainingAmount) {
      setPayError(`Amount cannot exceed remaining balance (${formatCurrency(remainingAmount)})`);
      return;
    }

    setPaying(true);
    setPayError("");
    try {
      const res = await fetch(`/api/purchase-orders/${orderId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...paymentData,
          amount,
        }),
      });
      if (res.ok) {
        setShowPaymentModal(false);
        setPaymentData({ amount: "", method: "TRANSFER", reference: "", notes: "" });
        fetchPayments();
        fetchOrder();
      } else {
        const data = await res.json();
        setPayError(data.error || "Failed to process payment");
      }
    } catch (err: any) {
      setPayError(err.message || "Failed to process payment");
    } finally {
      setPaying(false);
    }
  }

  async function updateReceivedQty(itemId: string, qty: number) {
    if (!order) return;
    const item = order.items.find((i) => i.id === itemId);
    if (!item) return;

    const newQty = Math.max(0, Math.min(item.quantity, qty));
    setOrder((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map((i) =>
          i.id === itemId ? { ...i, receivedQty: newQty } : i
        ),
      };
    });
  }

  if (loading) {
    return (
      <DashboardLayout title={t("orderDetail")}>
        <div className="flex h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4a843] border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  if (!order) {
    return (
      <DashboardLayout title={t("orderDetail")}>
        <div className="glass-card flex flex-col items-center justify-center p-12">
          <Package size={48} className="mb-4 text-[#606070]" />
          <h3 className="text-lg font-semibold text-[#f0f0f5]">{t("noPurchaseOrdersFound")}</h3>
          <button onClick={() => router.back()} className="mt-4 btn btn-secondary">
            {t("backBtn")}
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const StatusIcon = statusIcons[order.status] || Clock;

  return (
    <DashboardLayout title={t("orderDetail") + " " + order.orderNumber}>
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-[#9090a0] hover:text-[#f0f0f5]"
        >
          <ArrowLeft size={16} />
          {t("backBtn")}
        </button>

        {/* Header */}
        <div className="glass-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4a843]/20 to-[#d4a843]/5">
                <Package size={18} className="text-[#d4a843]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[#f0f0f5]">{order.orderNumber}</h2>
                <p className="text-sm text-[#9090a0]">{order.supplier.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className={`badge ${statusColors[order.status] || "badge-info"}`}>
                <StatusIcon size={10} className="mr-1" />
                {order.status.replace("_", " ")}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-[#2a2a3a] bg-[#1c1c28] p-4">
              <p className="text-xs text-[#606070]">{t("totalLabel")}</p>
              <p className="mt-1 text-xl font-bold text-[#d4a843]">{formatCurrency(order.total)}</p>
            </div>
            <div className="rounded-xl border border-[#2a2a3a] bg-[#1c1c28] p-4">
              <p className="text-xs text-[#606070]">{t("paidLabel")}</p>
              <p className="mt-1 text-xl font-bold text-[#10b981]">{formatCurrency(totalPaid)}</p>
            </div>
            <div className="rounded-xl border border-[#2a2a3a] bg-[#1c1c28] p-4">
              <p className="text-xs text-[#606070]">{t("remainingLabel")}</p>
              <p className="mt-1 text-xl font-bold text-[#f43f5e]">{formatCurrency(remainingAmount)}</p>
            </div>
            <div className="rounded-xl border border-[#2a2a3a] bg-[#1c1c28] p-4">
              <p className="text-xs text-[#606070]">{t("itemsCount")}</p>
              <p className="mt-1 text-xl font-bold text-[#f0f0f5]">{order.items.length}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="glass-card">
          <div className="border-b border-[#2a2a3a]">
            <nav className="flex gap-1 p-1" aria-label="Tabs">
              <button
                onClick={() => setActiveTab("items")}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${activeTab === "items" ? "tab-active text-[#d4a843]" : "tab-inactive text-[#9090a0] hover:text-[#f0f0f5] hover:bg-[#2a2a3a]"}`}
              >
                <Package size={14} />
                {t("itemsHeading")}
              </button>
              <button
                onClick={() => setActiveTab("payments")}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${activeTab === "payments" ? "tab-active text-[#d4a843]" : "tab-inactive text-[#9090a0] hover:text-[#f0f0f5] hover:bg-[#2a2a3a]"}`}
              >
                <CreditCard size={14} />
                {t("paymentsLabel")}
              </button>
            </nav>
          </div>

          {/* Items Tab */}
          {activeTab === "items" && (
          <div className="p-6">
            {error && (
              <div className="mb-4 rounded-lg border border-[#f43f5e]/20 bg-[#f43f5e]/10 p-3 text-sm text-[#f43f5e]">
                {error}
              </div>
            )}

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t("productLabel")}</th>
                    <th>{t("skuCol")}</th>
                    <th className="text-right">{t("qtyLabel")}</th>
                    <th className="text-right">{t("receivedCol")}</th>
                    <th className="text-right">{t("unitCost")}</th>
                    <th className="text-right">{t("totalCol")}</th>
                    <th>{t("statusCol")}</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => {
                    const isFullyReceived = item.receivedQty >= item.quantity;
                    const isPartiallyReceived = item.receivedQty > 0 && !isFullyReceived;
                    return (
                      <tr key={item.id}>
                        <td className="font-medium text-[#f0f0f5]">{item.product.name}</td>
                        <td className="text-[#9090a0] font-mono text-xs">{item.product.sku}</td>
                        <td className="text-right text-[#9090a0]">{item.quantity}</td>
                        <td className="text-right">
                          <input
                            type="number"
                            min={0}
                            max={item.quantity}
                            value={item.receivedQty}
                            onChange={(e) => updateReceivedQty(item.id, parseInt(e.target.value) || 0)}
                            className="input text-sm w-20 text-right mx-auto"
                          />
                        </td>
                        <td className="text-right text-[#d4a843]">{formatCurrency(item.unitCost)}</td>
                        <td className="text-right font-medium text-[#d4a843]">{formatCurrency(item.total)}</td>
                        <td>
                          {isFullyReceived ? (
                            <span className="badge badge-success">{t("receivedLabel")}</span>
                          ) : isPartiallyReceived ? (
                            <span className="badge badge-warning">{t("partiallyReceived")}</span>
                          ) : (
                            <span className="badge badge-info">{t("pendingLabel")}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Receive Button */}
            {["PAID", "PARTIALLY_RECEIVED"].includes(order.status) && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleReceive}
                  disabled={saving}
                  className="btn btn-primary"
                >
                  {saving ? (
                    <>
                      <Loader2 size={14} className="mr-2 animate-spin" />
                      {t("processingLabel")}
                    </>
                  ) : (
                    <>
                      <Package size={14} className="mr-2" />
                      {t("receiveOrderBtn")}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
          )}

          {/* Payments Tab */}
          {activeTab === "payments" && (
          <div className="p-6">
            {payError && (
              <div className="mb-4 rounded-lg border border-[#f43f5e]/20 bg-[#f43f5e]/10 p-3 text-sm text-[#f43f5e]">
                {payError}
              </div>
            )}

            {payments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <CreditCard size={48} className="mb-4 text-[#606070]" />
                <h3 className="text-lg font-semibold text-[#f0f0f5]">{t("noPaymentsFound")}</h3>
                <p className="mt-1 text-sm text-[#9090a0]">{t("paymentsWillAppear")}</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t("dateCol")}</th>
                      <th>{t("amountCol")}</th>
                      <th>{t("methodCol")}</th>
                      <th>{t("referenceCol")}</th>
                      <th>{t("paidByCol")}</th>
                      <th>{t("notesCol")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="text-[#9090a0]">{formatDate(payment.paidAt)}</td>
                        <td className="font-medium text-[#10b981]">{formatCurrency(payment.amount)}</td>
                        <td className="text-[#9090a0]">{payment.method}</td>
                        <td className="text-[#9090a0] font-mono text-xs">{payment.reference || "—"}</td>
                        <td className="text-[#9090a0]">
                          {payment.payer?.firstName} {payment.payer?.lastName}
                        </td>
                        <td className="text-[#9090a0]">{payment.notes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {["PENDING", "APPROVED", "ORDERED"].includes(order.status) && remainingAmount > 0 && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="btn btn-primary"
                >
                  <Plus size={14} className="mr-2" />
                  {t("addPaymentBtn")}
                </button>
              </div>
            )}
          </div>
          )}
        </div>
        {showPaymentModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
            <div className="glass-card w-full max-w-md p-6">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[#f0f0f5]">{t("addPaymentBtn")}</h2>
                <button onClick={() => setShowPaymentModal(false)} className="text-[#606070] hover:text-[#f0f0f5]">
                  <XCircle size={20} />
                </button>
              </div>
              <form onSubmit={handlePayment} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm text-[#9090a0]">{t("amountLabel")}</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0.01}
                    max={remainingAmount}
                    required
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                    className="input"
                    placeholder={formatCurrency(remainingAmount)}
                  />
                  <p className="mt-1 text-xs text-[#606070]">
                    {t("maxAmount")} {formatCurrency(remainingAmount)}
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-[#9090a0]">{t("methodLabel")}</label>
                  <select
                    value={paymentData.method}
                    onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}
                    className="input"
                  >
                    {paymentMethods.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-[#9090a0]">{t("referenceLabel")}</label>
                  <input
                    type="text"
                    value={paymentData.reference}
                    onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
                    className="input"
                    placeholder={t("referencePlaceholder")}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-[#9090a0]">{t("notesLabel")}</label>
                  <textarea
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                    className="input"
                    rows={2}
                    placeholder={t("notesPlaceholder")}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowPaymentModal(false)} className="btn btn-secondary">
                    {t("cancelBtn")}
                  </button>
                  <button type="submit" disabled={paying} className="btn btn-primary">
                    {paying ? t("processingLabel") : t("addPaymentBtn")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}