"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { formatCurrency, formatDate } from "@/lib/utils";
import { AlertTriangle, DollarSign, Users, Download, TrendingUp, TrendingDown, Scale } from "lucide-react";

interface ShortageEntry {
  id: string;
  date: string;
  openingBalance: number;
  closingBalance: number;
  actualBalance: number;
  shortage: number;
}

interface OverageEntry {
  id: string;
  date: string;
  openingBalance: number;
  closingBalance: number;
  actualBalance: number;
  overage: number;
}

interface UserShortage {
  name: string;
  email: string;
  totalShortage: number;
  entries: ShortageEntry[];
}

interface UserOverage {
  name: string;
  email: string;
  totalOverage: number;
  entries: OverageEntry[];
}

interface ShortageData {
  month: string;
  totalShortage: number;
  totalOverage: number;
  netDifference: number;
  balancedDrawers: number;
  totalDrawers: number;
  users: UserShortage[];
  overageUsers: UserOverage[];
  allDrawers: any[];
}

export default function CashShortagesPage() {
  const [data, setData] = useState<ShortageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [expandedOverageUser, setExpandedOverageUser] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"shortages" | "overages" | "all">("shortages");

  useEffect(() => {
    fetchShortages();
  }, [month]);

  async function fetchShortages() {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/cash-shortages?month=${month}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch shortages:", error);
    } finally {
      setLoading(false);
    }
  }

  function exportCSV() {
    if (!data) return;
    const rows = [["Staff", "Email", "Date", "Expected", "Actual", "Difference", "Type"]];
    for (const d of data.allDrawers) {
      const type = d.difference < 0 ? "Shortage" : d.difference > 0 ? "Overage" : "Balanced";
      rows.push([d.user, "", new Date(d.date).toLocaleDateString(), String(d.closingBalance), String(d.actualBalance), String(d.difference), type]);
    }
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cash-reconciliation-${month}.csv`;
    a.click();
  }

  if (loading) {
    return (
      <DashboardLayout title="Cash Reconciliation">
        <div className="flex h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4a843] border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Cash Reconciliation">
      <div className="space-y-6">
        {/* Header Controls */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#f0f0f5]">Cash Drawer Reconciliation</h2>
            <p className="text-sm text-[#9090a0]">Track shortages, overages, and calculate salary deductions</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="input text-sm"
            />
            <button onClick={exportCSV} className="btn btn-secondary gap-2">
              <Download size={14} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="glass-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#f43f5e] to-[#e11d48]">
                <TrendingDown size={18} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-[#9090a0]">Total Shortages</p>
                <p className="text-2xl font-bold text-[#f43f5e]">{formatCurrency(data?.totalShortage ?? 0)}</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#10b981] to-[#059669]">
                <TrendingUp size={18} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-[#9090a0]">Total Overages</p>
                <p className="text-2xl font-bold text-[#10b981]">+{formatCurrency(data?.totalOverage ?? 0)}</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-5">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${(data?.netDifference ?? 0) >= 0 ? "from-[#10b981] to-[#059669]" : "from-[#f43f5e] to-[#e11d48]"}`}>
                <Scale size={18} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-[#9090a0]">Net Difference</p>
                <p className={`text-2xl font-bold ${(data?.netDifference ?? 0) >= 0 ? "text-[#10b981]" : "text-[#f43f5e]"}`}>
                  {(data?.netDifference ?? 0) >= 0 ? "+" : ""}{formatCurrency(data?.netDifference ?? 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="glass-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4a843] to-[#b8942f]">
                <DollarSign size={18} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-[#9090a0]">Drawers Reconciled</p>
                <p className="text-2xl font-bold text-[#f0f0f5]">{data?.totalDrawers ?? 0}</p>
                <p className="text-xs text-[#606070]">{data?.balancedDrawers ?? 0} balanced</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 rounded-xl border border-[#2a2a3a] bg-[#1c1c28] p-1">
          <button
            onClick={() => setActiveTab("shortages")}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === "shortages"
                ? "bg-[#f43f5e]/15 text-[#f43f5e]"
                : "text-[#9090a0] hover:text-[#f0f0f5]"
            }`}
          >
            Shortages ({data?.users.length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab("overages")}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === "overages"
                ? "bg-[#10b981]/15 text-[#10b981]"
                : "text-[#9090a0] hover:text-[#f0f0f5]"
            }`}
          >
            Overages ({data?.overageUsers.length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === "all"
                ? "bg-[#d4a843]/15 text-[#d4a843]"
                : "text-[#9090a0] hover:text-[#f0f0f5]"
            }`}
          >
            All Drawers ({data?.allDrawers.length ?? 0})
          </button>
        </div>

        {/* Shortages Tab */}
        {activeTab === "shortages" && (
          <>
            {data?.users && data.users.length > 0 ? (
              <div className="space-y-4">
                {/* Salary Deduction Summary */}
                <div className="glass-card border border-[#f43f5e]/20 p-6">
                  <h3 className="mb-4 text-lg font-semibold text-[#f0f0f5]">Monthly Salary Deduction Summary</h3>
                  <p className="mb-4 text-sm text-[#9090a0]">
                    The following amounts should be deducted from each staff member&apos;s salary for <strong>{new Date(month + "-01").toLocaleDateString("en-NG", { month: "long", year: "numeric" })}</strong>.
                  </p>
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Staff Member</th>
                          <th>Email</th>
                          <th>Shortage Days</th>
                          <th>Total Deduction</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.users.map((u) => (
                          <tr key={u.email}>
                            <td className="font-medium text-[#f0f0f5]">{u.name}</td>
                            <td className="text-[#9090a0]">{u.email}</td>
                            <td className="text-[#f59e0b]">{u.entries.length}</td>
                            <td className="font-bold text-[#f43f5e]">-{formatCurrency(u.totalShortage)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-[#2a2a3a]">
                          <td colSpan={2} className="font-bold text-[#f0f0f5]">Total Deductions</td>
                          <td className="font-bold text-[#f59e0b]">{data.users.reduce((sum, u) => sum + u.entries.length, 0)}</td>
                          <td className="font-bold text-[#f43f5e]">-{formatCurrency(data.totalShortage)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Detailed Breakdown per User */}
                <h3 className="text-lg font-semibold text-[#f0f0f5]">Detailed Breakdown</h3>
                {data.users.map((u) => (
                  <div key={u.email} className="glass-card overflow-hidden">
                    <button
                      onClick={() => setExpandedUser(expandedUser === u.email ? null : u.email)}
                      className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#f43f5e]/20 to-[#f43f5e]/5 text-sm font-bold text-[#f43f5e]">
                          {u.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div>
                          <p className="font-semibold text-[#f0f0f5]">{u.name}</p>
                          <p className="text-xs text-[#9090a0]">{u.entries.length} shortage day(s)</p>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-[#f43f5e]">-{formatCurrency(u.totalShortage)}</p>
                    </button>
                    {expandedUser === u.email && (
                      <div className="border-t border-[#2a2a3a] px-5 pb-5">
                        <table className="table mt-2">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Expected</th>
                              <th>Actual</th>
                              <th>Shortage</th>
                            </tr>
                          </thead>
                          <tbody>
                            {u.entries.map((e) => (
                              <tr key={e.id}>
                                <td className="text-[#9090a0]">{formatDate(e.date)}</td>
                                <td className="text-[#f0f0f5]">{formatCurrency(e.closingBalance)}</td>
                                <td className="text-[#f0f0f5]">{formatCurrency(e.actualBalance)}</td>
                                <td className="font-bold text-[#f43f5e]">-{formatCurrency(e.shortage)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card p-12 text-center">
                <AlertTriangle size={48} className="mx-auto mb-4 text-[#10b981]" />
                <h3 className="text-lg font-bold text-[#f0f0f5]">No Shortages</h3>
                <p className="mt-2 text-[#9090a0]">No cash drawer shortages recorded for this month.</p>
              </div>
            )}
          </>
        )}

        {/* Overages Tab */}
        {activeTab === "overages" && (
          <>
            {data?.overageUsers && data.overageUsers.length > 0 ? (
              <div className="space-y-4">
                {/* Overage Summary */}
                <div className="glass-card border border-[#10b981]/20 p-6">
                  <h3 className="mb-4 text-lg font-semibold text-[#f0f0f5]">Overage Summary</h3>
                  <p className="mb-4 text-sm text-[#9090a0]">
                    Staff members who had more cash than expected. These overages may indicate pricing errors, incorrect change, or unrecorded transactions.
                  </p>
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Staff Member</th>
                          <th>Email</th>
                          <th>Overage Days</th>
                          <th>Total Overage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.overageUsers.map((u) => (
                          <tr key={u.email}>
                            <td className="font-medium text-[#f0f0f5]">{u.name}</td>
                            <td className="text-[#9090a0]">{u.email}</td>
                            <td className="text-[#10b981]">{u.entries.length}</td>
                            <td className="font-bold text-[#10b981]">+{formatCurrency(u.totalOverage)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-[#2a2a3a]">
                          <td colSpan={2} className="font-bold text-[#f0f0f5]">Total Overages</td>
                          <td className="font-bold text-[#10b981]">{data.overageUsers.reduce((sum, u) => sum + u.entries.length, 0)}</td>
                          <td className="font-bold text-[#10b981]">+{formatCurrency(data.totalOverage)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Detailed Breakdown per User */}
                <h3 className="text-lg font-semibold text-[#f0f0f5]">Detailed Breakdown</h3>
                {data.overageUsers.map((u) => (
                  <div key={u.email} className="glass-card overflow-hidden">
                    <button
                      onClick={() => setExpandedOverageUser(expandedOverageUser === u.email ? null : u.email)}
                      className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#10b981]/20 to-[#10b981]/5 text-sm font-bold text-[#10b981]">
                          {u.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div>
                          <p className="font-semibold text-[#f0f0f5]">{u.name}</p>
                          <p className="text-xs text-[#9090a0]">{u.entries.length} overage day(s)</p>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-[#10b981]">+{formatCurrency(u.totalOverage)}</p>
                    </button>
                    {expandedOverageUser === u.email && (
                      <div className="border-t border-[#2a2a3a] px-5 pb-5">
                        <table className="table mt-2">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Expected</th>
                              <th>Actual</th>
                              <th>Overage</th>
                            </tr>
                          </thead>
                          <tbody>
                            {u.entries.map((e) => (
                              <tr key={e.id}>
                                <td className="text-[#9090a0]">{formatDate(e.date)}</td>
                                <td className="text-[#f0f0f5]">{formatCurrency(e.closingBalance)}</td>
                                <td className="text-[#f0f0f5]">{formatCurrency(e.actualBalance)}</td>
                                <td className="font-bold text-[#10b981]">+{formatCurrency(e.overage)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card p-12 text-center">
                <TrendingUp size={48} className="mx-auto mb-4 text-[#10b981]" />
                <h3 className="text-lg font-bold text-[#f0f0f5]">No Overages</h3>
                <p className="mt-2 text-[#9090a0]">No cash drawer overages recorded for this month.</p>
              </div>
            )}
          </>
        )}

        {/* All Drawers Tab */}
        {activeTab === "all" && (
          <>
            {data?.allDrawers && data.allDrawers.length > 0 ? (
              <div className="glass-card p-6">
                <h3 className="mb-4 text-lg font-semibold text-[#f0f0f5]">All Drawer Closings</h3>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Staff</th>
                        <th>Date</th>
                        <th>Opening</th>
                        <th>Expected Closing</th>
                        <th>Actual</th>
                        <th>Difference</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.allDrawers.map((d) => (
                        <tr key={d.id}>
                          <td className="font-medium text-[#f0f0f5]">{d.user}</td>
                          <td className="text-[#9090a0]">{formatDate(d.date)}</td>
                          <td className="text-[#f0f0f5]">{formatCurrency(d.openingBalance)}</td>
                          <td className="text-[#f0f0f5]">{formatCurrency(d.closingBalance)}</td>
                          <td className="text-[#f0f0f5]">{formatCurrency(d.actualBalance)}</td>
                          <td className={`font-bold ${d.difference < 0 ? "text-[#f43f5e]" : d.difference > 0 ? "text-[#10b981]" : "text-[#10b981]"}`}>
                            {d.difference < 0 ? "-" : d.difference > 0 ? "+" : ""}{formatCurrency(Math.abs(d.difference))}
                          </td>
                          <td>
                            <span className={`badge ${d.difference < 0 ? "badge-danger" : d.difference > 0 ? "badge-success" : "badge-info"}`}>
                              {d.difference < 0 ? "Shortage" : d.difference > 0 ? "Overage" : "Balanced"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="glass-card p-12 text-center">
                <DollarSign size={48} className="mx-auto mb-4 text-[#606070]" />
                <h3 className="text-lg font-bold text-[#f0f0f5]">No Data</h3>
                <p className="mt-2 text-[#9090a0]">No drawer closings recorded for this month.</p>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
