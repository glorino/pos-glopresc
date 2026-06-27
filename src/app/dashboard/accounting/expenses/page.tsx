"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useTranslation } from "@/contexts/LanguageContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Search,
  Plus,
  Check,
  X,
  XCircle,
  Filter,
  Receipt,
  Upload,
} from "lucide-react";

interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  status: string;
  receipt: string | null;
  notes: string | null;
  category: { id: string; name: string };
  user: { firstName: string; lastName: string };
  createdAt: string;
}

interface ExpenseCategory {
  id: string;
  name: string;
}

interface ExpenseFormData {
  categoryId: string;
  description: string;
  amount: string;
  date: string;
  receipt: string;
  notes: string;
}

const emptyForm: ExpenseFormData = {
  categoryId: "",
  description: "",
  amount: "",
  date: new Date().toISOString().split("T")[0],
  receipt: "",
  notes: "",
};

export default function ExpenseManagementPage() {
  const { t } = useTranslation();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<ExpenseFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function fetchExpenses() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (categoryFilter) params.set("categoryId", categoryFilter);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      params.set("limit", "100");
      const res = await fetch(`/api/expenses?${params}`);
      if (res.ok) {
        const data = await res.json();
        setExpenses(data.expenses);
      }
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      const res = await fetch("/api/expenses/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      // Fallback: use static categories
      setCategories([
        { id: "1", name: "Utilities" },
        { id: "2", name: "Rent" },
        { id: "3", name: "Supplies" },
        { id: "4", name: "Transport" },
        { id: "5", name: "Maintenance" },
        { id: "6", name: "Other" },
      ]);
    }
  }

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, [statusFilter, categoryFilter]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: formData.categoryId,
          description: formData.description,
          amount: parseFloat(formData.amount),
          date: formData.date,
          receipt: formData.receipt || null,
          notes: formData.notes || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create expense");
      }
      setShowModal(false);
      setFormData(emptyForm);
      fetchExpenses();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleApproval(expenseId: string, status: "APPROVED" | "REJECTED") {
    try {
      const res = await fetch(`/api/expenses/${expenseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) fetchExpenses();
    } catch (error) {
      console.error("Failed to update expense:", error);
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "APPROVED":
      case "PAID":
        return "badge-success";
      case "PENDING":
        return "badge-warning";
      case "REJECTED":
        return "badge-danger";
      default:
        return "badge-info";
    }
  }

  return (
    <DashboardLayout role="ACCOUNTANT" title={t("expenses")}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white" />
              <input
                type="text"
                placeholder={t("searchExpenses")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchExpenses()}
                className="input w-64 pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input select w-auto"
            >
              <option value="">{t("allStatusFilter")}</option>
              <option value="PENDING">{t("pendingLabel")}</option>
              <option value="APPROVED">{t("approvedLabel")}</option>
              <option value="REJECTED">{t("rejectedLabel")}</option>
              <option value="PAID">{t("paidLabelFilter")}</option>
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
            {t("addExpenseBtn")}
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
                  <th>{t("dateColExp")}</th>
                  <th>{t("categoryColExp")}</th>
                  <th>{t("descriptionColExp")}</th>
                  <th>{t("amountCol")}</th>
                  <th>{t("statusColExp")}</th>
                  <th>{t("submittedByCol")}</th>
                  <th>{t("actionsCol")}</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="text-[#9090a0]">{formatDate(expense.date)}</td>
                    <td>
                      <span className="badge badge-info">{expense.category.name}</span>
                    </td>
                    <td className="max-w-[250px] truncate font-medium text-[#f0f0f5]">
                      {expense.description}
                    </td>
                    <td className="font-medium text-[#d4a843]">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(expense.status)}`}>
                        {expense.status}
                      </span>
                    </td>
                    <td className="text-[#9090a0]">
                      {expense.user.firstName} {expense.user.lastName}
                    </td>
                    <td>
                      {expense.status === "PENDING" && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleApproval(expense.id, "APPROVED")}
                            className="rounded-lg p-2 text-[#9090a0] hover:bg-[#10b981]/20 hover:text-[#10b981]"
                            title="Approve"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => handleApproval(expense.id, "REJECTED")}
                            className="rounded-lg p-2 text-[#9090a0] hover:bg-[#f43f5e]/20 hover:text-[#f43f5e]"
                            title="Reject"
                          >
                            <XCircle size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-[#606070]">
                      {t("noExpensesFound")}
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
              <h2 className="text-xl font-semibold text-[#f0f0f5]">{t("addExpenseTitle")}</h2>
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
                <label className="mb-1 block text-sm text-[#9090a0]">{t("categoryLabel")}</label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="input select"
                >
                  <option value="">{t("selectCategory")}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm text-[#9090a0]">{t("descriptionLabelExp")}</label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  placeholder={t("descriptionPlaceholderExp")}
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
                  <label className="mb-1 block text-sm text-[#9090a0]">{t("dateLabel")}</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm text-[#9090a0]">{t("receiptLabel")}</label>
                <button type="button" className="btn btn-secondary btn-sm">
                  <Upload size={14} />
                  {t("uploadReceipt")}
                </button>
              </div>

              <div>
                <label className="mb-1 block text-sm text-[#9090a0]">{t("notesLabel")}</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input min-h-[80px]"
                  placeholder={t("notesPlaceholder")}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  {t("cancelBtn")}
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? t("savingText") : t("createExpenseBtn")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
