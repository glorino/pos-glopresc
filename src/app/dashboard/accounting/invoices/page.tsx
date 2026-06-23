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
} from "lucide-react";

interface Invoice {
  id: string;
  invoiceNumber: string;
  customer: string;
  amount: number;
  tax: number;
  total: number;
  status: string;
  dueDate: string;
  paidDate: string | null;
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
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<InvoiceFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

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
    if (!confirm("Mark this invoice as paid?")) return;
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

  function sendReminder(invoice: Invoice) {
    alert(`Reminder sent for invoice ${invoice.invoiceNumber}`);
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
    <DashboardLayout role="ACCOUNTANT" title={t("invoices")}>
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
                onKeyDown={(e) => e.key === "Enter" && fetchInvoices()}
                className="input w-64 pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input select w-auto"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
              <option value="CANCELLED">Cancelled</option>
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
          </div>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <Plus size={16} />
            Create Invoice
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
                  <th>Amount</th>
                  <th>Tax</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th>Actions</th>
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
                              title="Mark as Paid"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => sendReminder(invoice)}
                              className="rounded-lg p-2 text-[#9090a0] hover:bg-[#3b82f6]/20 hover:text-[#3b82f6]"
                              title="Send Reminder"
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
                      No invoices found
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
              <h2 className="text-xl font-semibold text-[#f0f0f5]">Create Invoice</h2>
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
                <label className="mb-1 block text-sm text-[#9090a0]">Customer Name</label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="input"
                  placeholder="Enter customer name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-[#9090a0]">Amount (₦)</label>
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
                  <label className="mb-1 block text-sm text-[#9090a0]">Tax (₦)</label>
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
                  <label className="mb-1 block text-sm text-[#9090a0]">Due Date</label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-[#9090a0]">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input"
                    placeholder="Invoice description"
                  />
                </div>
              </div>

              {formData.amount && (
                <div className="rounded-xl border border-[#2a2a3a] bg-[#1c1c28] p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#9090a0]">Amount</span>
                    <span className="text-[#f0f0f5]">
                      {formatCurrency(parseFloat(formData.amount) || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#9090a0]">Tax</span>
                    <span className="text-[#f0f0f5]">
                      {formatCurrency(parseFloat(formData.tax) || 0)}
                    </span>
                  </div>
                  <div className="mt-2 flex justify-between border-t border-[#2a2a3a] pt-2">
                    <span className="font-semibold text-[#f0f0f5]">Total</span>
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
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? "Creating..." : "Create Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
