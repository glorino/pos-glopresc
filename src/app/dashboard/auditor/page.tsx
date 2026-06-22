"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { formatDateTime } from "@/lib/utils";
import {
  Shield,
  Activity,
  AlertTriangle,
  Edit3,
  Bell,
  Download,
  Eye,
  FileText,
  RefreshCw,
  Search,
  Filter,
  Calendar,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string | null;
  details: any;
  ipAddress: string | null;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string };
}

interface AuditData {
  auditLogs: AuditLogEntry[];
  total: number;
  page: number;
  totalPages: number;
  stats: {
    totalLogs: number;
    todayActivities: number;
    failedLogins: number;
    modifiedRecords: number;
    systemAlerts: number;
  };
  dailyActions: { name: string; count: number }[];
}

export default function AuditorDashboard() {
  const [data, setData] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    fetchData();
  }, [search, actionFilter, dateFrom, dateTo]);

  async function fetchData() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (actionFilter) params.set("action", actionFilter);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const res = await fetch(`/api/audit?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to fetch audit data:", err);
    } finally {
      setLoading(false);
    }
  }

  const stats = [
    {
      label: "Total Audit Logs",
      value: data?.stats?.totalLogs ?? 0,
      icon: Shield,
      color: "from-[#d4a843]/20 to-[#d4a843]/5",
      iconColor: "text-[#d4a843]",
    },
    {
      label: "Today's Activities",
      value: data?.stats?.todayActivities ?? 0,
      icon: Activity,
      color: "from-[#3b82f6]/20 to-[#3b82f6]/5",
      iconColor: "text-[#3b82f6]",
    },
    {
      label: "Failed Logins",
      value: data?.stats?.failedLogins ?? 0,
      icon: AlertTriangle,
      color: "from-[#f43f5e]/20 to-[#f43f5e]/5",
      iconColor: "text-[#f43f5e]",
    },
    {
      label: "Modified Records",
      value: data?.stats?.modifiedRecords ?? 0,
      icon: Edit3,
      color: "from-[#8b5cf6]/20 to-[#8b5cf6]/5",
      iconColor: "text-[#8b5cf6]",
    },
    {
      label: "System Alerts",
      value: data?.stats?.systemAlerts ?? 0,
      icon: Bell,
      color: "from-[#f59e0b]/20 to-[#f59e0b]/5",
      iconColor: "text-[#f59e0b]",
    },
  ];

  const quickActions = [
    { label: "Export Logs", href: "#", icon: Download, onClick: () => {} },
    { label: "View Details", href: "#", icon: Eye, onClick: () => {} },
    { label: "User Activity Report", href: "#", icon: FileText, onClick: () => {} },
  ];

  function getActionBadge(action: string) {
    const upper = action.toUpperCase();
    if (upper.includes("CREATE") || upper.includes("ADD")) return "badge-success";
    if (upper.includes("UPDATE") || upper.includes("MODIFY") || upper.includes("EDIT")) return "badge-info";
    if (upper.includes("DELETE") || upper.includes("REMOVE")) return "badge-danger";
    if (upper.includes("LOGIN") || upper.includes("AUTH")) return "badge-purple";
    if (upper.includes("LOGOUT")) return "badge-warning";
    return "badge-info";
  }

  return (
    <DashboardLayout role="AUDITOR" title="Audit & Compliance">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="stat-card">
                <div className="flex items-start justify-between">
                  <div className={`stat-icon bg-gradient-to-br ${stat.color}`}>
                    <Icon size={20} className={stat.iconColor} />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-bold text-[#f0f0f5]">
                  {stat.value.toLocaleString()}
                </p>
                <p className="mt-1 text-sm text-[#9090a0]">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="glass-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-[#f0f0f5]">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  className="flex items-center gap-3 rounded-xl border border-[#2a2a3a] bg-[#1c1c28] p-3 transition-all hover:border-[#d4a843]/30 hover:bg-[#1c1c28]/80"
                >
                  <Icon size={18} className="text-[#d4a843]" />
                  <span className="text-sm font-medium text-[#f0f0f5]">{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Activity Chart */}
        {!loading && data?.dailyActions && (
          <div className="glass-card p-6">
            <h3 className="mb-4 text-lg font-semibold text-[#f0f0f5]">
              Daily Activities (Past 7 Days)
            </h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.dailyActions}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
                  <XAxis dataKey="name" stroke="#606070" fontSize={12} />
                  <YAxis stroke="#606070" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "#16161f",
                      border: "1px solid #2a2a3a",
                      borderRadius: "8px",
                      color: "#f0f0f5",
                    }}
                    formatter={(value: number) => [value, "Actions"]}
                  />
                  <Bar dataKey="count" fill="#d4a843" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-[#f0f0f5]">Audit Logs</h3>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606070]" />
              <input
                type="text"
                placeholder="Search logs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10 w-52"
              />
            </div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="input select w-40"
            >
              <option value="">All Actions</option>
              <option value="LOGIN">Login</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="LOGOUT">Logout</option>
            </select>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input w-40"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input w-40"
            />
            <button onClick={fetchData} className="btn btn-secondary btn-sm">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="glass-card p-6">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4a843] border-t-transparent" />
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Resource</th>
                    <th>Details</th>
                    <th>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.auditLogs ?? []).map((log) => (
                    <tr key={log.id}>
                      <td className="whitespace-nowrap text-[#9090a0]">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td>
                        <div>
                          <p className="font-medium text-[#f0f0f5]">
                            {log.user.firstName} {log.user.lastName}
                          </p>
                          <p className="text-xs text-[#606070]">{log.user.email}</p>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getActionBadge(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="font-mono text-xs text-[#9090a0]">
                        {log.resource}
                      </td>
                      <td className="max-w-[200px] truncate text-sm text-[#9090a0]">
                        {log.details ? JSON.stringify(log.details) : "—"}
                      </td>
                      <td className="font-mono text-xs text-[#606070]">
                        {log.ipAddress ?? "—"}
                      </td>
                    </tr>
                  ))}
                  {(!data?.auditLogs || data.auditLogs.length === 0) && (
                    <tr>
                      <td colSpan={6} className="text-center text-[#606070] py-8">
                        No audit logs found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
