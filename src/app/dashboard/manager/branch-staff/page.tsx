"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Users, Mail, Phone, Shield, Search, X, UserCheck, UserX } from "lucide-react";

interface BranchUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export default function ManagerBranchStaffPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<BranchUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<BranchUser | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/manager?view=staff");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Failed to fetch staff:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive(user: BranchUser) {
    const newActive = !user.isActive;
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, isActive: newActive }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, isActive: newActive } : u))
        );
      }
    } catch (error) {
      console.error("Failed to update user status:", error);
    }
  }

  const filtered = users.filter((u) => {
    const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
    return (
      search === "" ||
      fullName.includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
    );
  });

  const roleColors: Record<string, string> = {
    WAREHOUSE_MANAGER: "badge-warning",
    WAREHOUSE_REP: "badge-info",
    PROCUREMENT_MANAGER: "badge-warning",
    PROCUREMENT_REP: "badge-info",
    SALES_MANAGER: "badge-success",
    SALES_REP: "badge-info",
    ACCOUNTANT: "badge-success",
    CUSTOMER: "badge-info",
  };

  return (
    <DashboardLayout title="Branch Staff">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="glass-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4a843] to-[#b8860b]">
                <Users size={18} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#f0f0f5]">{users.length}</p>
                <p className="text-sm text-[#9090a0]">Total Staff</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#10b981] to-[#059669]">
                <UserCheck size={18} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#f0f0f5]">
                  {users.filter((u) => u.isActive).length}
                </p>
                <p className="text-sm text-[#9090a0]">Active</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#f43f5e] to-[#e11d48]">
                <UserX size={18} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#f0f0f5]">
                  {users.filter((u) => !u.isActive).length}
                </p>
                <p className="text-sm text-[#9090a0]">Inactive</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606070]" />
          <input
            type="text"
            placeholder="Search staff by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>

        {loading ? (
          <div className="flex h-[40vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4a843] border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center p-12">
            <Users size={48} className="mb-4 text-[#606070]" />
            <h3 className="text-lg font-semibold text-[#f0f0f5]">No staff found</h3>
            <p className="mt-1 text-sm text-[#9090a0]">
              {search ? "No staff match your search criteria." : "No staff assigned to your branch yet."}
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#d4a843]/20 to-[#d4a843]/5 text-sm font-bold text-[#d4a843]">
                          {user.firstName?.charAt(0) || "?"}
                        </div>
                        <p className="font-medium text-[#f0f0f5]">
                          {user.firstName} {user.lastName}
                        </p>
                      </div>
                    </td>
                    <td className="text-sm text-[#9090a0]">{user.email}</td>
                    <td className="text-sm text-[#9090a0]">{user.phone || "-"}</td>
                    <td>
                      <span className={`badge ${roleColors[user.role] || "badge-info"}`}>
                        {user.role.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleActive(user)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          user.isActive ? "bg-[#10b981]" : "bg-[#3a3a4a]"
                        }`}
                        title={user.isActive ? "Deactivate user" : "Activate user"}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            user.isActive ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </td>
                    <td className="text-sm text-[#9090a0]">
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td>
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="rounded-lg p-2 text-[#9090a0] hover:bg-[#2a2a3a] hover:text-[#3b82f6]"
                      >
                        <Shield size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="glass-card w-full max-w-md p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#f0f0f5]">Staff Details</h2>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-[#606070] hover:text-[#f0f0f5]"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d4a843] to-[#b8860b] text-2xl font-bold text-white">
                  {selectedUser.firstName?.charAt(0) || "?"}
                </div>
                <div>
                  <p className="text-lg font-semibold text-[#f0f0f5]">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </p>
                  <p className="text-sm text-[#9090a0]">{selectedUser.role.replace(/_/g, " ")}</p>
                </div>
              </div>
              <div className="space-y-2 rounded-lg border border-[#2a2a3a] bg-[#12121a] p-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail size={14} className="text-[#606070]" />
                  <span className="text-[#9090a0]">{selectedUser.email}</span>
                </div>
                {selectedUser.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone size={14} className="text-[#606070]" />
                    <span className="text-[#9090a0]">{selectedUser.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Shield size={14} className="text-[#606070]" />
                  <span className={`badge ${selectedUser.isActive ? "badge-success" : "badge-danger"}`}>
                    {selectedUser.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="text-sm text-[#606070]">
                  Joined: {new Date(selectedUser.createdAt).toLocaleDateString()}
                </div>
                {selectedUser.lastLoginAt && (
                  <div className="text-sm text-[#606070]">
                    Last Login: {new Date(selectedUser.lastLoginAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
