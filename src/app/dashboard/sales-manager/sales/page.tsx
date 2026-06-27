"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { useTranslation } from "@/contexts/LanguageContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Search,
  Eye,
  RotateCcw,
  Download,
  X,
  ShoppingCart,
  Filter,
  ChevronDown,
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
  const { t } = useTranslation();
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
  const [showExportMenu, setShowExportMenu] = useState(false);

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

  const headers = [t("invoiceNumberCol"), t("customerCol"), t("itemsCol"), t("totalLabel"), t("paymentCol"), t("statusCol"), t("dateCol")];

  const getExportRows = () =>
    sales.map((s) => [
      s.invoiceNumber,
      s.customer,
      String(s.items.length),
      `₦${s.total.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`,
      s.paymentMethod,
      s.status,
      s.createdAt,
    ]);

  const handleExportCSV = () => {
    const csv = [headers.join(","), ...getExportRows().map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(t("salesReport"), 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
    autoTable(doc, {
      startY: 35,
      head: [headers],
      body: getExportRows(),
      theme: "grid",
      headStyles: { fillColor: [212, 168, 67] },
    });
    doc.save(`sales-${new Date().toISOString().split("T")[0]}.pdf`);
    setShowExportMenu(false);
  };

  async function handleReturn(sale: Sale) {
    if (!confirm(`${t("processReturn")} ${sale.invoiceNumber}?`)) return;
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
    <DashboardLayout role="SALES_MANAGER" title={t("salesManagement")}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606070]" />
              <input
                type="text"
                placeholder={t("searchInvoices")}
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
              <option value="">{t("allStatus")}</option>
              <option value="COMPLETED">{t("completedLabel")}</option>
              <option value="PENDING">{t("pendingLabel")}</option>
              <option value="RETURNED">{t("returnedLabel")}</option>
              <option value="CANCELLED">{t("cancelledLabel")}</option>
            </select>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="input select w-auto"
            >
              <option value="">{t("allPayments")}</option>
              <option value="CASH">{t("cash")}</option>
              <option value="CARD">{t("card")}</option>
              <option value="TRANSFER">{t("transfer")}</option>
              <option value="USSD">{t("ussd")}</option>
              <option value="MOBILE">{t("mobile")}</option>
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
          <div className="relative">
            <button onClick={() => setShowExportMenu(!showExportMenu)} className="btn btn-secondary">
              <Download size={16} />
              {t("export")}
              <ChevronDown size={14} />
            </button>
            {showExportMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                <div className="absolute right-0 z-50 mt-2 w-44 rounded-xl border border-[#2a2a3a] bg-[#1c1c28] py-1 shadow-lg">
                  <button onClick={handleExportCSV} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[#f0f0f5] hover:bg-[#2a2a3a]">
                    {t("exportCSV")}
                  </button>
                  <button onClick={handleExportPDF} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[#f0f0f5] hover:bg-[#2a2a3a]">
                    {t("exportPDF")}
                  </button>
                </div>
              </>
            )}
          </div>
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
                  <th>{t("invoiceNumberCol")}</th>
                  <th>{t("customerCol")}</th>
                  <th>{t("itemsCol")}</th>
                  <th>{t("totalLabel")}</th>
                  <th>{t("paymentCol")}</th>
                  <th>{t("statusCol")}</th>
                  <th>{t("dateCol")}</th>
                  <th>{t("actionsCol")}</th>
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
                          title={t("viewDetails")}
                        >
                          <Eye size={14} />
                        </button>
                        {sale.status === "COMPLETED" && (
                          <button
                            onClick={() => handleReturn(sale)}
                            className="rounded-lg p-2 text-[#9090a0] hover:bg-[#2a2a3a] hover:text-[#f59e0b]"
                            title={t("processReturn")}
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
                      {t("noSalesFound")}
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
                {t("saleNumber")}{selectedSale.invoiceNumber}
              </h2>
              <button onClick={() => setSelectedSale(null)} className="text-[#606070] hover:text-[#f0f0f5]">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[#606070]">{t("customerCol")}</p>
                  <p className="font-medium text-[#f0f0f5]">{selectedSale.customer}</p>
                </div>
                <div>
                  <p className="text-[#606070]">{t("cashierCol")}</p>
                  <p className="font-medium text-[#f0f0f5]">{selectedSale.cashier}</p>
                </div>
                <div>
                  <p className="text-[#606070]">{t("dateCol")}</p>
                  <p className="font-medium text-[#f0f0f5]">
                    {formatDateTime(selectedSale.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-[#606070]">{t("paymentCol")}</p>
                  <span className="badge badge-info">{selectedSale.paymentMethod}</span>
                </div>
              </div>

              <div className="border-t border-[#2a2a3a] pt-4">
                <h4 className="mb-3 text-sm font-semibold text-[#f0f0f5]">{t("itemsCol")}</h4>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>{t("productCol")}</th>
                        <th>{t("qtyCol")}</th>
                        <th>{t("priceCol")}</th>
                        <th>{t("totalLabel")}</th>
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
                  <span className="text-[#9090a0]">{t("subtotalLabel")}</span>
                  <span className="text-[#f0f0f5]">{formatCurrency(selectedSale.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9090a0]">{t("discountLabel")}</span>
                  <span className="text-[#f43f5e]">-{formatCurrency(selectedSale.discount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9090a0]">{t("taxLabel")}</span>
                  <span className="text-[#f0f0f5]">{formatCurrency(selectedSale.tax)}</span>
                </div>
                <div className="flex justify-between border-t border-[#2a2a3a] pt-2">
                  <span className="font-semibold text-[#f0f0f5]">{t("totalLabel")}</span>
                  <span className="font-semibold text-[#d4a843]">
                    {formatCurrency(selectedSale.total)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9090a0]">{t("amountPaidCol")}</span>
                  <span className="text-[#10b981]">{formatCurrency(selectedSale.amountPaid)}</span>
                </div>
                {selectedSale.changeDue > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[#9090a0]">{t("changeDueCol")}</span>
                    <span className="text-[#f0f0f5]">{formatCurrency(selectedSale.changeDue)}</span>
                  </div>
                )}
              </div>

              {selectedSale.notes && (
                <div className="border-t border-[#2a2a3a] pt-4">
                  <p className="text-sm text-[#606070]">{t("notesLabel")}</p>
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
