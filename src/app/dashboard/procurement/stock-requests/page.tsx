"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { formatDateTime } from "@/lib/utils";
import { useTranslation } from "@/contexts/LanguageContext";
import {
  FileText, Search, RefreshCw, Clock, CheckCircle, XCircle,
  AlertTriangle, Check, X, Plus, Send,
} from "lucide-react";

interface Supplier {
  id: string;
  name: string;
}

interface StockRequest {
  id: string;
  description: string;
  status: string;
  urgency: string;
  createdAt: string;
  supplier: { id: string; name: string };
}

export default function StockRequestsPage() {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<StockRequest[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [userRole, setUserRole] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ supplierId: "", description: "", urgency: "NORMAL", expectedDate: "" });

  const canCreate = ["WAREHOUSE_REP", "WAREHOUSE_MANAGER", "PROCUREMENT_REP", "PROCUREMENT_MANAGER"].includes(userRole);
  const canApprove = ["PROCUREMENT_MANAGER", "PROCUREMENT_REP"].includes(userRole);

  useEffect(() => {
    fetch("/api/auth/session").then(r => r.json()).then(d => setUserRole(d?.user?.role || ""));
    fetch("/api/suppliers").then(r => r.json()).then(d => {
      const list = d.suppliers || d || [];
      setSuppliers(Array.isArray(list) ? list : []);
    }).catch(() => {});
  }, []);

  useEffect(() => { fetchRequests(); }, [statusFilter]);

  async function fetchRequests() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/supply-requests?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setRequests(json.supplyRequests ?? json.requests ?? json ?? []);
      }
    } catch (err) { console.error("Failed to fetch stock requests:", err); }
    finally { setLoading(false); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.supplierId || !form.description) return;
    setCreating(true);
    try {
      const res = await fetch("/api/supply-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowCreate(false);
        setForm({ supplierId: "", description: "", urgency: "NORMAL", expectedDate: "" });
        fetchRequests();
      }
    } finally { setCreating(false); }
  }

  async function handleAction(id: string, action: "APPROVED" | "REJECTED") {
    setProcessingId(id);
    try {
      const res = await fetch("/api/supply-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: action }),
      });
      if (res.ok) fetchRequests();
    } finally { setProcessingId(null); }
  }

  const statusColors: Record<string, string> = {
    PENDING: "badge-warning", APPROVED: "badge-info", ORDERED: "badge-purple",
    RECEIVED: "badge-success", CANCELLED: "badge-danger",
  };
  const urgencyColors: Record<string, string> = {
    LOW: "badge-info", NORMAL: "badge-info", HIGH: "badge-warning", URGENT: "badge-danger",
  };

  const filtered = requests.filter((r) =>
    search === "" || r.description?.toLowerCase().includes(search.toLowerCase()) ||
    r.supplier?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout title={t("stockRequestsTitle")}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606070]" />
            <input type="text" placeholder={t("searchRequests")} value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
          </div>
          <div className="flex gap-2">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input select w-full max-w-[10rem]">
              <option value="">{t("allStatus")}</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="ORDERED">Ordered</option>
              <option value="RECEIVED">Received</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <button onClick={fetchRequests} className="btn btn-secondary btn-sm"><RefreshCw size={14} /></button>
            {canCreate && (
              <button onClick={() => setShowCreate(true)} className="btn btn-primary btn-sm"><Plus size={14} /> New Request</button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex h-[40vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4a843] border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center p-12">
            <FileText size={48} className="mb-4 text-[#606070]" />
            <h3 className="text-lg font-semibold text-[#f0f0f5]">{t("noStockRequestsFound")}</h3>
            <p className="mt-1 text-sm text-[#9090a0]">{t("requestsWillAppear")}</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{t("descriptionCol")}</th>
                  <th>{t("supplierCol")}</th>
                  <th>{t("urgencyCol")}</th>
                  <th>{t("statusCol")}</th>
                  <th>{t("dateCol")}</th>
                  {canApprove && <th>{t("actionsCol")}</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((req) => (
                  <tr key={req.id}>
                    <td className="max-w-xs truncate text-[#f0f0f5]">{req.description || "—"}</td>
                    <td className="text-[#9090a0]">{req.supplier?.name || "—"}</td>
                    <td><span className={`badge ${urgencyColors[req.urgency] || "badge-info"}`}>{req.urgency}</span></td>
                    <td><span className={`badge ${statusColors[req.status] || "badge-info"}`}>{req.status}</span></td>
                    <td className="text-sm text-[#9090a0]">{formatDateTime(req.createdAt)}</td>
                    {canApprove && (
                      <td>
                        {req.status === "PENDING" ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleAction(req.id, "APPROVED")} disabled={processingId === req.id}
                              className="rounded-lg bg-[#10b981]/20 p-2 text-[#10b981] hover:bg-[#10b981]/30 disabled:opacity-50" title="Approve">
                              <Check size={14} />
                            </button>
                            <button onClick={() => handleAction(req.id, "REJECTED")} disabled={processingId === req.id}
                              className="rounded-lg bg-[#f43f5e]/20 p-2 text-[#f43f5e] hover:bg-[#f43f5e]/30 disabled:opacity-50" title="Reject">
                              <X size={14} />
                            </button>
                          </div>
                        ) : <span className="text-xs text-[#606070]">—</span>}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showCreate && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
            <div className="glass-card w-full max-w-md p-6">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[#f0f0f5]">New Stock Request</h2>
                <button onClick={() => setShowCreate(false)} className="text-[#606070] hover:text-[#f0f0f5]"><X size={20} /></button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm text-[#9090a0]">Supplier *</label>
                  <select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} className="input w-full" required>
                    <option value="">Select supplier</option>
                    {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-[#9090a0]">Description *</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="input w-full" rows={3} placeholder="What products/quantities are needed?" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm text-[#9090a0]">Urgency</label>
                    <select value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })} className="input w-full">
                      <option value="LOW">Low</option>
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-[#9090a0]">Expected Date</label>
                    <input type="date" value={form.expectedDate} onChange={(e) => setForm({ ...form, expectedDate: e.target.value })} className="input w-full" />
                  </div>
                </div>
                <button type="submit" disabled={creating || !form.supplierId || !form.description} className="btn btn-primary w-full">
                  <Send size={14} className="mr-1" />
                  {creating ? "Submitting..." : "Submit Request"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
