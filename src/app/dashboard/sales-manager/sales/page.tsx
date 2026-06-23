"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import {
  Search,
  Eye,
  RotateCcw,
  Download,
  X,
  ShoppingCart,
  Filter,
} from "lucide-react";

interface SaleItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Sale {
  id: string;
  invoiceNumber: string;
  customer: string;
  cashier: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amountPaid: number;
  changeDue: number;
  paymentMethod: string;
  status: string;
  notes: string | null;
  createdAt: string;
  items: SaleItem[];
}

export default function SalesManagementPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  async function fetchSales() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (paymentFilter) params.set("paymentMethod", paymentFilter);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      params.set("limit", "100");
      const res = await fetch(`/api/sales?${params}`);
      if (res.ok) {
        const data = await res.json();
        const mapped = (data.sales ?? []).map((s: any) => ({
          ...s,
          customer: s.customer ? `${s.customer.firstName ?? ""} ${s.customer.lastName ?? ""}`.trim() : "Walk-in",
          cashier: s.user ? `${s.user.firstName ?? ""} ${s.user.lastName ?? ""}`.trim() : "—",
          items: (s.items ?? []).map((i: any) => ({
            name: i.product?.name ?? i.name ?? "Item",
            quantity: i.quantity,
            unitPrice: Number(i.unitPrice),
            total: Number(i.total),
          })),
        }));
        setSales(mapped);
      }
    } catch (error) {
      console.error("Failed to fetch sales:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSales();
  }, [statusFilter, paymentFilter]);

  const handleExport = () => {
    const csv = [
      ["Invoice", "Customer", "Items", "Total", "Payment", "Status", "Date"].join(","),
      ...sales.map((s) =>
        [
          s.invoiceNumber,
          s.customer,
          s.items.length,
          s.total,
          s.paymentMethod,
          s.status,
          s.createdAt,
        ].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  async function handleReturn(sale: Sale) {
    if (!confirm(`Process return for invoice ${sale.invoiceNumber}?`)) return;
    try {
      const res = await fetch("/api/sales", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sale.id, status: "RETURNED" }),
      });
      if (res.ok) fetchSales();
    } catch (error) {
      console.error("Failed to process return:", error);
    }
  }

  return (
    <DashboardLayout role="SALES_MANAGER" title="Sales Management">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606070]" />
              <input
                type="text"
                placeholder="Search invoices..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchSales()}
                className="input w-64 pl-10"
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
              <option value="RETURNED">Returned</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="input select w-auto"
            >
              <option value="">All Payments</option>
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="TRANSFER">Transfer</option>
              <option value="USSD">USSD</option>
              <option value="MOBILE">Mobile</option>
            </select>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input w-auto"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input w-auto"
            />
            <button onClick={fetchSales} className="btn btn-secondary btn-sm">
              <Filter size={14} />
            </button>
          </div>
          <button onClick={handleExport} className="btn btn-secondary">
            <Download size={16} />
            Export
          </button>
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
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id}>
                    <td className="font-medium text-[#f0f0f5]">{sale.invoiceNumber}</td>
                    <td className="text-[#9090a0]">{sale.customer}</td>
                    <td className="text-[#9090a0]">{sale.items.length}</td>
                    <td className="font-medium text-[#d4a843]">{formatCurrency(sale.total)}</td>
                    <td>
                      <span className="badge badge-info">{sale.paymentMethod}</span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          sale.status === "COMPLETED"
                            ? "badge-success"
                            : sale.status === "RETURNED"
                            ? "badge-warning"
                            : sale.status === "CANCELLED"
                            ? "badge-danger"
                            : "badge-info"
                        }`}
                      >
                        {sale.status}
                      </span>
                    </td>
                    <td className="text-[#9090a0]">{formatDateTime(sale.createdAt)}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedSale(sale)}
                          className="rounded-lg p-2 text-[#9090a0] hover:bg-[#2a2a3a] hover:text-[#3b82f6]"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        {sale.status === "COMPLETED" && (
                          <button
                            onClick={() => handleReturn(sale)}
                            className="rounded-lg p-2 text-[#9090a0] hover:bg-[#2a2a3a] hover:text-[#f59e0b]"
                            title="Process Return"
                          >
                            <RotateCcw size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {sales.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center text-[#606070]">
                      No sales found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="glass-card w-full max-w-lg p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#f0f0f5]">
                Sale #{selectedSale.invoiceNumber}
              </h2>
              <button onClick={() => setSelectedSale(null)} className="text-[#606070] hover:text-[#f0f0f5]">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[#606070]">Customer</p>
                  <p className="font-medium text-[#f0f0f5]">{selectedSale.customer}</p>
                </div>
                <div>
                  <p className="text-[#606070]">Cashier</p>
                  <p className="font-medium text-[#f0f0f5]">{selectedSale.cashier}</p>
                </div>
                <div>
                  <p className="text-[#606070]">Date</p>
                  <p className="font-medium text-[#f0f0f5]">
                    {formatDateTime(selectedSale.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-[#606070]">Payment</p>
                  <span className="badge badge-info">{selectedSale.paymentMethod}</span>
                </div>
              </div>

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
                      {selectedSale.items.map((item, i) => (
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
                  <span className="text-[#f0f0f5]">{formatCurrency(selectedSale.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9090a0]">Discount</span>
                  <span className="text-[#f43f5e]">-{formatCurrency(selectedSale.discount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9090a0]">Tax</span>
                  <span className="text-[#f0f0f5]">{formatCurrency(selectedSale.tax)}</span>
                </div>
                <div className="flex justify-between border-t border-[#2a2a3a] pt-2">
                  <span className="font-semibold text-[#f0f0f5]">Total</span>
                  <span className="font-semibold text-[#d4a843]">
                    {formatCurrency(selectedSale.total)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9090a0]">Amount Paid</span>
                  <span className="text-[#10b981]">{formatCurrency(selectedSale.amountPaid)}</span>
                </div>
                {selectedSale.changeDue > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[#9090a0]">Change Due</span>
                    <span className="text-[#f0f0f5]">{formatCurrency(selectedSale.changeDue)}</span>
                  </div>
                )}
              </div>

              {selectedSale.notes && (
                <div className="border-t border-[#2a2a3a] pt-4">
                  <p className="text-sm text-[#606070]">Notes</p>
                  <p className="text-sm text-[#9090a0]">{selectedSale.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
