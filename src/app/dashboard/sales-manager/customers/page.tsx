"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useTranslation } from "@/contexts/LanguageContext";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  Search,
  Plus,
  Edit2,
  Eye,
  X,
  Users,
  Award,
} from "lucide-react";

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  loyaltyPoints: number;
  totalSpent: number;
  isActive: boolean;
  createdAt: string;
  _count?: { sales: number };
  sales?: {
    id: string;
    invoiceNumber: string;
    total: number;
    status: string;
    createdAt: string;
  }[];
}

interface CustomerFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  notes: string;
}

const emptyForm: CustomerFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  notes: "",
};

export default function SalesCustomersPage() {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  async function fetchCustomers() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("limit", "100");
      const res = await fetch(`/api/customers?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers);
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  function openAddModal() {
    setEditingCustomer(null);
    setFormData(emptyForm);
    setError("");
    setShowModal(true);
  }

  function openEditModal(customer: Customer) {
    setEditingCustomer(customer);
    setFormData({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
      city: customer.city || "",
      state: customer.state || "",
      notes: "",
    });
    setError("");
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const body = editingCustomer
        ? { id: editingCustomer.id, ...formData }
        : formData;
      const res = await fetch("/api/customers", {
        method: editingCustomer ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save customer");
      }
      setShowModal(false);
      fetchCustomers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function viewCustomerDetail(customer: Customer) {
    try {
      const res = await fetch(`/api/customers/${customer.id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedCustomer(data);
      }
    } catch (error) {
      console.error("Failed to fetch customer detail:", error);
    }
  }

  return (
    <DashboardLayout title={t("customers")}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606070]" />
              <input
                type="text"
                placeholder="Search customers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input w-64 pl-10"
              />
            </div>
          </div>
          <button onClick={openAddModal} className="btn btn-primary">
            <Plus size={16} />
            Add Customer
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
                  <th>Customer</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Total Spent</th>
                  <th>Loyalty Points</th>
                  <th>Orders</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td className="font-medium text-[#f0f0f5]">
                      <button
                        onClick={() => viewCustomerDetail(customer)}
                        className="cursor-pointer text-left hover:text-[#d4a843] transition-colors"
                      >
                        {customer.firstName} {customer.lastName}
                      </button>
                    </td>
                    <td className="text-[#9090a0]">{customer.email || "-"}</td>
                    <td className="text-[#9090a0]">{customer.phone || "-"}</td>
                    <td className="font-medium text-[#d4a843]">
                      {formatCurrency(customer.totalSpent)}
                    </td>
                    <td>
                      <span className="flex items-center gap-1 text-[#8b5cf6]">
                        <Award size={12} />
                        {customer.loyaltyPoints.toLocaleString()}
                      </span>
                    </td>
                    <td className="text-[#9090a0]">
                      {("_count" in customer ? (customer as any)._count?.sales : 0) || 0}
                    </td>
                    <td>
                      <span className={`badge ${customer.isActive ? "badge-success" : "badge-danger"}`}>
                        {customer.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(customer)}
                          className="rounded-lg p-2 text-[#9090a0] hover:bg-[#2a2a3a] hover:text-[#3b82f6]"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => viewCustomerDetail(customer)}
                          className="rounded-lg p-2 text-[#9090a0] hover:bg-[#2a2a3a] hover:text-[#d4a843]"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center text-[#606070]">
                      No customers found
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
              <h2 className="text-xl font-semibold text-[#f0f0f5]">
                {editingCustomer ? "Edit Customer" : "Add Customer"}
              </h2>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-[#9090a0]">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-[#9090a0]">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm text-[#9090a0]">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-[#9090a0]">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-[#9090a0]">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-[#9090a0]">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-[#9090a0]">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm text-[#9090a0]">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input min-h-[80px]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? "Saving..." : editingCustomer ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="glass-card w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#f0f0f5]">
                {selectedCustomer.firstName} {selectedCustomer.lastName}
              </h2>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-[#606070] hover:text-[#f0f0f5]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[#606070]">Email</p>
                <p className="text-[#f0f0f5]">{selectedCustomer.email || "-"}</p>
              </div>
              <div>
                <p className="text-[#606070]">Phone</p>
                <p className="text-[#f0f0f5]">{selectedCustomer.phone || "-"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[#606070]">Address</p>
                <p className="text-[#f0f0f5]">
                  {selectedCustomer.address
                    ? `${selectedCustomer.address}${selectedCustomer.city ? ", " + selectedCustomer.city : ""}${selectedCustomer.state ? ", " + selectedCustomer.state : ""}`
                    : "-"}
                </p>
              </div>
            </div>

            <div className="mb-6 grid grid-cols-3 gap-4">
              <div className="rounded-xl border border-[#2a2a3a] bg-[#1c1c28] p-4 text-center">
                <p className="text-2xl font-bold text-[#d4a843]">
                  {formatCurrency(selectedCustomer.totalSpent)}
                </p>
                <p className="mt-1 text-xs text-[#606070]">Total Spent</p>
              </div>
              <div className="rounded-xl border border-[#2a2a3a] bg-[#1c1c28] p-4 text-center">
                <p className="text-2xl font-bold text-[#8b5cf6]">
                  {selectedCustomer.loyaltyPoints?.toLocaleString() ?? 0}
                </p>
                <p className="mt-1 text-xs text-[#606070]">Loyalty Points</p>
              </div>
              <div className="rounded-xl border border-[#2a2a3a] bg-[#1c1c28] p-4 text-center">
                <p className="text-2xl font-bold text-[#3b82f6]">
                  {selectedCustomer._count?.sales ?? 0}
                </p>
                <p className="mt-1 text-xs text-[#606070]">Total Orders</p>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-[#f0f0f5]">
                Recent Transactions
              </h3>
              {selectedCustomer.sales && selectedCustomer.sales.length > 0 ? (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Invoice</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCustomer.sales.map((sale: any) => (
                        <tr key={sale.id}>
                          <td className="font-medium text-[#f0f0f5]">{sale.invoiceNumber}</td>
                          <td className="text-[#9090a0]">{formatDateTime(sale.createdAt)}</td>
                          <td className="font-medium text-[#d4a843]">{formatCurrency(sale.total)}</td>
                          <td>
                            <span
                              className={`badge ${
                                sale.status === "COMPLETED"
                                  ? "badge-success"
                                  : sale.status === "RETURNED"
                                  ? "badge-warning"
                                  : "badge-danger"
                              }`}
                            >
                              {sale.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-sm text-[#606070]">No purchase history</p>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
