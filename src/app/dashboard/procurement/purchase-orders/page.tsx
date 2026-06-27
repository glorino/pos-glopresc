"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useTranslation } from "@/contexts/LanguageContext";
import {
  ClipboardList,
  Plus,
  Search,
  Eye,
  X,
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
} from "lucide-react";

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  expectedDate: string | null;
  createdAt: string;
  supplier: { id: string; name: string };
  items?: { id: string; quantity: number; unitPrice: number; product: { name: string } }[];
}

export default function PurchaseOrdersPage() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

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
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  }

  const statusColors: Record<string, string> = {
    PENDING: "badge-warning",
    APPROVED: "badge-info",
    RECEIVED: "badge-success",
    CANCELLED: "badge-danger",
  };

  const statusIcons: Record<string, any> = {
    PENDING: Clock,
    APPROVED: CheckCircle,
    RECEIVED: Package,
    CANCELLED: XCircle,
  };

  const filteredOrders = orders.filter((o) =>
    search === "" ||
    o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
    o.supplier.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout role="PROCUREMENT_MANAGER" title={t("purchaseOrdersTitle")}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white" />
            <input type="text" placeholder={t("searchOrders")} value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
          </div>
          <div className="flex gap-2">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input select w-40">
              <option value="">{t("allStatus")}</option>
              <option value="PENDING">{t("pendingLabel")}</option>
              <option value="APPROVED">{t("approvedLabel")}</option>
              <option value="RECEIVED">{t("receivedLabel")}</option>
              <option value="CANCELLED">{t("cancelledLabel")}</option>
            </select>
            <button onClick={fetchOrders} className="btn btn-secondary btn-sm"><RefreshCw size={14} /></button>
          </div>
        </div>

        {loading ? (
          <div className="flex h-[40vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4a843] border-t-transparent" />
          </div>
        ) : filteredOrders.length === 0 ? (
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
                {filteredOrders.map((order) => {
                  const StatusIcon = statusIcons[order.status] || Clock;
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
                          {order.status}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => setSelectedOrder(order)} className="rounded-lg p-2 text-[#9090a0] hover:bg-[#2a2a3a] hover:text-[#3b82f6]">
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="glass-card w-full max-w-lg p-6">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[#f0f0f5]">{t("orderDetail")} {selectedOrder.orderNumber}</h2>
                <button onClick={() => setSelectedOrder(null)} className="text-[#606070] hover:text-[#f0f0f5]"><X size={20} /></button>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-[#9090a0]">Supplier</span><span className="text-[#f0f0f5]">{selectedOrder.supplier.name}</span></div>
                <div className="flex justify-between text-sm"><span className="text-[#9090a0]">Status</span><span className={`badge ${statusColors[selectedOrder.status]}`}>{selectedOrder.status}</span></div>
                <div className="flex justify-between text-sm"><span className="text-[#9090a0]">Total</span><span className="font-medium text-[#d4a843]">{formatCurrency(selectedOrder.total)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-[#9090a0]">Created</span><span className="text-[#f0f0f5]">{formatDate(selectedOrder.createdAt)}</span></div>
                {selectedOrder.items && selectedOrder.items.length > 0 && (
                  <div className="mt-4">
                    <h4 className="mb-2 text-sm font-medium text-[#9090a0]">{t("itemsHeading")}</h4>
                    <div className="space-y-2">
                      {selectedOrder.items.map((item) => (
                        <div key={item.id} className="flex justify-between rounded-lg bg-[#12121a] p-3 text-sm">
                          <span className="text-[#f0f0f5]">{item.product.name}</span>
                          <span className="text-[#9090a0]">{item.quantity} x {formatCurrency(item.unitPrice)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
