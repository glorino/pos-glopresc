"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  Building2,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  MapPin,
  Phone,
  Mail,
  Users,
  Package,
  ShoppingCart,
  Star,
} from "lucide-react";

interface Branch {
  id: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  userCount: number;
  productCount: number;
  saleCount: number;
  expenseCount: number;
  totalRevenue: number;
}

interface BranchFormData {
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  isDefault: boolean;
}

const emptyForm: BranchFormData = {
  name: "",
  code: "",
  address: "",
  phone: "",
  email: "",
  isDefault: false,
};

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState<BranchFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  async function fetchBranches() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/branches?${params}`);
      if (res.ok) {
        const data = await res.json();
        setBranches(data.branches);
      }
    } catch (error) {
      console.error("Failed to fetch branches:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBranches();
  }, [search]);

  function openAddModal() {
    setEditingBranch(null);
    setFormData(emptyForm);
    setError("");
    setShowModal(true);
  }

  function openEditModal(branch: Branch) {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      code: branch.code,
      address: branch.address || "",
      phone: branch.phone || "",
      email: branch.email || "",
      isDefault: branch.isDefault,
    });
    setError("");
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (editingBranch) {
        const res = await fetch(`/api/branches/${editingBranch.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            code: formData.code,
            address: formData.address || null,
            phone: formData.phone || null,
            email: formData.email || null,
            isDefault: formData.isDefault,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to update branch");
        }
      } else {
        const res = await fetch("/api/branches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            code: formData.code,
            address: formData.address || null,
            phone: formData.phone || null,
            email: formData.email || null,
            isDefault: formData.isDefault,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to create branch");
        }
      }
      setShowModal(false);
      fetchBranches();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(branch: Branch) {
    if (
      !confirm(
        `Are you sure you want to delete "${branch.name}"? This action cannot be undone.`
      )
    )
      return;
    setDeleting(branch.id);
    try {
      const res = await fetch(`/api/branches/${branch.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to delete branch");
        return;
      }
      fetchBranches();
    } catch (error) {
      console.error("Failed to delete branch:", error);
    } finally {
      setDeleting(null);
    }
  }

  const totalRevenue = branches.reduce((sum, b) => sum + b.totalRevenue, 0);
  const totalUsers = branches.reduce((sum, b) => sum + b.userCount, 0);

  return (
    <DashboardLayout role="OWNER" title="Branch Management">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="glass-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4a843] to-[#b8942f]">
                <Building2 size={18} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#f0f0f5]">
                  {branches.length}
                </p>
                <p className="text-sm text-[#9090a0]">Total Branches</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#10b981] to-[#059669]">
                <Users size={18} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#f0f0f5]">
                  {totalUsers}
                </p>
                <p className="text-sm text-[#9090a0]">Total Staff</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#2563eb]">
                <ShoppingCart size={18} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#f0f0f5]">
                  {branches.reduce((sum, b) => sum + b.saleCount, 0)}
                </p>
                <p className="text-sm text-[#9090a0]">Total Sales</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed]">
                <Package size={18} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#f0f0f5]">
                  {formatCurrency(totalRevenue)}
                </p>
                <p className="text-sm text-[#9090a0]">Total Revenue</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:w-72">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606070]"
            />
            <input
              type="text"
              placeholder="Search branches..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          <button onClick={openAddModal} className="btn btn-primary">
            <Plus size={16} />
            Add Branch
          </button>
        </div>

        {/* Branches Table */}
        {loading ? (
          <div className="flex h-[40vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4a843] border-t-transparent" />
          </div>
        ) : branches.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center p-12">
            <Building2 size={48} className="mb-4 text-[#606070]" />
            <h3 className="text-lg font-semibold text-[#f0f0f5]">
              No branches found
            </h3>
            <p className="mt-1 text-sm text-[#9090a0]">
              {search
                ? "No branches match your search criteria."
                : "Get started by adding your first branch."}
            </p>
            {!search && (
              <button onClick={openAddModal} className="btn btn-primary mt-4">
                <Plus size={16} />
                Add Branch
              </button>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Branch</th>
                  <th>Code</th>
                  <th>Location</th>
                  <th>Contact</th>
                  <th>Staff</th>
                  <th>Sales</th>
                  <th>Revenue</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((branch) => (
                  <tr key={branch.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#d4a843]/20 to-[#d4a843]/5">
                          <Building2 size={14} className="text-[#d4a843]" />
                        </div>
                        <div>
                          <p className="font-medium text-[#f0f0f5]">
                            {branch.name}
                          </p>
                          {branch.isDefault && (
                            <span className="inline-flex items-center gap-1 text-xs text-[#d4a843]">
                              <Star size={10} />
                              Default
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-sm text-[#9090a0]">
                      {branch.code}
                    </td>
                    <td>
                      {branch.address ? (
                        <div className="flex items-center gap-1 text-sm text-[#9090a0]">
                          <MapPin size={12} />
                          {branch.address}
                        </div>
                      ) : (
                        <span className="text-sm text-[#606070]">-</span>
                      )}
                    </td>
                    <td>
                      <div className="space-y-0.5">
                        {branch.phone && (
                          <div className="flex items-center gap-1 text-xs text-[#9090a0]">
                            <Phone size={10} />
                            {branch.phone}
                          </div>
                        )}
                        {branch.email && (
                          <div className="flex items-center gap-1 text-xs text-[#9090a0]">
                            <Mail size={10} />
                            {branch.email}
                          </div>
                        )}
                        {!branch.phone && !branch.email && (
                          <span className="text-sm text-[#606070]">-</span>
                        )}
                      </div>
                    </td>
                    <td className="text-sm text-[#9090a0]">
                      {branch.userCount}
                    </td>
                    <td className="text-sm text-[#9090a0]">
                      {branch.saleCount}
                    </td>
                    <td className="font-medium text-[#d4a843]">
                      {formatCurrency(branch.totalRevenue)}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          branch.isActive ? "badge-success" : "badge-danger"
                        }`}
                      >
                        {branch.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(branch)}
                          className="rounded-lg p-2 text-[#9090a0] hover:bg-[#2a2a3a] hover:text-[#3b82f6]"
                        >
                          <Edit2 size={14} />
                        </button>
                        {!branch.isDefault && (
                          <button
                            onClick={() => handleDelete(branch)}
                            disabled={deleting === branch.id}
                            className="rounded-lg p-2 text-[#9090a0] hover:bg-[#2a2a3a] hover:text-[#f43f5e] disabled:opacity-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="glass-card w-full max-w-lg p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#f0f0f5]">
                {editingBranch ? "Edit Branch" : "Add Branch"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#606070] hover:text-[#f0f0f5]"
              >
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
                  <label className="mb-1 block text-sm text-[#9090a0]">
                    Branch Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="input"
                    placeholder="e.g. Main Branch"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-[#9090a0]">
                    Branch Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    className="input"
                    placeholder="e.g. MB001"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm text-[#9090a0]">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="input"
                  placeholder="Street address, city, state"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-[#9090a0]">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="input"
                    placeholder="+234..."
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-[#9090a0]">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="input"
                    placeholder="branch@example.com"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-[#9090a0]">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) =>
                    setFormData({ ...formData, isDefault: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-[#2a2a3a] bg-[#16161f] text-[#d4a843] focus:ring-[#d4a843]"
                />
                Set as default branch
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary"
                >
                  {saving
                    ? "Saving..."
                    : editingBranch
                    ? "Update"
                    : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
