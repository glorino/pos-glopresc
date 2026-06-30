"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useTranslation } from "@/contexts/LanguageContext";
import { formatCurrency, formatDate, generateInvoiceNumber } from "@/lib/utils";
import {
  Search,
  Plus,
  Check,
  Send,
  Filter,
  FileText,
  X,
  Truck,
} from "lucide-react";

interface Invoice {
  id: string;
  invoiceNumber: string;
  customer: string;
  customerPhone: string | null;
  amount: number;
  tax: number;
  total: number;
  status: string;
  dueDate: string;
  paidDate: string | null;
  createdAt: string;
}

interface SupplierInvoice {
  id: string;
  orderNumber: string;
  supplierName: string;
  total: number;
  status: string;
  expectedDate: string | null;
  createdAt: string;
}

interface InvoiceFormData {
  customerName: string;
  customerId: string;
  amount: string;
  tax: string;
  dueDate: string;
  description: string;
}

const emptyForm: InvoiceFormData = {
  customerName: "",
  customerId: "",
  amount: "",
  tax: "0",
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0],
  description: "",
};

export default function InvoicesPage() {
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [supplierInvoices, setSupplierInvoices] = useState<SupplierInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [invoiceType, setInvoiceType] = useState<"customer" | "supplier">("customer");
  const [formData, setFormData] = useState<InvoiceFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function fetchInvoices() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      params.set("limit", "100");
      const res = await fetch(`/api/invoices?${params}`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices || []);
      }
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSupplierInvoices() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      params.set("limit", "100");
      const res = await fetch(`/api/purchase-orders?${params}`);
      if (res.ok) {
        const data = await res.json();
        const orders = (data.purchaseOrders || []).map((po: any) => ({
          id: po.id,
          orderNumber: po.orderNumber,
          supplierName: po.supplier.name,
          total: po.total,
          status: po.status,
          expectedDate: po.expectedDate || null,
          createdAt: po.createdAt,
        }));
        setSupplierInvoices(orders);
      }
    } catch (error) {
      console.error("Failed to fetch supplier invoices:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (invoiceType === "customer") {
      fetchInvoices();
    } else {
      fetchSupplierInvoices();
    }
  }, [statusFilter, invoiceType]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const amount = parseFloat(formData.amount);
      const tax = parseFloat(formData.tax);
      const total = amount + tax;
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNumber: generateInvoiceNumber(),
          customerId: formData.customerId || null,
          amount,
          tax,
          total,
          dueDate: formData.dueDate,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create invoice");
      }
      setShowModal(false);
      setFormData(emptyForm);
      fetchInvoices();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function markAsPaid(invoiceId: string) {
    if (!confirm(t("markPaidConfirm"))) return;
    try {
      const res = await fetch("/api/invoices", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: invoiceId,
          status: "PAID",
          paidDate: new Date().toISOString(),
        }),
      });
      if (res.ok) fetchInvoices();
    } catch (error) {
      console.error("Failed to mark as paid:", error);
    }
  }

  async function markSupplierAsPaid(poId: string) {
    if (!confirm(t("markSupplierPaidConfirm"))) return;
    try {
      const res = await fetch("/api/purchase-orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: poId,
          status: "RECEIVED",
        }),
      });
      if (res.ok) fetchSupplierInvoices();
    } catch (error) {
      console.error("Failed to mark supplier invoice as paid:", error);
    }
  }

  async function sendReminder(invoice: Invoice) {
    if (!invoice.customerPhone) {
      setError(`No phone number on file for invoice ${invoice.invoiceNumber}`);
      return;
    }
    try {
      const message = `Reminder: Invoice ${invoice.invoiceNumber} for ₦${invoice.total.toLocaleString()} is pending payment.`;
      const res = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: invoice.customerPhone, message }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage(`Reminder sent to ${invoice.customer}`);
        setTimeout(() => setSuccessMessage(""), 4000);
      } else {
        setError(data.error || "Failed to send reminder SMS");
      }
    } catch (err: any) {
      setError(err.message || "Failed to send reminder SMS");
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "PAID":
        return "badge-success";
      case "PENDING":
        return "badge-warning";
      case "OVERDUE":
        return "badge-danger";
      case "CANCELLED":
        return "badge-danger";
      default:
        return "badge-info";
    }
  }

  return (
    <DashboardLayout title={t("invoices")}>
      <div className="space-y-6">
        {successMessage && (
          <div className="rounded-lg border border-[#10b981]/20 bg-[#10b981]/10 p-3 text-sm text-[#10b981]">
            {successMessage}
          </div>
        )}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-lg border border-[#2a2a3a] bg-[#1c1c28]">
              <button
                onClick={() => setInvoiceType("customer")}
                className={`px-4 py-2 text-sm font-medium rounded-l-lg transition-colors ${
                  invoiceType === "customer"
                    ? "bg-[#d4a843]/20 text-[#d4a843]"
                    : "text-[#9090a0] hover:text-[#f0f0f5]"
                }`}
              >
                {t("customerInvoices")}
              </button>
              <button
                onClick={() => setInvoiceType("supplier")}
                className={`px-4 py-2 text-sm font-medium rounded-r-lg transition-colors ${
                  invoiceType === "supplier"
                    ? "bg-[#d4a843]/20 text-[#d4a843]"
                    : "text-[#9090a0] hover:text-[#f0f0f5]"
                }`}
              >
                {t("supplierInvoices")}
              </button>
            </div>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white" />
              <input
                type="text"
                placeholder={t("searchInvoicesPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (invoiceType === "customer" ? fetchInvoices() : fetchSupplierInvoices())}
                className="input w-64 pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input select w-auto"
            >
              <option value="">{t("allStatus")}</option>
              <option value="PENDING">{t("pendingLabel")}</option>
              <option value="PAID">{t("paidLabel")}</option>
              <option value="OVERDUE">{t("overdueLabel")}</option>
              <option value="CANCELLED">{t("cancelledLabel")}</option>
            </select>
            {invoiceType === "customer" && (
              <>
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
              </>
            )}
          </div>
          {invoiceType === "customer" && (
            <button onClick={() => setShowModal(true)} className="btn btn-primary">
              <Plus size={16} />
              {t("createInvoiceBtn")}
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex h-[40vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4a843] border-t-transparent" />
          </div>
        ) : invoiceType === "customer" ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{t("invoiceNumberTh")}</th>
                  <th>{t("customerCol")}</th>
                  <th>{t("amountCol")}</th>
                  <th>{t("taxLabel")}</th>
                  <th>{t("totalTh")}</th>
                  <th>{t("statusCol")}</th>
                  <th>{t("dueDateCol")}</th>
                  <th>{t("invoiceActions")}</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="font-medium text-[#f0f0f5]">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-[#d4a843]" />
                        {invoice.invoiceNumber}
                      </div>
                    </td>
                    <td className="text-[#9090a0]">{invoice.customer}</td>
                    <td className="text-[#9090a0]">{formatCurrency(invoice.amount)}</td>
                    <td className="text-[#9090a0]">{formatCurrency(invoice.tax)}</td>
                    <td className="font-medium text-[#d4a843]">
                      {formatCurrency(invoice.total)}
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="text-[#9090a0]">{formatDate(invoice.dueDate)}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        {invoice.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => markAsPaid(invoice.id)}
                              className="rounded-lg p-2 text-[#9090a0] hover:bg-[#10b981]/20 hover:text-[#10b981]"
                              title={t("markAsPaid")}
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => sendReminder(invoice)}
                              className="rounded-lg p-2 text-[#9090a0] hover:bg-[#3b82f6]/20 hover:text-[#3b82f6]"
                              title={t("sendReminder")}
                            >
                              <Send size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {invoices.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center text-[#606070]">
                      {t("noInvoicesFound")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{t("poNumberCol")}</th>
                  <th>{t("supplierTh")}</th>
                  <th>{t("totalTh")}</th>
                  <th>{t("statusCol")}</th>
                  <th>{t("expectedDateCol")}</th>
                  <th>{t("invoiceActions")}</th>
                </tr>
              </thead>
              <tbody>
                {supplierInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="font-medium text-[#f0f0f5]">
                      <div className="flex items-center gap-2">
                        <Truck size={14} className="text-[#d4a843]" />
                        {inv.orderNumber}
                      </div>
                    </td>
                    <td className="text-[#9090a0]">{inv.supplierName}</td>
                    <td className="font-medium text-[#d4a843]">
                      {formatCurrency(inv.total)}
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(inv.status)}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="text-[#9090a0]">
                      {inv.expectedDate ? formatDate(inv.expectedDate) : "—"}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        {inv.status === "PENDING" && (
                          <button
                            onClick={() => markSupplierAsPaid(inv.id)}
                            className="rounded-lg p-2 text-[#9090a0] hover:bg-[#10b981]/20 hover:text-[#10b981]"
                            title={t("markAsReceived")}
                          >
                            <Check size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {supplierInvoices.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-[#606070]">
                      {t("noSupplierInvoices")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="glass-card w-full max-w-lg p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#f0f0f5]">{t("createInvoiceBtn")}</h2>
              <button onClick={() => setShowModal(false)} className="text-[#606070] hover:text-[#f0f0f5]">
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-[#f43f5e]/20 bg-[#f43f5e]/10 p-3 text-sm text-[#f43f5e]">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-[#9090a0]">{t("customerNameLabel")}</label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="input"
                  placeholder={t("customerNamePlaceholder")}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-[#9090a0]">{t("amountNaira")}</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-[#9090a0]">{t("taxLabel")}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.tax}
                    onChange={(e) => setFormData({ ...formData, tax: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-[#9090a0]">{t("dueDateCol")}</label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-[#9090a0]">{t("descriptionLabelInv")}</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input"
                    placeholder={t("descriptionPlaceholderInv")}
                  />
                </div>
              </div>

              {formData.amount && (
                <div className="rounded-xl border border-[#2a2a3a] bg-[#1c1c28] p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#9090a0]">{t("amountCol")}</span>
                    <span className="text-[#f0f0f5]">
                      {formatCurrency(parseFloat(formData.amount) || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#9090a0]">{t("taxLabel")}</span>
                    <span className="text-[#f0f0f5]">
                      {formatCurrency(parseFloat(formData.tax) || 0)}
                    </span>
                  </div>
                  <div className="mt-2 flex justify-between border-t border-[#2a2a3a] pt-2">
                    <span className="font-semibold text-[#f0f0f5]">{t("totalLabel")}</span>
                    <span className="font-semibold text-[#d4a843]">
                      {formatCurrency(
                        (parseFloat(formData.amount) || 0) + (parseFloat(formData.tax) || 0)
                      )}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  {t("cancelBtn")}
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? t("creatingLabelBtn") : t("createInvoiceBtn")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
