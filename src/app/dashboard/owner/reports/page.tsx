"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  BarChart3,
  Download,
  TrendingUp,
  Package,
  DollarSign,
  Users,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type TabKey = "sales" | "inventory" | "financial" | "customers";

const tabs: { key: TabKey; label: string; icon: typeof BarChart3 }[] = [
  { key: "sales", label: "Sales", icon: TrendingUp },
  { key: "inventory", label: "Inventory", icon: Package },
  { key: "financial", label: "Financial", icon: DollarSign },
  { key: "customers", label: "Customers", icon: Users },
];

const COLORS = ["#d4a843", "#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f43f5e"];

const chartTooltipStyle = {
  contentStyle: {
    background: "#16161f",
    border: "1px solid #2a2a3a",
    borderRadius: "8px",
    color: "#f0f0f5",
  },
};

interface SalesReport {
  summary: {
    totalRevenue: number;
    totalDiscount: number;
    totalTax: number;
    totalTransactions: number;
    avgSaleValue: number;
  };
  salesByPeriod: { period: string; revenue: number; count: number }[];
  paymentBreakdown: { method: string; total: number; count: number }[];
  topProducts: {
    name: string;
    sku: string;
    totalSold: number;
    totalRevenue: number;
  }[];
}

interface InventoryReport {
  summary: {
    totalProducts: number;
    totalStockValue: number;
    lowStockItems: number;
    outOfStockItems: number;
  };
  stockByCategory: {
    category: string;
    productCount: number;
    stockValue: number;
  }[];
  lowStockProducts: {
    id: string;
    name: string;
    sku: string;
    currentStock: number;
    minStock: number;
    deficit: number;
  }[];
  products: {
    id: string;
    name: string;
    sku: string;
    stockQuantity: number;
    minStockLevel: number;
    costPrice: number;
    price: number;
    stockValue: number;
    category: string;
    isLowStock: boolean;
    isOutOfStock: boolean;
  }[];
}

interface FinancialReport {
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    grossProfit: number;
    netProfit: number;
    outstandingInvoices: number;
    outstandingCount: number;
    pendingExpenses: number;
    totalDiscounts: number;
  };
  cashFlow: {
    name: string;
    revenue: number;
    expenses: number;
    net: number;
  }[];
  expensesByCategory: {
    category: string;
    total: number;
    count: number;
  }[];
}

interface CustomerReport {
  summary: {
    totalCustomers: number;
    newCustomers: number;
    activeCustomers: number;
    totalLoyaltyPoints: number;
    totalRevenueFromCustomers: number;
    avgSpendPerCustomer: number;
  };
  topCustomers: {
    id: string;
    name: string;
    email: string;
    totalSpent: number;
    loyaltyPoints: number;
    orderCount: number;
  }[];
  customerGrowth: { name: string; count: number }[];
}

export default function OwnerReportsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("sales");
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

  const [salesData, setSalesData] = useState<SalesReport | null>(null);
  const [inventoryData, setInventoryData] = useState<InventoryReport | null>(
    null
  );
  const [financialData, setFinancialData] = useState<FinancialReport | null>(
    null
  );
  const [customerData, setCustomerData] = useState<CustomerReport | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  async function fetchReport() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ startDate, endDate });
      const [salesRes, invRes, finRes, custRes] = await Promise.all([
        fetch(`/api/reports/sales?${params}`),
        fetch(`/api/reports/inventory`),
        fetch(`/api/reports/financial?${params}`),
        fetch(`/api/reports/customers?${params}`),
      ]);

      if (salesRes.ok) setSalesData(await salesRes.json());
      if (invRes.ok) setInventoryData(await invRes.json());
      if (finRes.ok) setFinancialData(await finRes.json());
      if (custRes.ok) setCustomerData(await custRes.json());
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReport();
  }, []);

  const getExportData = (tab: string) => {
    const data =
      tab === "sales"
        ? salesData
        : tab === "inventory"
        ? inventoryData
        : tab === "financial"
        ? financialData
        : customerData;
    return data;
  };

  const handleExportCSV = (tab: string) => {
    const data = getExportData(tab);
    if (!data) return;
    const csv = JSON.stringify(data, null, 2);
    const blob = new Blob([csv], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tab}-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleExportPDF = (tab: string) => {
    const data = getExportData(tab);
    if (!data) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`${tab.charAt(0).toUpperCase() + tab.slice(1)} Report`, 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

    let startY = 35;
    const summary = (data as any).summary;
    if (summary) {
      const entries = Object.entries(summary).map(([k, v]) => [
        k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()),
        typeof v === "number" ? `₦${v.toLocaleString("en-NG", { minimumFractionDigits: 2 })}` : String(v),
      ]);
      autoTable(doc, {
        startY,
        head: [["Metric", "Value"]],
        body: entries,
        theme: "grid",
        headStyles: { fillColor: [212, 168, 67] },
      });
      startY = (doc as any).lastAutoTable.finalY + 10;
    }

    const detailData = (data as any).salesByPeriod || (data as any).products || (data as any).cashFlow || (data as any).topProducts || (data as any).topCustomers || (data as any).expensesByCategory;
    if (detailData && Array.isArray(detailData) && detailData.length > 0) {
      const keys = Object.keys(detailData[0]);
      const rows = detailData.map((item: any) => keys.map((k) => String(item[k])));
      autoTable(doc, {
        startY,
        head: [keys.map((k) => k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()))],
        body: rows,
        theme: "grid",
        headStyles: { fillColor: [212, 168, 67] },
      });
    }

    doc.save(`${tab}-report-${new Date().toISOString().split("T")[0]}.pdf`);
    setShowExportMenu(false);
  };

  function renderSalesTab() {
    if (!salesData) return <p className="text-[#606070] text-center py-8">No sales data available</p>;
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="stat-card">
            <p className="text-sm text-[#9090a0]">Total Revenue</p>
            <p className="text-2xl font-bold text-[#d4a843]">
              {formatCurrency(salesData.summary.totalRevenue)}
            </p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-[#9090a0]">Transactions</p>
            <p className="text-2xl font-bold text-[#3b82f6]">
              {salesData.summary.totalTransactions}
            </p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-[#9090a0]">Avg Sale Value</p>
            <p className="text-2xl font-bold text-[#8b5cf6]">
              {formatCurrency(salesData.summary.avgSaleValue)}
            </p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-[#9090a0]">Total Discount</p>
            <p className="text-2xl font-bold text-[#f43f5e]">
              {formatCurrency(salesData.summary.totalDiscount)}
            </p>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-[#f0f0f5]">Sales Trend</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData.salesByPeriod}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
                <XAxis dataKey="period" stroke="#606070" fontSize={12} />
                <YAxis stroke="#606070" fontSize={12} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                <Tooltip {...chartTooltipStyle} formatter={(value: number) => [formatCurrency(value), "Revenue"]} />
                <Line type="monotone" dataKey="revenue" stroke="#d4a843" strokeWidth={2} dot={{ fill: "#d4a843" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="glass-card p-6">
            <h3 className="mb-4 text-lg font-semibold text-[#f0f0f5]">Top Products</h3>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty Sold</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData.topProducts.map((p, i) => (
                    <tr key={i}>
                      <td className="font-medium text-[#f0f0f5]">{p.name}</td>
                      <td className="text-[#9090a0]">{p.totalSold}</td>
                      <td className="font-medium text-[#d4a843]">{formatCurrency(p.totalRevenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="mb-4 text-lg font-semibold text-[#f0f0f5]">Payment Methods</h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={salesData.paymentBreakdown.map((p) => ({ name: p.method, value: p.total }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {salesData.paymentBreakdown.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...chartTooltipStyle} formatter={(value: number) => formatCurrency(value)} />
                  <Legend wrapperStyle={{ color: "#9090a0" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderInventoryTab() {
    if (!inventoryData) return <p className="text-[#606070] text-center py-8">No inventory data available</p>;
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="stat-card">
            <p className="text-sm text-[#9090a0]">Total Products</p>
            <p className="text-2xl font-bold text-[#3b82f6]">{inventoryData.summary.totalProducts}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-[#9090a0]">Stock Value</p>
            <p className="text-2xl font-bold text-[#d4a843]">
              {formatCurrency(inventoryData.summary.totalStockValue)}
            </p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-[#9090a0]">Low Stock Items</p>
            <p className="text-2xl font-bold text-[#f59e0b]">{inventoryData.summary.lowStockItems}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-[#9090a0]">Out of Stock</p>
            <p className="text-2xl font-bold text-[#f43f5e]">{inventoryData.summary.outOfStockItems}</p>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-[#f0f0f5]">Stock Levels</h3>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Stock</th>
                  <th>Min Level</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {inventoryData.products.slice(0, 20).map((p) => (
                  <tr key={p.id}>
                    <td className="font-medium text-[#f0f0f5]">{p.name}</td>
                    <td className="text-[#9090a0]">{p.sku}</td>
                    <td className="text-[#f0f0f5]">{p.stockQuantity}</td>
                    <td className="text-[#9090a0]">{p.minStockLevel}</td>
                    <td>
                      {p.isOutOfStock ? (
                        <span className="badge badge-danger">Out of Stock</span>
                      ) : p.isLowStock ? (
                        <span className="badge badge-warning">Low Stock</span>
                      ) : (
                        <span className="badge badge-success">In Stock</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {inventoryData.lowStockProducts.length > 0 && (
          <div className="glass-card p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#f0f0f5]">
              <AlertTriangle size={18} className="text-[#f59e0b]" />
              Low Stock Alerts
            </h3>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Current</th>
                    <th>Min</th>
                    <th>Deficit</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryData.lowStockProducts.map((p) => (
                    <tr key={p.id}>
                      <td className="font-medium text-[#f0f0f5]">{p.name}</td>
                      <td className="text-[#9090a0]">{p.sku}</td>
                      <td className="text-[#f43f5e]">{p.currentStock}</td>
                      <td className="text-[#9090a0]">{p.minStock}</td>
                      <td className="font-medium text-[#f43f5e]">-{p.deficit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="glass-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-[#f0f0f5]">Stock Value by Category</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={inventoryData.stockByCategory.map((s) => ({
                    name: s.category,
                    value: s.stockValue,
                  }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {inventoryData.stockByCategory.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...chartTooltipStyle} formatter={(value: number) => formatCurrency(value)} />
                <Legend wrapperStyle={{ color: "#9090a0" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  }

  function renderFinancialTab() {
    if (!financialData) return <p className="text-[#606070] text-center py-8">No financial data available</p>;
    const profitMargin =
      financialData.summary.totalRevenue > 0
        ? ((financialData.summary.netProfit / financialData.summary.totalRevenue) * 100).toFixed(1)
        : "0";
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="stat-card">
            <p className="text-sm text-[#9090a0]">Total Revenue</p>
            <p className="text-2xl font-bold text-[#d4a843]">
              {formatCurrency(financialData.summary.totalRevenue)}
            </p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-[#9090a0]">Total Expenses</p>
            <p className="text-2xl font-bold text-[#f43f5e]">
              {formatCurrency(financialData.summary.totalExpenses)}
            </p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-[#9090a0]">Net Profit</p>
            <p className="text-2xl font-bold text-[#10b981]">
              {formatCurrency(financialData.summary.netProfit)}
            </p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-[#9090a0]">Profit Margin</p>
            <p className="text-2xl font-bold text-[#8b5cf6]">{profitMargin}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="stat-card">
            <p className="text-sm text-[#9090a0]">Outstanding Invoices</p>
            <p className="text-2xl font-bold text-[#f59e0b]">
              {formatCurrency(financialData.summary.outstandingInvoices)}
            </p>
            <p className="text-xs text-[#606070]">
              {financialData.summary.outstandingCount} invoice(s)
            </p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-[#9090a0]">Pending Expenses</p>
            <p className="text-2xl font-bold text-[#f59e0b]">
              {formatCurrency(financialData.summary.pendingExpenses)}
            </p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-[#9090a0]">Total Discounts</p>
            <p className="text-2xl font-bold text-[#3b82f6]">
              {formatCurrency(financialData.summary.totalDiscounts)}
            </p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-[#9090a0]">Gross Profit</p>
            <p className="text-2xl font-bold text-[#06b6d4]">
              {formatCurrency(financialData.summary.grossProfit)}
            </p>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-[#f0f0f5]">Revenue vs Expenses</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialData.cashFlow}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
                <XAxis dataKey="name" stroke="#606070" fontSize={12} />
                <YAxis stroke="#606070" fontSize={12} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                <Tooltip {...chartTooltipStyle} formatter={(value: number) => formatCurrency(value)} />
                <Legend wrapperStyle={{ color: "#9090a0" }} />
                <Bar dataKey="revenue" fill="#d4a843" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-[#f0f0f5]">Cash Flow Trend</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={financialData.cashFlow}>
                <defs>
                  <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
                <XAxis dataKey="name" stroke="#606070" fontSize={12} />
                <YAxis stroke="#606070" fontSize={12} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                <Tooltip {...chartTooltipStyle} formatter={(value: number) => formatCurrency(value)} />
                <Area type="monotone" dataKey="net" stroke="#10b981" strokeWidth={2} fill="url(#netGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  }

  function renderCustomersTab() {
    if (!customerData) return <p className="text-[#606070] text-center py-8">No customer data available</p>;
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="stat-card">
            <p className="text-sm text-[#9090a0]">Total Customers</p>
            <p className="text-2xl font-bold text-[#3b82f6]">{customerData.summary.totalCustomers}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-[#9090a0]">Active Customers</p>
            <p className="text-2xl font-bold text-[#10b981]">{customerData.summary.activeCustomers}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-[#9090a0]">Total Revenue from Customers</p>
            <p className="text-2xl font-bold text-[#d4a843]">
              {formatCurrency(customerData.summary.totalRevenueFromCustomers)}
            </p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-[#9090a0]">Total Loyalty Points</p>
            <p className="text-2xl font-bold text-[#8b5cf6]">
              {customerData.summary.totalLoyaltyPoints.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-[#f0f0f5]">Customer Growth</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={customerData.customerGrowth}>
                <defs>
                  <linearGradient id="customerGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
                <XAxis dataKey="name" stroke="#606070" fontSize={12} />
                <YAxis stroke="#606070" fontSize={12} />
                <Tooltip {...chartTooltipStyle} />
                <Area type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} fill="url(#customerGrad)" name="New Customers" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-[#f0f0f5]">Top Customers</h3>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Email</th>
                  <th>Orders</th>
                  <th>Total Spent</th>
                  <th>Loyalty Points</th>
                </tr>
              </thead>
              <tbody>
                {customerData.topCustomers.map((c) => (
                  <tr key={c.id}>
                    <td className="font-medium text-[#f0f0f5]">{c.name}</td>
                    <td className="text-[#9090a0]">{c.email || "-"}</td>
                    <td className="text-[#9090a0]">{c.orderCount}</td>
                    <td className="font-medium text-[#d4a843]">{formatCurrency(c.totalSpent)}</td>
                    <td className="text-[#8b5cf6]">{c.loyaltyPoints.toLocaleString()}</td>
                  </tr>
                ))}
                {customerData.topCustomers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-[#606070]">No customer data</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout role="OWNER" title="Reports & Analytics">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                    activeTab === tab.key
                      ? "bg-gradient-to-r from-[#d4a843]/20 to-[#d4a843]/5 text-[#d4a843] border border-[#d4a843]/30"
                      : "border border-[#2a2a3a] bg-[#1c1c28] text-[#9090a0] hover:text-[#f0f0f5]"
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input w-auto"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input w-auto"
            />
            <button onClick={fetchReport} className="btn btn-secondary btn-sm">
              <RefreshCw size={14} />
            </button>
            <div className="relative">
              <button onClick={() => setShowExportMenu(!showExportMenu)} className="btn btn-secondary btn-sm">
                <Download size={14} />
                Export
                <ChevronDown size={12} />
              </button>
              {showExportMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                  <div className="absolute right-0 z-50 mt-2 w-44 rounded-xl border border-[#2a2a3a] bg-[#1c1c28] py-1 shadow-lg">
                    <button onClick={() => handleExportCSV(activeTab)} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[#f0f0f5] hover:bg-[#2a2a3a]">
                      Export as CSV
                    </button>
                    <button onClick={() => handleExportPDF(activeTab)} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[#f0f0f5] hover:bg-[#2a2a3a]">
                      Export as PDF
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex h-[40vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4a843] border-t-transparent" />
          </div>
        ) : (
          <>
            {activeTab === "sales" && renderSalesTab()}
            {activeTab === "inventory" && renderInventoryTab()}
            {activeTab === "financial" && renderFinancialTab()}
            {activeTab === "customers" && renderCustomersTab()}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
