"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useTranslation } from "@/contexts/LanguageContext";
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
  UserPlus,
  Check,
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
  const { t } = useTranslation();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState<BranchFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [branchUsers, setBranchUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [assigning, setAssigning] = useState<string | null>(null);

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

  async function openStaffModal(branch: Branch) {
    setSelectedBranch(branch);
    setShowStaffModal(true);
    setUserSearch("");
    try {
      const [usersRes, branchRes] = await Promise.all([
        fetch("/api/users?limit=100"),
        fetch(`/api/branches/${branch.id}`),
      ]);
      if (usersRes.ok) {
        const data = await usersRes.json();
        setAllUsers(
          (data.users || []).map((u: any) => ({
            ...u,
            name: [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email,
          }))
        );
      }
      if (branchRes.ok) {
        const data = await branchRes.json();
        setBranchUsers(
          (data.users || []).map((u: any) => ({
            ...u,
            name: [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email,
          }))
        );
      }
    } catch (error) {
      console.error("Failed to load users:", error);
    }
  }

  async function assignUserToBranch(userId: string, branchId: string) {
    setAssigning(userId);
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, branchId }),
      });
      if (res.ok) {
        const user = allUsers.find((u) => u.id === userId);
        if (user) {
          setBranchUsers((prev) => [...prev, user]);
          setAllUsers((prev) =>
            prev.map((u) =>
              u.id === userId ? { ...u, branchId } : u
            )
          );
        }
        fetchBranches();
      }
    } catch (error) {
      console.error("Failed to assign user:", error);
    } finally {
      setAssigning(null);
    }
  }

  async function removeUserFromBranch(userId: string) {
    setAssigning(userId);
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, branchId: null }),
      });
      if (res.ok) {
        setBranchUsers((prev) => prev.filter((u) => u.id !== userId));
        setAllUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, branchId: null } : u
          )
        );
        fetchBranches();
      }
    } catch (error) {
      console.error("Failed to remove user:", error);
    } finally {
      setAssigning(null);
    }
  }

  const totalRevenue = branches.reduce((sum, b) => sum + b.totalRevenue, 0);
  const totalUsers = branches.reduce((sum, b) => sum + b.userCount, 0);

  return (
    <DashboardLayout role="OWNER" title={t("branchManagement")}>
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
                <p className="text-sm text-[#9090a0]">{t("totalBranches")}</p>
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
                <p className="text-sm text-[#9090a0]">{t("totalStaff")}</p>
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
                <p className="text-sm text-[#9090a0]">{t("totalSales")}</p>
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
                <p className="text-sm text-[#9090a0]">{t("totalRevenue")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:w-72">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white"
            />
            <input
              type="text"
              placeholder={t("searchBranches")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          <button onClick={openAddModal} className="btn btn-primary">
            <Plus size={16} />
            {t("addBranchBtn")}
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
              {t("noBranchesFound")}
            </h3>
            <p className="mt-1 text-sm text-[#9090a0]">
              {search
                ? t("noBranchesMatch")
                : t("getStartedAdding")}
            </p>
            {!search && (
              <button onClick={openAddModal} className="btn btn-primary mt-4">
                <Plus size={16} />
                {t("addBranchBtn")}
              </button>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{t("branchCol")}</th>
                  <th>{t("codeCol")}</th>
                  <th>{t("location")}</th>
                  <th>{t("contactCol")}</th>
                  <th>{t("staffCol")}</th>
                  <th>{t("salesCol")}</th>
                  <th>{t("revenueCol")}</th>
                  <th>{t("statusCol")}</th>
                  <th>{t("actionsCol")}</th>
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
                              {t("defaultBranch")}
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
                        {branch.isActive ? t("activeLabel") : t("inactiveLabel")}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openStaffModal(branch)}
                          className="rounded-lg p-2 text-[#9090a0] hover:bg-[#2a2a3a] hover:text-[#10b981]"
                          title={t("manageStaff")}
                        >
                          <UserPlus size={14} />
                        </button>
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
                {editingBranch ? t("editBranch") : t("addBranchBtn")}
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
                    {t("branchName")}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="input"
                    placeholder={t("branchNamePlaceholder")}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-[#9090a0]">
                    {t("branchCode")}
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
                    placeholder={t("branchCodePlaceholder")}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm text-[#9090a0]">
                  {t("addressLabel")}
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="input"
                  placeholder={t("addressPlaceholder")}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-[#9090a0]">
                    {t("phoneLabel")}
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
                    {t("emailLabel")}
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
                {t("setAsDefault")}
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                >
                  {t("cancelBtn")}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary"
                >
                  {saving
                    ? t("savingLabel")
                    : editingBranch
                    ? t("updateBtn")
                    : t("createBtn")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Assignment Modal */}
      {showStaffModal && selectedBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="glass-card w-full max-w-2xl p-6 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#f0f0f5]">
                  {t("manageStaffTitle")} — {selectedBranch.name}
                </h2>
                <p className="mt-1 text-sm text-[#9090a0]">
                  {t("assignUsersDesc")}
                </p>
              </div>
              <button
                onClick={() => setShowStaffModal(false)}
                className="text-[#606070] hover:text-[#f0f0f5]"
              >
                <X size={20} />
              </button>
            </div>

            {/* Assigned Staff */}
            <div className="mb-4">
              <h3 className="mb-2 text-sm font-medium text-[#9090a0]">
                {t("assignedStaff")} ({branchUsers.length})
              </h3>
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-[#2a2a3a] bg-[#12121a] p-2">
                {branchUsers.length === 0 ? (
                    <p className="p-2 text-sm text-[#606070]">
                    {t("noUsersAssigned")}
                  </p>
                ) : (
                  branchUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between rounded-lg p-2 hover:bg-[#1e1e2a]"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#d4a843] to-[#b8860b] text-xs font-bold text-white">
                          {user.name?.charAt(0) || "?"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#f0f0f5]">
                            {user.name}
                          </p>
                          <p className="text-xs text-[#606070]">{user.email}</p>
                        </div>
                        <span className="badge badge-info text-[10px]">
                          {user.role}
                        </span>
                      </div>
                      <button
                        onClick={() => removeUserFromBranch(user.id)}
                        disabled={assigning === user.id}
                        className="rounded-lg p-1.5 text-[#9090a0] hover:bg-[#2a2a3a] hover:text-[#f43f5e] disabled:opacity-50"
                        title={t("removeFromBranch")}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Assign New Users */}
            <div>
              <h3 className="mb-2 text-sm font-medium text-[#9090a0]">
                {t("assignUsers")}
              </h3>
              <div className="relative mb-2">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white"
                />
                <input
                  type="text"
                  placeholder={t("searchUsersPlaceholder")}
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="input pl-9 text-sm"
                />
              </div>
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-[#2a2a3a] bg-[#12121a] p-2">
                {allUsers
                  .filter(
                    (u) =>
                      !branchUsers.find((bu) => bu.id === u.id) &&
                      (userSearch === "" ||
                        u.name
                          ?.toLowerCase()
                          .includes(userSearch.toLowerCase()) ||
                        u.email
                          ?.toLowerCase()
                          .includes(userSearch.toLowerCase()))
                  )
                  .map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between rounded-lg p-2 hover:bg-[#1e1e2a]"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#3b82f6] to-[#2563eb] text-xs font-bold text-white">
                          {user.name?.charAt(0) || "?"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#f0f0f5]">
                            {user.name}
                          </p>
                          <p className="text-xs text-[#606070]">{user.email}</p>
                        </div>
                        <span className="badge badge-info text-[10px]">
                          {user.role}
                        </span>
                        {user.branchId && user.branchId !== selectedBranch.id && (
                          <span className="text-[10px] text-[#f59e0b]">
                            {t("inAnotherBranch")}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() =>
                          assignUserToBranch(user.id, selectedBranch.id)
                        }
                        disabled={assigning === user.id}
                        className="rounded-lg p-1.5 text-[#9090a0] hover:bg-[#2a2a3a] hover:text-[#10b981] disabled:opacity-50"
                        title={t("assignToBranch")}
                      >
                        <Check size={14} />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
