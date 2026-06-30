"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { useTranslation } from "@/contexts/LanguageContext";
import {
  Truck,
  ClipboardList,
  ShoppingCart,
  FileText,
  DollarSign,
  Plus,
  Eye,
  RefreshCw,
  Search,
  Calendar,
  Package,
} from "lucide-react";
import Pagination from "@/components/ui/Pagination";

interface Supplier {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  isActive: boolean;
  _count?: { purchaseOrders: number; products: number };
  avgItemCost?: number;
  totalItemsSupplied?: number;
  lastOrderDate?: string | null;
}

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  expectedDate: string | null;
  createdAt: string;
  supplier: { id: string; name: string };
  _count?: { items: number };
}

interface SupplyRequest {
  id: string;
  description: string;
  status: string;
  urgency: string;
  createdAt: string;
  supplier: { name: string };
}

interface SupplierData {
  suppliers: Supplier[];
  total: number;
  page: number;
  totalPages: number;
}

interface OrderData {
  purchaseOrders: PurchaseOrder[];
  total: number;
  page: number;
  totalPages: number;
}

export default function ProcurementDashboard() {
  const { t } = useTranslation();
  const [suppliersData, setSuppliersData] = useState<SupplierData | null>(null);
  const [ordersData, setOrdersData] = useState<OrderData | null>(null);
  const [supplyRequests, setSupplyRequests] = useState<SupplyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [supplierPage, setSupplierPage] = useState(1);
  const [orderPage, setOrderPage] = useState(1);

  useEffect(() => {
    setSupplierPage(1);
    setOrderPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [search, statusFilter, supplierPage, orderPage]);

  async function fetchData() {
    setLoading(true);
    try {
      const supplierParams = new URLSearchParams();
      if (search) supplierParams.set("search", search);
      supplierParams.set("page", String(supplierPage));
      supplierParams.set("limit", "10");

      const orderParams = new URLSearchParams();
      if (statusFilter) orderParams.set("status", statusFilter);
      orderParams.set("page", String(orderPage));
      orderParams.set("limit", "10");

      const [suppliersRes, ordersRes, requestsRes] = await Promise.all([
        fetch(`/api/suppliers?${supplierParams.toString()}`),
        fetch(`/api/purchase-orders?${orderParams.toString()}`),
        fetch("/api/supply-requests").catch(() => null),
      ]);

      if (suppliersRes.ok) {
        const json = await suppliersRes.json();
        setSuppliersData(json);
      }
      if (ordersRes.ok) {
        const json = await ordersRes.json();
        setOrdersData(json);
      }
      if (requestsRes && requestsRes.ok) {
        const json = await requestsRes.json();
        setSupplyRequests(json.supplyRequests ?? json ?? []);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }

  const suppliers = suppliersData?.suppliers ?? [];
  const orders = ordersData?.purchaseOrders ?? [];
  const activeSuppliers = suppliers.filter((s) => s.isActive).length;
  const pendingOrders = orders.filter((o) => o.status === "PENDING").length;
  const totalOrders = ordersData?.total ?? 0;
  const monthlySpend = orders.reduce((sum, o) => {
    const d = new Date(o.createdAt);
    const now = new Date();
    if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
      return sum + o.total;
    }
    return sum;
  }, 0);

  const stats = [
    {
      label: t("activeSuppliers"),
      value: activeSuppliers,
      icon: Truck,
      color: "from-[#d4a843]/20 to-[#d4a843]/5",
      iconColor: "text-[#d4a843]",
    },
    {
      label: t("pendingOrders"),
      value: pendingOrders,
      icon: ClipboardList,
      color: "from-[#f59e0b]/20 to-[#f59e0b]/5",
      iconColor: "text-[#f59e0b]",
    },
    {
      label: t("totalOrders"),
      value: totalOrders,
      icon: ShoppingCart,
      color: "from-[#3b82f6]/20 to-[#3b82f6]/5",
      iconColor: "text-[#3b82f6]",
    },
    {
      label: t("pendingApprovals"),
      value: supplyRequests.filter((r) => r.status === "PENDING").length,
      icon: FileText,
      color: "from-[#8b5cf6]/20 to-[#8b5cf6]/5",
      iconColor: "text-[#8b5cf6]",
    },
    {
      label: t("monthlySpend"),
      value: formatCurrency(monthlySpend),
      icon: DollarSign,
      color: "from-[#10b981]/20 to-[#10b981]/5",
      iconColor: "text-[#10b981]",
    },
  ];

  const quickActions = [
    { label: t("addSupplier"), href: "/dashboard/procurement/suppliers", icon: Plus },
    { label: t("createOrder"), href: "/dashboard/procurement/purchase-orders/new", icon: ShoppingCart },
    { label: t("viewSuppliers"), href: "/dashboard/procurement/suppliers", icon: Eye },
    { label: t("stockRequestsLabel"), href: "/dashboard/procurement/stock-requests", icon: FileText },
  ];

  function getOrderStatusBadge(status: string) {
    switch (status) {
      case "PENDING": return "badge-warning";
      case "APPROVED": return "badge-info";
      case "ORDERED": return "badge-purple";
      case "RECEIVED": return "badge-success";
      case "CANCELLED": return "badge-danger";
      default: return "badge-info";
    }
  }

  function getRequestStatusBadge(status: string) {
    switch (status) {
      case "PENDING": return "badge-warning";
      case "APPROVED": return "badge-info";
      case "ORDERED": return "badge-purple";
      case "RECEIVED": return "badge-success";
      case "CANCELLED": return "badge-danger";
      default: return "badge-info";
    }
  }

  function getUrgencyBadge(urgency: string) {
    switch (urgency) {
      case "URGENT": return "badge-danger";
      case "HIGH": return "badge-warning";
      case "NORMAL": return "badge-info";
      case "LOW": return "badge-success";
      default: return "badge-info";
    }
  }

  return (
    <DashboardLayout title={t("procurementDashboard")}>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="stat-card">
                <div className="flex items-start justify-between">
                  <div className={`stat-icon bg-gradient-to-br ${stat.color}`}>
                    <Icon size={20} className={stat.iconColor} />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-bold text-[#f0f0f5]">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-[#9090a0]">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="glass-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-[#f0f0f5]">{t("quickActions")}</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-3 rounded-xl border border-[#2a2a3a] bg-[#1c1c28] p-3 transition-all hover:border-[#d4a843]/30 hover:bg-[#1c1c28]/80"
                >
                  <Icon size={18} className="text-[#d4a843]" />
                  <span className="text-sm font-medium text-[#f0f0f5]">{action.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-[#f0f0f5]">{t("suppliers")}</h3>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606070]" />
              <input
                type="text"
                placeholder={t("searchSuppliers")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10 w-56"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input select w-40"
            >
              <option value="">{t("allStatus")}</option>
              <option value="PENDING">{t("pending")}</option>
              <option value="APPROVED">{t("approved")}</option>
              <option value="ORDERED">{t("ordered")}</option>
              <option value="RECEIVED">{t("received")}</option>
            </select>
            <button onClick={fetchData} className="btn btn-secondary btn-sm">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4a843] border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {/* Suppliers Table */}
            <div className="glass-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-base font-semibold text-[#f0f0f5]">{t("suppliers")}</h4>
                <Link href="/dashboard/procurement" className="text-xs text-[#d4a843] hover:underline">
                  {t("viewAll")}
                </Link>
              </div>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t("name")}</th>
                      <th>{t("contact")}</th>
                      <th>{t("avgCost")}</th>
                      <th>{t("itemsLabel")}</th>
                      <th>{t("status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.map((supplier) => (
                      <tr key={supplier.id}>
                        <td className="font-medium text-[#f0f0f5]">{supplier.name}</td>
                        <td className="text-[#9090a0]">{supplier.contactName ?? supplier.phone ?? "—"}</td>
                        <td className="font-medium text-[#d4a843]">
                          {supplier.avgItemCost ? formatCurrency(supplier.avgItemCost) : "—"}
                        </td>
                        <td className="text-[#9090a0]">{supplier.totalItemsSupplied ?? supplier._count?.products ?? 0}</td>
                        <td>
                          <span className={`badge ${supplier.isActive ? "badge-success" : "badge-danger"}`}>
                            {supplier.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {suppliers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center text-[#606070] py-6">
                          {t("noSuppliersFound")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination currentPage={suppliersData?.page ?? 1} totalPages={suppliersData?.totalPages ?? 1} onPageChange={setSupplierPage} />
            </div>

            {/* Purchase Orders Table */}
            <div className="glass-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-base font-semibold text-[#f0f0f5]">{t("purchaseOrders")}</h4>
                <Link href="/dashboard/procurement" className="text-xs text-[#d4a843] hover:underline">
                  {t("viewAll")}
                </Link>
              </div>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t("orderNumber")}</th>
                      <th>{t("supplier")}</th>
                      <th>{t("total")}</th>
                      <th>{t("status")}</th>
                      <th>{t("date")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td className="font-mono text-xs font-medium text-[#f0f0f5]">
                          {order.orderNumber}
                        </td>
                        <td className="text-[#9090a0]">{order.supplier.name}</td>
                        <td className="font-medium text-[#d4a843]">
                          {formatCurrency(order.total)}
                        </td>
                        <td>
                          <span className={`badge ${getOrderStatusBadge(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="text-[#9090a0]">
                          {formatDateTime(order.createdAt)}
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center text-[#606070] py-6">
                          {t("noPurchaseOrdersFound")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination currentPage={ordersData?.page ?? 1} totalPages={ordersData?.totalPages ?? 1} onPageChange={setOrderPage} />
            </div>
          </div>
        )}

        {/* Supply Requests */}
        {!loading && supplyRequests.length > 0 && (
          <div className="glass-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-base font-semibold text-[#f0f0f5]">{t("supplyRequests")}</h4>
                <Link href="/dashboard/procurement" className="text-xs text-[#d4a843] hover:underline">
                {t("viewAll")}
              </Link>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t("description")}</th>
                    <th>{t("supplier")}</th>
                    <th>{t("urgency")}</th>
                    <th>{t("status")}</th>
                    <th>{t("date")}</th>
                  </tr>
                </thead>
                <tbody>
                  {supplyRequests.slice(0, 5).map((req) => (
                    <tr key={req.id}>
                      <td className="font-medium text-[#f0f0f5]">{req.description}</td>
                      <td className="text-[#9090a0]">{req.supplier.name}</td>
                      <td>
                        <span className={`badge ${getUrgencyBadge(req.urgency)}`}>
                          {req.urgency}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getRequestStatusBadge(req.status)}`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="text-[#9090a0]">
                        {formatDateTime(req.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
