"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useTranslation } from "@/contexts/LanguageContext";
import {
  ClipboardList, Plus, Search, Eye, X, Package, Truck, CheckCircle,
  Clock, XCircle, RefreshCw, DollarSign, ArrowRight,
} from "lucide-react";

interface POItem {
  id: string;
  quantity: number;
  unitCost: number;
  total: number;
  receivedQty: number;
  product: { id: string; name: string; sku: string };
}

interface Payment {
  id: string;
  amount: number;
  method: string;
  reference: string | null;
  notes: string | null;
  paidAt: string;
  payer: { firstName: string; lastName: string };
}

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  expectedDate: string | null;
  notes: string | null;
  createdAt: string;
  supplier: { id: string; name: string };
  items: POItem[];
  payments?: Payment[];
}

export default function PurchaseOrdersPage() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [detailOrder, setDetailOrder] = useState<PurchaseOrder | null>(null);
  const [userRole, setUserRole] = useState("");
  const [processing, setProcessing] = useState(false);
  const [receiveForm, setReceiveForm] = useState<Record<string, number>>({});
  const [paymentForm, setPaymentForm] = useState({ amount: "", method: "TRANSFER", reference: "", notes: "" });
  const [formError, setFormError] = useState("");
  const [activeTab, setActiveTab] = useState<"details" | "payments" | "receive">("details");

  useEffect(() => {
    fetch("/api/auth/session").then(r => r.json()).then(d => setUserRole(d?.user?.role || ""));
  }, []);

  useEffect(() => { fetchOrders(); }, [statusFilter]);

  async function fetchOrders() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/purchase-orders?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setOrders(json.purchaseOrders || json || []);
      }
    } catch (err) { console.error("Failed to fetch orders:", err); }
    finally { setLoading(false); }
  }

  async function fetchOrderDetail(id: string) {
    try {
      const [poRes, payRes] = await Promise.all([
        fetch(`/api/purchase-orders/${id}`),
        fetch(`/api/purchase-orders/${id}/payments`),
      ]);
      if (poRes.ok) {
        const json = await poRes.json();
        const found = json.purchaseOrder || json;
        if (payRes.ok) {
          const payJson = await payRes.json();
          found.payments = payJson.purchaseOrder?.payments || [];
        }
        setDetailOrder(found);
        const recv: Record<string, number> = {};
        (found.items || []).forEach((item: POItem) => { recv[item.id] = item.receivedQty || 0; });
        setReceiveForm(recv);
      }
    } catch (err) { console.error("Failed to fetch order detail:", err); }
  }

  async function handleApprove(id: string) {
    setProcessing(true);
    try {
      const res = await fetch("/api/purchase-orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "APPROVED" }),
      });
      if (res.ok) {
        fetchOrders();
        if (detailOrder?.id === id) fetchOrderDetail(id);
      }
    } finally { setProcessing(false); }
  }

  async function handleMarkPaid(id: string) {
    if (!detailOrder) return;
    setProcessing(true);
    setFormError("");
    try {
      if (!PaymentMethodValid(paymentForm.method)) {
        setFormError("Please select a valid payment method.");
        setProcessing(false);
        return;
      }
      const res = await fetch(`/api/purchase-orders/${id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: paymentForm.method,
          reference: paymentForm.reference || undefined,
          notes: paymentForm.notes || "Full payment",
        }),
      });
      if (res.ok) {
        fetchOrders();
        fetchOrderDetail(id);
        setPaymentForm({ amount: "", method: "TRANSFER", reference: "", notes: "" });
      } else {
        const json = await res.json().catch(() => ({}));
        setFormError(json.error || "Failed to record payment.");
      }
    } catch (err) { console.error(err); setFormError("Failed to record payment."); }
    finally { setProcessing(false); }
  }

  function PaymentMethodValid(method: string) {
    return ["CASH", "CARD", "TRANSFER", "USSD", "MOBILE", "ONLINE"].includes(method);
  }

  async function handleReceive(id: string) {
    if (!detailOrder) return;
    setProcessing(true);
    setFormError("");
    try {
      const entered = detailOrder.items
        .map((item) => ({ id: item.id, quantity: item.quantity, receivedQty: receiveForm[item.id] ?? item.receivedQty }));

      const invalid = entered.find((item) => item.receivedQty < 0 || item.receivedQty > item.quantity);
      if (invalid) {
        setProcessing(false);
        setFormError("Received quantity cannot be negative or exceed the ordered quantity.");
        return;
      }

      const items = entered.filter((item) => item.receivedQty > 0 && item.receivedQty !== (detailOrder.items.find((i) => i.id === item.id)?.receivedQty ?? 0));
      if (items.length === 0) {
        setProcessing(false);
        setFormError("Enter a received quantity for at least one item.");
        return;
      }

      const res = await fetch(`/api/purchase-orders/${id}/receive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (res.ok) {
        fetchOrders();
        fetchOrderDetail(id);
        setActiveTab("details");
      } else {
        const json = await res.json().catch(() => ({}));
        setFormError(json.error || "Failed to record receive.");
      }
    } catch (err) { console.error(err); setFormError("Failed to record receive."); }
    finally { setProcessing(false); }
  }

  const statusColors: Record<string, string> = {
    PENDING: "badge-warning", APPROVED: "badge-info", ORDERED: "badge-purple",
    PAID: "badge-success", PARTIALLY_RECEIVED: "badge-warning",
    RECEIVED: "badge-success", CANCELLED: "badge-danger",
  };
  const statusIcons: Record<string, unknown> = {
    PENDING: Clock, APPROVED: CheckCircle, ORDERED: Truck,
    PAID: DollarSign, PARTIALLY_RECEIVED: Package,
    RECEIVED: CheckCircle, CANCELLED: XCircle,
  };

  const canApprove = ["OWNER", "MANAGER", "PROCUREMENT_MANAGER"].includes(userRole);
  const canPay = ["OWNER", "MANAGER", "ACCOUNTANT", "CFO"].includes(userRole);
  const canReceive = ["OWNER", "MANAGER", "WAREHOUSE_MANAGER", "WAREHOUSE_REP"].includes(userRole);

  const filtered = orders.filter((o) =>
    search === "" || o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
    o.supplier.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout title={t("purchaseOrdersTitle")}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606070]" />
            <input type="text" placeholder={t("searchOrders")} value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
          </div>
          <div className="flex gap-2">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input select w-full max-w-[10rem]">
              <option value="">{t("allStatus")}</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="ORDERED">Ordered</option>
              <option value="PAID">Paid</option>
              <option value="PARTIALLY_RECEIVED">Partially Received</option>
              <option value="RECEIVED">Received</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <button onClick={fetchOrders} className="btn btn-secondary btn-sm"><RefreshCw size={14} /></button>
            {canApprove && (
              <a href="/dashboard/procurement/purchase-orders/new" className="btn btn-primary btn-sm"><Plus size={14} /> New PO</a>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex h-[40vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4a843] border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center p-12">
            <ClipboardList size={48} className="mb-4 text-[#606070]" />
            <h3 className="text-lg font-semibold text-[#f0f0f5]">{t("noPurchaseOrdersFound")}</h3>
            <p className="mt-1 text-sm text-[#9090a0]">{t("ordersWillAppear")}</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{t("orderNumberCol")}</th>
                  <th>{t("supplierCol")}</th>
                  <th>{t("itemsCol")}</th>
                  <th>{t("totalCol")}</th>
                  <th>{t("expectedCol")}</th>
                  <th>{t("statusCol")}</th>
                  <th>{t("actionsCol")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => {
                  const StatusIcon = (statusIcons[order.status] || Clock) as React.ComponentType<{ size?: number; className?: string }>;
                  return (
                    <tr key={order.id}>
                      <td className="font-mono text-sm font-medium text-[#f0f0f5]">{order.orderNumber}</td>
                      <td className="text-[#9090a0]">{order.supplier.name}</td>
                      <td className="text-[#9090a0]">{order.items?.length ?? 0}</td>
                      <td className="font-medium text-[#d4a843]">{formatCurrency(order.total)}</td>
                      <td className="text-sm text-[#9090a0]">{order.expectedDate ? formatDate(order.expectedDate) : "—"}</td>
                      <td>
                        <span className={`badge ${statusColors[order.status] || "badge-info"}`}>
                          <StatusIcon size={10} className="mr-1" />
                          {order.status.replace("_", " ")}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setSelectedOrder(order); fetchOrderDetail(order.id); setActiveTab("details"); }}
                            className="rounded-lg p-2 text-[#9090a0] hover:bg-[#2a2a3a] hover:text-[#3b82f6]" title="View">
                            <Eye size={14} />
                          </button>
                          {canApprove && order.status === "PENDING" && (
                            <button onClick={() => handleApprove(order.id)} disabled={processing}
                              className="rounded-lg bg-[#10b981]/20 p-2 text-[#10b981] hover:bg-[#10b981]/30 disabled:opacity-50" title="Approve">
                              <CheckCircle size={14} />
                            </button>
                          )}
                          {canPay && (order.status === "APPROVED" || order.status === "ORDERED") && (
                            <button onClick={() => { setSelectedOrder(order); fetchOrderDetail(order.id); setActiveTab("payments"); }}
                              className="rounded-lg bg-[#d4a843]/20 p-2 text-[#d4a843] hover:bg-[#d4a843]/30" title="Record Payment">
                              <DollarSign size={14} />
                            </button>
                          )}
                          {canReceive && (order.status === "PAID" || order.status === "PARTIALLY_RECEIVED") && (
                            <button onClick={() => { setSelectedOrder(order); fetchOrderDetail(order.id); setActiveTab("receive"); }}
                              className="rounded-lg bg-[#3b82f6]/20 p-2 text-[#3b82f6] hover:bg-[#3b82f6]/30" title="Receive Goods">
                              <Package size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {selectedOrder && detailOrder && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
            <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[#f0f0f5]">{detailOrder.orderNumber}</h2>
                <button onClick={() => { setSelectedOrder(null); setDetailOrder(null); }} className="text-[#606070] hover:text-[#f0f0f5]"><X size={20} /></button>
              </div>

              <div className="mb-4 flex gap-2 border-b border-[#2a2a3a] pb-2">
                {(["details", "payments", "receive"] as const).map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${activeTab === tab ? "bg-[#d4a843]/20 text-[#d4a843]" : "text-[#9090a0] hover:text-[#f0f0f5]"}`}>
                    {tab === "details" ? "Details" : tab === "payments" ? "Payments" : "Receive Goods"}
                  </button>
                ))}
              </div>

              {activeTab === "details" && (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-[#9090a0]">Supplier</span><span className="text-[#f0f0f5]">{detailOrder.supplier.name}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-[#9090a0]">Status</span><span className={`badge ${statusColors[detailOrder.status]}`}>{detailOrder.status.replace("_", " ")}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-[#9090a0]">Total</span><span className="font-medium text-[#d4a843]">{formatCurrency(detailOrder.total)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-[#9090a0]">Expected</span><span className="text-[#f0f0f5]">{detailOrder.expectedDate ? formatDate(detailOrder.expectedDate) : "—"}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-[#9090a0]">Created</span><span className="text-[#f0f0f5]">{formatDate(detailOrder.createdAt)}</span></div>
                  {detailOrder.notes && <div className="flex justify-between text-sm"><span className="text-[#9090a0]">Notes</span><span className="text-[#f0f0f5]">{detailOrder.notes}</span></div>}
                  {detailOrder.items?.length > 0 && (
                    <div className="mt-4">
                      <h4 className="mb-2 text-sm font-medium text-[#9090a0]">Items</h4>
                      <div className="space-y-2">
                        {detailOrder.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between rounded-lg bg-[#12121a] p-3 text-sm">
                            <div>
                              <span className="text-[#f0f0f5]">{item.product.name}</span>
                              <span className="ml-2 text-xs text-[#606070]">({item.product.sku})</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[#9090a0]">{item.quantity} x {formatCurrency(item.unitCost)}</span>
                              {item.receivedQty > 0 && (
                                <span className="ml-2 text-xs text-[#10b981]">({item.receivedQty} received)</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {canApprove && detailOrder.status === "PENDING" && (
                    <button onClick={() => handleApprove(detailOrder.id)} disabled={processing}
                      className="btn btn-primary mt-4 w-full">
                      {processing ? "Processing..." : "Approve Purchase Order"}
                    </button>
                  )}
                  {canApprove && detailOrder.status === "APPROVED" && (
                    <button onClick={async () => {
                      setProcessing(true);
                      await fetch("/api/purchase-orders", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: detailOrder.id, status: "ORDERED" }),
                      });
                      fetchOrders();
                      fetchOrderDetail(detailOrder.id);
                      setProcessing(false);
                    }} disabled={processing}
                      className="btn btn-primary mt-4 w-full">
                      {processing ? "Processing..." : "Mark as Ordered (Supplier Contacted)"}
                    </button>
                  )}
                </div>
              )}

              {activeTab === "payments" && (
                <div className="space-y-4">
                  {formError && <div className="rounded-lg bg-[#f43f5e]/10 p-3 text-sm text-[#f43f5e]">{formError}</div>}
                  <div className="rounded-lg bg-[#12121a] p-4">
                    <div className="flex justify-between text-sm mb-2"><span className="text-[#9090a0]">Order Total</span><span className="font-medium text-[#d4a843]">{formatCurrency(detailOrder.total)}</span></div>
                    <div className="flex justify-between text-sm mb-2"><span className="text-[#9090a0]">Total Paid</span><span className="font-medium text-[#10b981]">{formatCurrency((detailOrder.payments || []).reduce((s, p) => s + p.amount, 0))}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-[#9090a0]">Balance</span><span className="font-medium text-[#f43f5e]">{formatCurrency(detailOrder.total - (detailOrder.payments || []).reduce((s, p) => s + p.amount, 0))}</span></div>
                  </div>

                  {detailOrder.payments && detailOrder.payments.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-[#9090a0]">Payment History</h4>
                      {detailOrder.payments.map((pay) => (
                        <div key={pay.id} className="flex items-center justify-between rounded-lg bg-[#12121a] p-3 text-sm">
                          <div>
                            <span className="text-[#f0f0f5]">{formatCurrency(pay.amount)}</span>
                            <span className="ml-2 text-xs text-[#606070]">{pay.method.replace("_", " ")}</span>
                          </div>
                          <span className="text-xs text-[#9090a0]">{formatDate(pay.paidAt)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {canPay && detailOrder.status !== "PAID" && detailOrder.status !== "RECEIVED" && detailOrder.status !== "CANCELLED" && detailOrder.status !== "PARTIALLY_RECEIVED" && (
                    <div className="rounded-lg border border-[#2a2a3a] p-4 space-y-3">
                      <h4 className="text-sm font-medium text-[#f0f0f5]">Record Payment</h4>
                      <select value={paymentForm.method} onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })} className="input w-full">
                        <option value="TRANSFER">Bank Transfer</option>
                        <option value="CASH">Cash</option>
                        <option value="CARD">Card</option>
                        <option value="USSD">USSD</option>
                        <option value="MOBILE">Mobile</option>
                        <option value="ONLINE">Online</option>
                      </select>
                      <input type="text" placeholder="Reference number" value={paymentForm.reference} onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })} className="input w-full" />
                      <input type="text" placeholder="Notes (optional)" value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} className="input w-full" />
                      <button onClick={() => handleMarkPaid(detailOrder.id)} disabled={processing}
                        className="btn btn-primary w-full">
                        {processing ? "Processing..." : "Mark as Paid"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "receive" && (
                <div className="space-y-4">
                  {formError && <div className="rounded-lg bg-[#f43f5e]/10 p-3 text-sm text-[#f43f5e]">{formError}</div>}
                  <p className="text-sm text-[#9090a0]">Enter the total quantity received so far for each item. Stock is updated by the difference from the last recorded value.</p>
                  {detailOrder.items?.map((item) => {
                    const remaining = item.quantity - item.receivedQty;
                    return (
                      <div key={item.id} className="flex items-center justify-between rounded-lg bg-[#12121a] p-3">
                        <div>
                          <span className="text-[#f0f0f5] text-sm">{item.product.name}</span>
                          <div className="text-xs text-[#606070]">
                            Ordered: {item.quantity} | Already received: {item.receivedQty} | Remaining: {remaining}
                          </div>
                        </div>
                        <input type="number" min={0} max={item.quantity}
                          value={receiveForm[item.id] ?? item.receivedQty}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setReceiveForm({ ...receiveForm, [item.id]: val });
                          }}
                          className="input w-24 text-center" placeholder="Qty" />
                      </div>
                    );
                  })}
                  {canReceive && detailOrder.status !== "RECEIVED" && detailOrder.status !== "CANCELLED" && detailOrder.status !== "PENDING" && (
                    <button onClick={() => handleReceive(detailOrder.id)} disabled={processing}
                      className="btn btn-primary w-full">
                      {processing ? "Processing..." : "Receive Goods & Update Stock"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
