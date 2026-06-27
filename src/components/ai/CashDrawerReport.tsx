"use client";

import { useState, useEffect } from "react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, MessageSquare } from "lucide-react";

interface DrawerEntry {
  id: string;
  userId: string;
  cashier: string;
  role: string;
  openingBalance: number;
  closingBalance: number | null;
  actualBalance: number | null;
  difference: number | null;
  notes: string | null;
  openedAt: string;
  closedAt: string | null;
  overage: number;
  shortage: number;
}

interface UserSummary {
  userId: string;
  cashier: string;
  role: string;
  sessions: number;
  totalOverage: number;
  totalShortage: number;
  netDifference: number;
  avgDifference: number;
}

export default function CashDrawerReport() {
  const [drawers, setDrawers] = useState<DrawerEntry[]>([]);
  const [usersSummary, setUsersSummary] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const [activeTab, setActiveTab] = useState<"summary" | "detail">("summary");
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  useEffect(() => {
    fetchReports();
  }, [selectedUser, dateRange]);

  async function fetchReports() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedUser) params.set("userId", selectedUser);
      if (dateRange.start) params.set("startDate", dateRange.start);
      if (dateRange.end) params.set("endDate", dateRange.end);
      const res = await fetch(`/api/cash-drawer/reports?${params}`);
      if (res.ok) {
        const data = await res.json();
        setDrawers(data.drawers);
        setUsersSummary(data.usersSummary);
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  }

  async function saveNotes(drawerId: string) {
    try {
      const res = await fetch("/api/cash-drawer/reports", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drawerId, notes: notesValue }),
      });
      if (res.ok) {
        setDrawers((prev) =>
          prev.map((d) => (d.id === drawerId ? { ...d, notes: notesValue } : d))
        );
        setEditingNotes(null);
      }
    } catch (error) {
      console.error("Failed to save notes:", error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4a843] to-[#b8942f]">
            <DollarSign size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#f0f0f5]">Cash Drawer Reports</h3>
            <p className="text-xs text-[#9090a0]">Overage & shortage tracking per sales rep</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange((p) => ({ ...p, start: e.target.value }))}
            className="input w-40"
          />
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange((p) => ({ ...p, end: e.target.value }))}
            className="input w-40"
          />
          <div className="flex rounded-lg border border-[#2a2a3a] bg-[#1c1c28] p-0.5">
            <button
              onClick={() => setActiveTab("summary")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === "summary" ? "bg-[#d4a843] text-black" : "text-[#9090a0] hover:text-[#f0f0f5]"
              }`}
            >
              Sales Rep Summary
            </button>
            <button
              onClick={() => setActiveTab("detail")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === "detail" ? "bg-[#d4a843] text-black" : "text-[#9090a0] hover:text-[#f0f0f5]"
              }`}
            >
              All Sessions
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4a843] border-t-transparent" />
        </div>
      ) : activeTab === "summary" ? (
        <div className="glass-card p-6">
          <h4 className="mb-4 text-sm font-semibold text-[#f0f0f5]">Sales Rep Cash Performance</h4>
          {usersSummary.length === 0 ? (
            <p className="text-center text-sm text-[#606070]">No closed drawer data found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2a2a3a]">
                    <th className="px-3 py-2 text-left text-xs font-medium text-[#9090a0]">Cashier</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-[#9090a0]">Role</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-[#9090a0]">Sessions</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-[#9090a0]">Total Overage</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-[#9090a0]">Total Shortage</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-[#9090a0]">Net</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-[#9090a0]">Avg</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-[#9090a0]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {usersSummary.map((u) => (
                    <tr key={u.userId} className="border-b border-[#2a2a3a]/50 hover:bg-[#1c1c28]/50">
                      <td className="px-3 py-3 font-medium text-[#f0f0f5]">{u.cashier}</td>
                      <td className="px-3 py-3 text-[#9090a0]">{u.role.replace(/_/g, " ")}</td>
                      <td className="px-3 py-3 text-right text-[#9090a0]">{u.sessions}</td>
                      <td className="px-3 py-3 text-right text-[#10b981]">
                        {u.totalOverage > 0 ? `+${formatCurrency(u.totalOverage)}` : "—"}
                      </td>
                      <td className="px-3 py-3 text-right text-[#f43f5e]">
                        {u.totalShortage > 0 ? `-${formatCurrency(u.totalShortage)}` : "—"}
                      </td>
                      <td className={`px-3 py-3 text-right font-medium ${
                        u.netDifference > 0 ? "text-[#10b981]" : u.netDifference < 0 ? "text-[#f43f5e]" : "text-[#9090a0]"
                      }`}>
                        {u.netDifference >= 0 ? "+" : ""}{formatCurrency(u.netDifference)}
                      </td>
                      <td className="px-3 py-3 text-right text-[#9090a0]">
                        {u.avgDifference >= 0 ? "+" : ""}{formatCurrency(u.avgDifference)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {u.netDifference > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#10b981]/10 px-2 py-0.5 text-[10px] font-medium text-[#10b981]">
                            <TrendingUp size={10} /> Over
                          </span>
                        ) : u.netDifference < 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#f43f5e]/10 px-2 py-0.5 text-[10px] font-medium text-[#f43f5e]">
                            <AlertTriangle size={10} /> Short
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#06b6d4]/10 px-2 py-0.5 text-[10px] font-medium text-[#06b6d4]">
                            <CheckCircle size={10} /> Balanced
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-card p-6">
          <h4 className="mb-4 text-sm font-semibold text-[#f0f0f5]">All Cash Drawer Sessions</h4>
          {drawers.length === 0 ? (
            <p className="text-center text-sm text-[#606070]">No sessions found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2a2a3a]">
                    <th className="px-3 py-2 text-left text-xs font-medium text-[#9090a0]">Cashier</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-[#9090a0]">Opening</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-[#9090a0]">Closing</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-[#9090a0]">Actual</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-[#9090a0]">Over/Short</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-[#9090a0]">Opened</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-[#9090a0]">Closed</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-[#9090a0]">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {drawers.map((d) => (
                    <tr key={d.id} className="border-b border-[#2a2a3a]/50 hover:bg-[#1c1c28]/50">
                      <td className="px-3 py-3 font-medium text-[#f0f0f5]">{d.cashier}</td>
                      <td className="px-3 py-3 text-right text-[#9090a0]">{formatCurrency(d.openingBalance)}</td>
                      <td className="px-3 py-3 text-right text-[#9090a0]">{d.closingBalance != null ? formatCurrency(d.closingBalance) : "—"}</td>
                      <td className="px-3 py-3 text-right text-[#9090a0]">{d.actualBalance != null ? formatCurrency(d.actualBalance) : "—"}</td>
                      <td className={`px-3 py-3 text-right font-medium ${
                        (d.difference ?? 0) > 0 ? "text-[#10b981]" : (d.difference ?? 0) < 0 ? "text-[#f43f5e]" : "text-[#9090a0]"
                      }`}>
                        {d.difference != null ? (
                          <>
                            {(d.difference) >= 0 ? "+" : ""}{formatCurrency(d.difference)}
                            {d.overage > 0 && <span className="ml-1 text-[10px] text-[#10b981]">↑</span>}
                            {d.shortage > 0 && <span className="ml-1 text-[10px] text-[#f43f5e]">↓</span>}
                          </>
                        ) : "—"}
                      </td>
                      <td className="px-3 py-3 text-xs text-[#606070]">{formatDateTime(d.openedAt)}</td>
                      <td className="px-3 py-3 text-xs text-[#606070]">{d.closedAt ? formatDateTime(d.closedAt) : "—"}</td>
                      <td className="px-3 py-3">
                        {editingNotes === d.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={notesValue}
                              onChange={(e) => setNotesValue(e.target.value)}
                              className="w-32 rounded border border-[#2a2a3a] bg-[#111118] px-2 py-1 text-xs text-[#f0f0f5]"
                              placeholder="Add notes..."
                              autoFocus
                            />
                            <button onClick={() => saveNotes(d.id)} className="text-xs text-[#10b981] hover:underline">Save</button>
                            <button onClick={() => setEditingNotes(null)} className="text-xs text-[#606070] hover:underline">Cancel</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditingNotes(d.id); setNotesValue(d.notes || ""); }}
                            className="flex items-center gap-1 text-xs text-[#606070] hover:text-[#d4a843]"
                          >
                            {d.notes ? (
                              <><MessageSquare size={12} /> {d.notes}</>
                            ) : (
                              <><MessageSquare size={12} /> Add note</>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
