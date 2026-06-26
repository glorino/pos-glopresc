"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { formatDateTime } from "@/lib/utils";
import {
  FileText,
  Search,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Check,
  X,
} from "lucide-react";

interface StockRequest {
  id: string;
  description: string;
  status: string;
  urgency: string;
  createdAt: string;
  supplier: { id: string; name: string };
}

export default function StockRequestsPage() {
  const [requests, setRequests] = useState<StockRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [userRole, setUserRole] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchUserRole();
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  async function fetchUserRole() {
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const data = await res.json();
        setUserRole(data?.user?.role || "");
      }
    } catch (error) {
      console.error("Failed to fetch user role:", error);
    }
  }

  async function fetchRequests() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/supply-requests?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setRequests(json.supplyRequests ?? json.requests ?? json ?? []);
      }
    } catch (err) {
      console.error("Failed to fetch stock requests:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(id: string, action: "APPROVED" | "REJECTED") {
    setProcessingId(id);
    try {
      const res = await fetch("/api/supply-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: action }),
      });
      if (res.ok) {
        fetchRequests();
      }
    } catch (err) {
      console.error("Failed to update request:", err);
    } finally {
      setProcessingId(null);
    }
  }

  const canApprove = ["PROCUREMENT_MANAGER", "PROCUREMENT_REP"].includes(userRole);

  const statusColors: Record<string, string> = {
    PENDING: "badge-warning",
    APPROVED: "badge-info",
    ORDERED: "badge-purple",
    RECEIVED: "badge-success",
    CANCELLED: "badge-danger",
  };

  const urgencyColors: Record<string, string> = {
    LOW: "badge-info",
    NORMAL: "badge-info",
    HIGH: "badge-warning",
    URGENT: "badge-danger",
  };

  const filtered = requests.filter(
    (r) =>
      search === "" ||
      r.description?.toLowerCase().includes(search.toLowerCase()) ||
      r.supplier?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout role="PROCUREMENT_REP" title="Stock Requests">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606070]" />
            <input type="text" placeholder="Search requests..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
          </div>
          <div className="flex gap-2">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input select w-40">
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="ORDERED">Ordered</option>
              <option value="RECEIVED">Received</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <button onClick={fetchRequests} className="btn btn-secondary btn-sm"><RefreshCw size={14} /></button>
          </div>
        </div>

        {loading ? (
          <div className="flex h-[40vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4a843] border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center p-12">
            <FileText size={48} className="mb-4 text-[#606070]" />
            <h3 className="text-lg font-semibold text-[#f0f0f5]">No stock requests found</h3>
            <p className="mt-1 text-sm text-[#9090a0]">Requests from warehouse will appear here.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Supplier</th>
                  <th>Urgency</th>
                  <th>Status</th>
                  <th>Date</th>
                  {canApprove && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((req) => (
                  <tr key={req.id}>
                    <td className="max-w-xs truncate text-[#f0f0f5]">{req.description || "—"}</td>
                    <td className="text-[#9090a0]">{req.supplier?.name || "—"}</td>
                    <td>
                      <span className={`badge ${urgencyColors[req.urgency] || "badge-info"}`}>{req.urgency}</span>
                    </td>
                    <td>
                      <span className={`badge ${statusColors[req.status] || "badge-info"}`}>{req.status}</span>
                    </td>
                    <td className="text-sm text-[#9090a0]">{formatDateTime(req.createdAt)}</td>
                    {canApprove && (
                      <td>
                        {req.status === "PENDING" ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleAction(req.id, "APPROVED")}
                              disabled={processingId === req.id}
                              className="rounded-lg bg-[#10b981]/20 p-2 text-[#10b981] hover:bg-[#10b981]/30 disabled:opacity-50"
                              title="Approve"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => handleAction(req.id, "REJECTED")}
                              disabled={processingId === req.id}
                              className="rounded-lg bg-[#f43f5e]/20 p-2 text-[#f43f5e] hover:bg-[#f43f5e]/30 disabled:opacity-50"
                              title="Reject"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-[#606070]">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
