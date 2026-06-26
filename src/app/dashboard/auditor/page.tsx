"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { formatDateTime, formatCurrency } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Shield,
  Activity,
  Download,
  ChevronDown,
  ChevronRight,
  ShoppingCart,
  DollarSign,
  Package,
  ClipboardList,
  Users,
  TrendingUp,
  Clock,
  RefreshCw,
  Search,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
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

interface DepartmentData {
  name: string;
  [key: string]: string | number;
}

interface DepartmentsMap {
  sales: DepartmentData;
  inventory: DepartmentData;
  finance: DepartmentData;
  procurement: DepartmentData;
  users: DepartmentData;
  [key: string]: DepartmentData;
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
    totalSales: number;
    completedSales: number;
    refundedSales: number;
    cancelledSales: number;
    salesRevenue: number;
    totalProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    totalStockMovements: number;
    totalExpenses: number;
    approvedExpenses: number;
    pendingExpenses: number;
    totalInvoices: number;
    pendingInvoices: number;
    paidInvoicesValue: number;
    totalSuppliers: number;
    pendingPurchaseOrders: number;
    totalOrderValue: number;
    activeUsers: number;
    loginsToday: number;
    newUsersThisMonth: number;
  };
  dailyDepartmentActivity: {
    day: string;
    sales: number;
    inventory: number;
    finance: number;
    procurement: number;
    users: number;
  }[];
  departments: DepartmentsMap;
}

export default function AuditorDashboard() {
  const [data, setData] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, actionFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchData();
  }, [search, actionFilter, dateFrom, dateTo, currentPage]);

  async function fetchData() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
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

  function toggleDept(key: string) {
    setExpandedDepts((prev) => ({ ...prev, [key]: !prev[key] }));
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
      label: "Sales Transactions",
      value: data?.stats?.totalSales ?? 0,
      icon: ShoppingCart,
      color: "from-[#3b82f6]/20 to-[#3b82f6]/5",
      iconColor: "text-[#3b82f6]",
    },
    {
      label: "Revenue Audited",
      value: data?.stats?.salesRevenue ?? 0,
      icon: DollarSign,
      color: "from-[#10b981]/20 to-[#10b981]/5",
      iconColor: "text-[#10b981]",
      isCurrency: true,
    },
    {
      label: "Expenses Tracked",
      value: data?.stats?.totalExpenses ?? 0,
      icon: ClipboardList,
      color: "from-[#f59e0b]/20 to-[#f59e0b]/5",
      iconColor: "text-[#f59e0b]",
      isCurrency: true,
    },
    {
      label: "Inventory Items",
      value: data?.stats?.totalProducts ?? 0,
      icon: Package,
      color: "from-[#8b5cf6]/20 to-[#8b5cf6]/5",
      iconColor: "text-[#8b5cf6]",
    },
    {
      label: "Stock Movements",
      value: data?.stats?.totalStockMovements ?? 0,
      icon: TrendingUp,
      color: "from-[#06b6d4]/20 to-[#06b6d4]/5",
      iconColor: "text-[#06b6d4]",
    },
    {
      label: "Pending Approvals",
      value: (data?.stats?.pendingExpenses ?? 0) + (data?.stats?.pendingInvoices ?? 0),
      icon: Clock,
      color: "from-[#f43f5e]/20 to-[#f43f5e]/5",
      iconColor: "text-[#f43f5e]",
    },
    {
      label: "Active Users",
      value: data?.stats?.activeUsers ?? 0,
      icon: Users,
      color: "from-[#22c55e]/20 to-[#22c55e]/5",
      iconColor: "text-[#22c55e]",
    },
  ];

  const quickActions = [
    {
      label: "Export Logs (PDF)",
      icon: Download,
      onClick: () => handleExportPDF(),
    },
    {
      label: "Sales Report",
      icon: ShoppingCart,
      href: "/dashboard/sales-manager/sales",
    },
    {
      label: "Inventory Report",
      icon: Package,
      href: "/dashboard/inventory",
    },
    {
      label: "Financial Report",
      icon: DollarSign,
      href: "/dashboard/accounting",
    },
  ];

  function handleExportCSV() {
    const logs = data?.auditLogs ?? [];
    const headers = ["Timestamp", "User", "Action", "Resource", "Details", "IP Address"];
    const rows = logs.map((log) => [
      formatDateTime(log.createdAt),
      `${log.user.firstName} ${log.user.lastName}`,
      log.action,
      log.resource,
      log.details ? JSON.stringify(log.details) : "",
      log.ipAddress ?? "",
    ]);
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  }

  function handleExportPDF() {
    const logs = data?.auditLogs ?? [];
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Audit Logs Report", 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
    const headers = [
      "Timestamp",
      "User",
      "Action",
      "Resource",
      "Details",
      "IP Address",
    ];
    const rows = logs.map((log) => [
      formatDateTime(log.createdAt),
      `${log.user.firstName} ${log.user.lastName}`,
      log.action,
      log.resource,
      log.details ? JSON.stringify(log.details) : "",
      log.ipAddress ?? "",
    ]);
    autoTable(doc, {
      startY: 35,
      head: [headers],
      body: rows,
      theme: "grid",
      headStyles: { fillColor: [212, 168, 67] },
      styles: { fontSize: 8 },
    });
    doc.save(`audit-logs-${new Date().toISOString().split("T")[0]}.pdf`);
    setShowExportMenu(false);
  }

  function getActionBadge(action: string) {
    const upper = action.toUpperCase();
    if (upper.includes("CREATE") || upper.includes("ADD")) return "badge-success";
    if (upper.includes("UPDATE") || upper.includes("MODIFY") || upper.includes("EDIT"))
      return "badge-info";
    if (upper.includes("DELETE") || upper.includes("REMOVE")) return "badge-danger";
    if (upper.includes("LOGIN") || upper.includes("AUTH")) return "badge-purple";
    if (upper.includes("LOGOUT")) return "badge-warning";
    return "badge-info";
  }

  function formatStatValue(value: number, isCurrency?: boolean) {
    if (isCurrency) return formatCurrency(value);
    return value.toLocaleString();
  }

  const deptConfigs = [
    {
      key: "sales",
      icon: ShoppingCart,
      color: "#3b82f6",
      fields: [
        { label: "Total Transactions", key: "totalTransactions" },
        { label: "Completed", key: "completed" },
        { label: "Refunded", key: "refunded" },
        { label: "Cancelled", key: "cancelled" },
        { label: "Revenue", key: "revenue", currency: true },
      ],
    },
    {
      key: "inventory",
      icon: Package,
      color: "#8b5cf6",
      fields: [
        { label: "Total Products", key: "totalProducts" },
        { label: "Low Stock", key: "lowStock" },
        { label: "Out of Stock", key: "outOfStock" },
        { label: "Stock Movements", key: "stockMovements" },
      ],
    },
    {
      key: "finance",
      icon: DollarSign,
      color: "#10b981",
      fields: [
        { label: "Total Expenses", key: "totalExpenses", currency: true },
        { label: "Approved Expenses", key: "approvedExpenses", currency: true },
        { label: "Pending Expenses", key: "pendingExpenses" },
        { label: "Total Invoices", key: "totalInvoices" },
        { label: "Pending Invoices", key: "pendingInvoices" },
        { label: "Paid Invoices Value", key: "paidInvoicesValue", currency: true },
      ],
    },
    {
      key: "procurement",
      icon: ClipboardList,
      color: "#f59e0b",
      fields: [
        { label: "Total Suppliers", key: "totalSuppliers" },
        { label: "Pending Orders", key: "pendingOrders" },
        { label: "Total Order Value", key: "totalOrderValue", currency: true },
      ],
    },
    {
      key: "users",
      icon: Users,
      color: "#22c55e",
      fields: [
        { label: "Active Users", key: "activeUsers" },
        { label: "Logins Today", key: "loginsToday" },
        { label: "New Users This Month", key: "newUsersThisMonth" },
      ],
    },
  ];

  return (
    <DashboardLayout role="AUDITOR" title="Audit & Compliance">
      <div className="space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="stat-card">
                <div className="flex items-start justify-between">
                  <div
                    className={`stat-icon bg-gradient-to-br ${stat.color}`}
                  >
                    <Icon size={20} className={stat.iconColor} />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-bold text-[#f0f0f5]">
                  {formatStatValue(stat.value, stat.isCurrency)}
                </p>
                <p className="mt-1 text-sm text-[#9090a0]">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="glass-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-[#f0f0f5]">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex w-full items-center gap-3 rounded-xl border border-[#2a2a3a] bg-[#1c1c28] p-3 transition-all hover:border-[#d4a843]/30 hover:bg-[#1c1c28]/80"
              >
                <Download size={18} className="text-[#d4a843]" />
                <span className="text-sm font-medium text-[#f0f0f5]">
                  Export Logs
                </span>
                <ChevronDown size={14} className="ml-auto text-[#9090a0]" />
              </button>
              {showExportMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowExportMenu(false)}
                  />
                  <div className="absolute left-0 z-50 mt-2 w-44 rounded-xl border border-[#2a2a3a] bg-[#1c1c28] py-1 shadow-lg">
                    <button
                      onClick={handleExportCSV}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[#f0f0f5] hover:bg-[#2a2a3a]"
                    >
                      Export as CSV
                    </button>
                    <button
                      onClick={handleExportPDF}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[#f0f0f5] hover:bg-[#2a2a3a]"
                    >
                      Export as PDF
                    </button>
                  </div>
                </>
              )}
            </div>
            {quickActions.slice(1).map((action) => {
              const Icon = action.icon;
              return (
                <a
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-3 rounded-xl border border-[#2a2a3a] bg-[#1c1c28] p-3 transition-all hover:border-[#d4a843]/30 hover:bg-[#1c1c28]/80"
                >
                  <Icon size={18} className="text-[#d4a843]" />
                  <span className="text-sm font-medium text-[#f0f0f5]">
                    {action.label}
                  </span>
                </a>
              );
            })}
          </div>
        </div>

        {/* Department Audit Section */}
        <div className="glass-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-[#f0f0f5]">
            Department Audit Overview
          </h3>
          <div className="space-y-3">
            {deptConfigs.map((dept) => {
              const DeptIcon = dept.icon;
              const deptData = data?.departments?.[dept.key];
              const isExpanded = expandedDepts[dept.key] ?? false;
              return (
                <div
                  key={dept.key}
                  className="rounded-xl border border-[#2a2a3a] bg-[#1a1a2e]/50"
                >
                  <button
                    onClick={() => toggleDept(dept.key)}
                    className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-[#1a1a2e]"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-lg"
                        style={{ backgroundColor: dept.color + "20" }}
                      >
                        <DeptIcon size={18} style={{ color: dept.color }} />
                      </div>
                      <span className="font-medium text-[#f0f0f5]">
                        {deptData?.name ?? dept.key}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown size={16} className="text-[#9090a0]" />
                      ) : (
                        <ChevronRight size={16} className="text-[#9090a0]" />
                      )}
                    </div>
                  </button>
                  {isExpanded && deptData && (
                    <div className="grid grid-cols-2 gap-3 border-t border-[#2a2a3a] p-4 sm:grid-cols-3 lg:grid-cols-5">
                      {dept.fields.map((field) => (
                        <div key={field.key}>
                          <p className="text-xs text-[#606070]">{field.label}</p>
                          <p className="text-sm font-semibold text-[#f0f0f5]">
                            {field.currency
                              ? formatCurrency(Number(deptData[field.key] ?? 0))
                              : Number(deptData[field.key] ?? 0).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Daily Activity Chart */}
        {!loading && data?.dailyDepartmentActivity && (
          <div className="glass-card p-6">
            <h3 className="mb-4 text-lg font-semibold text-[#f0f0f5]">
              Daily Activity by Department (Past 7 Days)
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.dailyDepartmentActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
                  <XAxis dataKey="day" stroke="#606070" fontSize={12} />
                  <YAxis stroke="#606070" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "#16161f",
                      border: "1px solid #2a2a3a",
                      borderRadius: "8px",
                      color: "#f0f0f5",
                    }}
                  />
                  <Legend
                    wrapperStyle={{ color: "#9090a0", fontSize: 12 }}
                  />
                  <Bar
                    dataKey="sales"
                    name="Sales"
                    stackId="a"
                    fill="#3b82f6"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="inventory"
                    name="Inventory"
                    stackId="a"
                    fill="#8b5cf6"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="finance"
                    name="Finance"
                    stackId="a"
                    fill="#10b981"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="procurement"
                    name="Procurement"
                    stackId="a"
                    fill="#f59e0b"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="users"
                    name="Users"
                    stackId="a"
                    fill="#22c55e"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Audit Log Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-[#f0f0f5]">Audit Logs</h3>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606070]"
              />
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
            <>
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
                            <p className="text-xs text-[#606070]">
                              {log.user.email}
                            </p>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`badge ${getActionBadge(log.action)}`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="font-mono text-xs text-[#9090a0]">
                          {log.resource}
                        </td>
                        <td className="max-w-[200px] truncate text-sm text-[#9090a0]">
                          {log.details
                            ? JSON.stringify(log.details)
                            : "—"}
                        </td>
                        <td className="font-mono text-xs text-[#606070]">
                          {log.ipAddress ?? "—"}
                        </td>
                      </tr>
                    ))}
                    {(!data?.auditLogs || data.auditLogs.length === 0) && (
                      <tr>
                        <td
                          colSpan={6}
                          className="text-center text-[#606070] py-8"
                        >
                          No audit logs found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {data && data.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-[#606070]">
                    Page {data.page} of {data.totalPages} ({data.total} total
                    logs)
                  </p>
                  <div className="flex gap-2">
                    <button
                      disabled={data.page <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="btn btn-secondary btn-sm disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <button
                      disabled={data.page >= data.totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                      className="btn btn-secondary btn-sm disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
