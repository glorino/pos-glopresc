"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { useTranslation } from "@/contexts/LanguageContext";
import {
  Search,
  MapPin,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Eye,
  X,
  ShoppingCart,
} from "lucide-react";

interface OrderItem {
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface OnlineOrder {
  id: string;
  invoiceNumber: string;
  customer: string;
  customerEmail: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amountPaid: number;
  paymentMethod: string;
  status: string;
  shippingAddress: string | null;
  notes: string | null;
  txRef: string | null;
  createdAt: string;
  items: OrderItem[];
}

export default function OnlineOrdersPage() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<OnlineOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<OnlineOrder | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("paymentMethod", "ONLINE");
      params.set("limit", "200");
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/sales?${params}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(
          data.sales.map((s: any) => ({
            ...s,
            customer: `${s.customer?.firstName || ""} ${s.customer?.lastName || ""}`.trim() || "Guest",
            customerEmail: s.customer?.email || "",
          }))
        );
      }
    } catch (error) {
      console.error("Failed to fetch online orders:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  function getStatusBadge(status: string) {
    switch (status) {
      case "COMPLETED":
        return "bg-[#10b981]/10 text-[#10b981]";
      case "PENDING":
        return "bg-[#f59e0b]/10 text-[#f59e0b]";
      case "SHIPPED":
        return "bg-blue-500/10 text-blue-400";
      case "DELIVERED":
        return "bg-[#10b981]/10 text-[#10b981]";
      case "CANCELLED":
        return "bg-red-500/10 text-red-400";
      default:
        return "bg-[#9090a0]/10 text-[#9090a0]";
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle2 size={14} />;
      case "PENDING":
        return <Clock size={14} />;
      case "SHIPPED":
        return <Truck size={14} />;
      case "DELIVERED":
        return <CheckCircle2 size={14} />;
      default:
        return <Package size={14} />;
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#f0f0f5]">{t("onlineOrders")}</h1>
            <p className="text-sm text-[#9090a0]">
              Manage online shop orders and dispatch
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#9090a0]">
            <ShoppingCart size={16} />
            {orders.length} order(s)
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606070]" />
            <input
              type="text"
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchOrders()}
              className="input pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input select w-auto"
          >
            <option value="">All Status</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#f59e0b] border-t-transparent" />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center text-[#9090a0]">
            <ShoppingCart size={48} className="mx-auto mb-4 opacity-30" />
            <p>No online orders found</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Delivery Address</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="font-mono text-sm font-semibold text-[#f59e0b]">
                      {order.invoiceNumber}
                    </td>
                    <td>
                      <p className="font-medium text-[#f0f0f5]">{order.customer}</p>
                      {order.customerEmail && (
                        <p className="text-xs text-[#606070]">{order.customerEmail}</p>
                      )}
                    </td>
                    <td className="text-[#9090a0]">
                      {order.items.length} item(s)
                    </td>
                    <td className="font-semibold text-[#f0f0f5]">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="max-w-[200px]">
                      {order.shippingAddress ? (
                        <div className="flex items-start gap-1">
                          <MapPin size={12} className="mt-0.5 shrink-0 text-[#f59e0b]" />
                          <span className="text-xs text-[#9090a0] truncate">
                            {order.shippingAddress}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-[#606070]">No address</span>
                      )}
                    </td>
                    <td className="text-sm text-[#9090a0] whitespace-nowrap">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadge(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="rounded-lg p-1.5 text-[#606070] hover:bg-[#2a2a3a] hover:text-[#f0f0f5]"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="glass-card w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#f0f0f5]">
                Order #{selectedOrder.invoiceNumber}
              </h2>
              <button onClick={() => setSelectedOrder(null)} className="text-[#606070] hover:text-[#f0f0f5]">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[#606070]">Customer</p>
                  <p className="font-medium text-[#f0f0f5]">{selectedOrder.customer}</p>
                  {selectedOrder.customerEmail && (
                    <p className="text-xs text-[#9090a0]">{selectedOrder.customerEmail}</p>
                  )}
                </div>
                <div>
                  <p className="text-[#606070]">Date</p>
                  <p className="font-medium text-[#f0f0f5]">
                    {formatDateTime(selectedOrder.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-[#606070]">Payment</p>
                  <span className="inline-flex rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-400">
                    ONLINE
                  </span>
                </div>
                <div>
                  <p className="text-[#606070]">Status</p>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusBadge(selectedOrder.status)}`}>
                    {getStatusIcon(selectedOrder.status)}
                    {selectedOrder.status}
                  </span>
                </div>
              </div>

              {selectedOrder.shippingAddress && (
                <div className="rounded-xl border border-[#f59e0b]/30 bg-[#f59e0b]/5 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f59e0b]/10">
                      <MapPin size={20} className="text-[#f59e0b]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#f59e0b]">DELIVERY ADDRESS</p>
                      <p className="mt-1 text-sm text-[#f0f0f5]">{selectedOrder.shippingAddress}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t border-[#2a2a3a] pt-4">
                <h4 className="mb-3 text-sm font-semibold text-[#f0f0f5]">Items</h4>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item, i) => (
                        <tr key={i}>
                          <td className="font-medium text-[#f0f0f5]">{item.name}</td>
                          <td className="text-[#9090a0]">{item.quantity}</td>
                          <td className="text-[#9090a0]">{formatCurrency(item.unitPrice)}</td>
                          <td className="font-medium text-[#d4a843]">{formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="border-t border-[#2a2a3a] pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#9090a0]">Subtotal</span>
                  <span className="text-[#f0f0f5]">{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[#9090a0]">Discount</span>
                    <span className="text-[#f43f5e]">-{formatCurrency(selectedOrder.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-[#2a2a3a] pt-2">
                  <span className="font-semibold text-[#f0f0f5]">Total</span>
                  <span className="font-semibold text-[#d4a843]">
                    {formatCurrency(selectedOrder.total)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9090a0]">Amount Paid</span>
                  <span className="text-[#10b981]">{formatCurrency(selectedOrder.amountPaid)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
