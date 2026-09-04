"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useTranslation } from "@/contexts/LanguageContext";
import {
  Search,
  RefreshCw,
  CreditCard,
  DollarSign,
  AlertTriangle,
  Clock,
  CheckCircle,
  Package,
  XCircle,
  Truck,
  Plus,
  Eye,
} from "lucide-react";
import Pagination from "@/components/ui/Pagination";

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  expectedDate: string | null;
  createdAt: string;
  supplier: { id: string; name: string };
  payments?: { amount: number }[];
}

interface Payment {
  id: string;
  amount: number;
  method: string;
  reference: string | null;
  paidAt: string;
  paidBy: string;
  payer: { firstName: string; lastName: string };
  purchaseOrder: { id: string; orderNumber: string; supplier: { name: string } };
}

export default function ProcurementPaymentsPage() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [view, setView] = useState<"orders" | "payments">("orders");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (search) params.set("search", search);
      params.set("page", String(page));
      params.set("limit", "20");

      const res = await fetch(`/api/purchase-orders?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setOrders(json.purchaseOrders || []);
        setTotal(json.total || 0);
        setTotalPages(json.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, page]);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");

      const res = await fetch(`/api/procurement/payments?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setPayments(json.payments || []);
        setTotal(json.total || 0);
        setTotalPages(json.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch payments:", err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (view === "orders") {
      fetchOrders();
    } else {
      fetchPayments();
    }
  }, [view, fetchOrders, fetchPayments]);

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

  const filteredOrders = orders.filter((o) =>
    search === "" ||
    o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
    o.supplier.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPaid = orders.reduce((sum, o) => sum + (o.payments ?? []).reduce((s, p) => s + p.amount, 0), 0);
  const totalPending = orders
    .filter((o) => ["PENDING", "APPROVED", "ORDERED"].includes(o.status))
    .reduce((sum, o) => sum + (o.total - (o.payments ?? []).reduce((s, p) => s + p.amount, 0)), 0);

  const stats = [
    { label: t("totalPurchaseOrders"), value: total, icon: CreditCard, color: "from-[#3b82f6]/20 to-[#3b82f6]/5", iconColor: "text-[#3b82f6]" },
    { label: t("totalPaidLabel"), value: formatCurrency(totalPaid), icon: DollarSign, color: "from-[#10b981]/20 to-[#10b981]/5", iconColor: "text-[#10b981]" },
    { label: t("totalPendingPayment"), value: formatCurrency(totalPending), icon: AlertTriangle, color: "from-[#f59e0b]/20 to-[#f59e0b]/5", iconColor: "text-[#f59e0b]" },
  ];

  return (
    <DashboardLayout title={t("procurementPaymentsTitle")}>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="stat-card">
                <div className="flex items-start justify-between">
                  <div className={`stat-icon bg-gradient-to-br ${stat.color}`}>
                    <Icon size={20} className={stat.iconColor} />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-bold text-[#f0f0f5]">{stat.value}</p>
                <p className="mt-1 text-sm text-[#9090a0]">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="glass-card p-4">
          <div className="flex gap-1">
            <button
              onClick={() => { setView("orders"); setPage(1); }}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                view === "orders"
                  ? "bg-[#d4a843]/20 text-[#d4a843]"
                  : "text-[#9090a0] hover:text-[#f0f0f5] hover:bg-[#2a2a3a]"
              }`}
            >
              <CreditCard size={14} />
              {t("purchaseOrdersLabel")}
            </button>
            <button
              onClick={() => { setView("payments"); setPage(1); }}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                view === "payments"
                  ? "bg-[#d4a843]/20 text-[#d4a843]"
                  : "text-[#9090a0] hover:text-[#f0f0f5] hover:bg-[#2a2a3a]"
              }`}
            >
              <DollarSign size={14} />
              {t("paymentsLabel")}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606070]" />
            <input
              type="text"
              placeholder={view === "orders" ? t("searchOrders") : t("searchPayments")}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input pl-10"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="input select w-full max-w-[10rem]"
            >
              <option value="">{t("allStatus")}</option>
              <option value="PENDING">{t("pendingLabel")}</option>
              <option value="APPROVED">{t("approvedLabel")}</option>
              <option value="ORDERED">{t("orderedLabel")}</option>
              <option value="PAID">{t("paidLabel")}</option>
              <option value="PARTIALLY_RECEIVED">{t("partiallyReceived")}</option>
              <option value="RECEIVED">{t("receivedLabel")}</option>
              <option value="CANCELLED">{t("cancelledLabel")}</option>
            </select>
            <button onClick={() => { if (view === "orders") fetchOrders(); else fetchPayments(); }} className="btn btn-secondary btn-sm">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex h-[40vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4a843] border-t-transparent" />
          </div>
        ) : view === "orders" ? (
          <>
            {filteredOrders.length === 0 ? (
              <div className="glass-card flex flex-col items-center justify-center p-12">
                <CreditCard size={48} className="mb-4 text-[#606070]" />
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
                      <th>{t("totalCol")}</th>
                      <th>{t("paidCol")}</th>
                      <th>{t("remainingCol")}</th>
                      <th>{t("expectedCol")}</th>
                      <th>{t("statusCol")}</th>
                      <th>{t("actionsCol")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => {
                      const paid = (order.payments ?? []).reduce((s, p) => s + p.amount, 0);
                      const remaining = order.total - paid;
                      const StatusIcon = statusIcons[order.status] || Clock;
                      return (
                        <tr key={order.id}>
                          <td className="font-mono text-sm font-medium text-[#f0f0f5]">{order.orderNumber}</td>
                          <td className="text-[#9090a0]">{order.supplier.name}</td>
                          <td className="font-medium text-[#d4a843]">{formatCurrency(order.total)}</td>
                          <td className="font-medium text-[#10b981]">{formatCurrency(paid)}</td>
                          <td className={`font-medium ${remaining > 0 ? "text-[#f43f5e]" : "text-[#10b981]"}`}>
                            {formatCurrency(remaining)}
                          </td>
                          <td className="text-sm text-[#9090a0]">{order.expectedDate ? formatDate(order.expectedDate) : "—"}</td>
                          <td>
                            <span className={`badge ${statusColors[order.status] || "badge-info"}`}>
                              <StatusIcon size={10} className="mr-1" />
                              {order.status.replace("_", " ")}
                            </span>
                          </td>
                          <td>
                            <a href={`/dashboard/procurement/purchase-orders/${order.id}`} className="rounded-lg p-2 text-[#9090a0] hover:bg-[#2a2a3a] hover:text-[#3b82f6] inline-flex" title={t("viewDetails")}>
                              <Eye size={14} />
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        ) : (
          <>
            {payments.length === 0 ? (
              <div className="glass-card flex flex-col items-center justify-center p-12">
                <DollarSign size={48} className="mb-4 text-[#606070]" />
                <h3 className="text-lg font-semibold text-[#f0f0f5]">{t("noPaymentsFound")}</h3>
                <p className="mt-1 text-sm text-[#9090a0]">{t("paymentsWillAppear")}</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t("dateCol")}</th>
                      <th>{t("orderNumberCol")}</th>
                      <th>{t("supplierCol")}</th>
                      <th>{t("amountCol")}</th>
                      <th>{t("methodCol")}</th>
                      <th>{t("referenceCol")}</th>
                      <th>{t("paidByCol")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="text-[#9090a0]">{formatDate(payment.paidAt)}</td>
                        <td className="font-mono text-sm font-medium text-[#f0f0f5]">{payment.purchaseOrder.orderNumber}</td>
                        <td className="text-[#9090a0]">{payment.purchaseOrder.supplier.name}</td>
                        <td className="font-medium text-[#10b981]">{formatCurrency(payment.amount)}</td>
                        <td className="text-[#9090a0]">{payment.method}</td>
                        <td className="text-[#9090a0] font-mono text-xs">{payment.reference || "—"}</td>
                        <td className="text-[#9090a0]">{payment.payer?.firstName} {payment.payer?.lastName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}