"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useTranslation } from "@/contexts/LanguageContext";
import {
  TrendingUp,
  Zap,
  Target,
  BarChart3,
  Clock,
  ArrowRight,
  Download,
  CheckCircle,
  FileText,
  Activity,
} from "lucide-react";

interface KPI {
  id: string;
  name: string;
  target: number;
  current: number;
  unit: string;
  status: string;
  trend: string;
}

interface EfficiencyReport {
  id: string;
  title: string;
  score: number;
  date: string;
  category: string;
  status: string;
}

interface ProcessImprovement {
  id: string;
  process: string;
  description: string;
  status: string;
  impact: string;
  date: string;
}

export default function BEMDashboard() {
  const router = useRouter();
  const { t } = useTranslation();
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [reports, setReports] = useState<EfficiencyReport[]>([]);
  const [improvements, setImprovements] = useState<ProcessImprovement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [kpiRes, repRes, impRes] = await Promise.all([
          fetch("/api/bem/kpis").catch(() => null),
          fetch("/api/bem/reports").catch(() => null),
          fetch("/api/bem/improvements").catch(() => null),
        ]);

        if (kpiRes?.ok) {
          const d = await kpiRes.json();
          setKpis(Array.isArray(d) ? d : d.kpis ?? []);
        } else {
          setKpis([
            { id: "1", name: "Sales Conversion Rate", target: 75, current: 68, unit: "%", status: "ON_TRACK", trend: "+3.2%" },
            { id: "2", name: "Average Service Time", target: 5, current: 7, unit: "min", status: "BELOW_TARGET", trend: "-0.5min" },
            { id: "3", name: "Customer Satisfaction", target: 90, current: 92, unit: "%", status: "EXCEEDED", trend: "+1.8%" },
            { id: "4", name: "Inventory Turnover", target: 12, current: 10, unit: "x/yr", status: "ON_TRACK", trend: "+0.3x" },
            { id: "5", name: "Staff Productivity", target: 85, current: 82, unit: "%", status: "ON_TRACK", trend: "+2.1%" },
            { id: "6", name: "Waste Reduction", target: 5, current: 4.2, unit: "%", status: "EXCEEDED", trend: "-0.8%" },
          ]);
        }

        if (repRes?.ok) {
          const d = await repRes.json();
          setReports(Array.isArray(d) ? d : d.reports ?? []);
        } else {
          setReports([
            { id: "1", title: "Q2 Efficiency Report", score: 87, date: "2026-07-01", category: "Operations", status: "COMPLETED" },
            { id: "2", title: "Kitchen Workflow Analysis", score: 82, date: "2026-08-01", category: "Kitchen", status: "COMPLETED" },
            { id: "3", title: "Customer Flow Optimization", score: 78, date: "2026-08-10", category: "Front of House", status: "IN_PROGRESS" },
            { id: "4", title: "Inventory Management Review", score: 91, date: "2026-08-15", category: "Inventory", status: "COMPLETED" },
          ]);
        }

        if (impRes?.ok) {
          const d = await impRes.json();
          setImprovements(Array.isArray(d) ? d : d.improvements ?? []);
        } else {
          setImprovements([
            { id: "1", process: "Order Processing", description: "Implemented digital order tracking system", status: "IMPLEMENTED", impact: "15% faster order completion", date: "2026-07-20" },
            { id: "2", process: "Stock Management", description: "Automated low-stock alerts with supplier integration", status: "IN_PROGRESS", impact: "Expected 20% reduction in stockouts", date: "2026-08-05" },
            { id: "3", process: "Customer Feedback", description: "Real-time feedback collection via QR codes", status: "IMPLEMENTED", impact: "25% increase in feedback responses", date: "2026-08-12" },
          ]);
        }
      } catch (error) {
        console.error("Failed to fetch BEM data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const activeKPIs = kpis.length;
  const completedImprovements = improvements.filter((i) => i.status === "IMPLEMENTED").length;
  const avgScore = kpis.length > 0
    ? Math.round(kpis.reduce((sum, k) => sum + (k.current / k.target) * 100, 0) / kpis.length)
    : 0;
  const pendingReviews = kpis.filter((k) => k.status === "BELOW_TARGET").length;

  const exportToCSV = () => {
    const rows = kpis.map((k) => [k.name, k.target, k.current, k.unit, k.status, k.trend].join(","));
    const csv = "KPI,Target,Current,Unit,Status,Trend\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bem-kpis.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <DashboardLayout title="Business Efficiency Manager Dashboard">
        <div className="flex h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4a843] border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  const stats = [
    {
      label: "Active KPIs",
      value: activeKPIs.toLocaleString(),
      icon: Target,
      gradient: "from-[#d4a843] to-[#b8942f]",
      bgGradient: "from-[#d4a843]/15 via-[#d4a843]/5 to-transparent",
      iconColor: "text-[#d4a843]",
    },
    {
      label: "Process Improvements",
      value: completedImprovements.toLocaleString(),
      icon: Zap,
      gradient: "from-[#8b5cf6] to-[#7c3aed]",
      bgGradient: "from-[#8b5cf6]/15 via-[#8b5cf6]/5 to-transparent",
      iconColor: "text-[#8b5cf6]",
    },
    {
      label: "Efficiency Score",
      value: `${avgScore}%`,
      icon: TrendingUp,
      gradient: "from-[#10b981] to-[#059669]",
      bgGradient: "from-[#10b981]/15 via-[#10b981]/5 to-transparent",
      iconColor: "text-[#10b981]",
    },
    {
      label: "Pending Reviews",
      value: pendingReviews.toLocaleString(),
      icon: Clock,
      gradient: "from-[#f59e0b] to-[#d97706]",
      bgGradient: "from-[#f59e0b]/15 via-[#f59e0b]/5 to-transparent",
      iconColor: "text-[#f59e0b]",
    },
  ];

  const quickActions = [
    { label: "Reports", action: () => document.getElementById("reports-section")?.scrollIntoView({ behavior: "smooth" }), icon: FileText, color: "text-[#3b82f6]" },
    { label: "Sales", action: () => router.push("/dashboard/owner/reports"), icon: BarChart3, color: "text-[#d4a843]" },
    { label: "Inventory", action: () => router.push("/dashboard/inventory/stock"), icon: TrendingUp, color: "text-[#10b981]" },
  ];

  return (
    <DashboardLayout title="Business Efficiency Manager Dashboard">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="glass-card group relative overflow-hidden p-5 transition-all duration-300 hover:scale-[1.02]"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
                <div className="relative">
                  <div className="flex items-start justify-between">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                      <Icon size={18} className="text-white" />
                    </div>
                  </div>
                  <p className="mt-3 text-2xl font-bold text-[#f0f0f5]">{stat.value}</p>
                  <p className="mt-1 text-sm text-[#9090a0]">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="glass-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-[#f0f0f5]">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={action.action}
                  className="group flex items-center justify-between rounded-xl border border-[#2a2a3a] bg-[#1c1c28]/50 p-4 transition-all duration-200 hover:border-[#d4a843]/30 hover:bg-[#1c1c28] hover:shadow-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2a2a3a]/50 transition-all group-hover:bg-[#2a2a3a]">
                      <Icon size={20} className={action.color} />
                    </div>
                    <span className="text-sm font-medium text-[#f0f0f5]">{action.label}</span>
                  </div>
                  <ArrowRight size={14} className="text-[#606070]" />
                </button>
              );
            })}
          </div>
        </div>

        {/* KPI Tracking */}
        <div className="glass-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[#f0f0f5]">KPI Tracking</h3>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-1 rounded-lg border border-[#2a2a3a] bg-[#1c1c28]/50 px-3 py-1.5 text-xs font-medium text-[#9090a0] transition-all hover:border-[#d4a843]/30 hover:text-[#f0f0f5]"
            >
              <Download size={12} /> Export
            </button>
          </div>
          <div className="space-y-3">
            {kpis.map((kpi) => {
              const progress = Math.min(Math.round((kpi.current / kpi.target) * 100), 100);
              return (
                <div
                  key={kpi.id}
                  className="rounded-xl border border-[#2a2a3a] bg-[#1c1c28]/50 p-4 transition-all hover:bg-[#1c1c28]"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-[#f0f0f5]">{kpi.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#606070]">
                        {kpi.current} / {kpi.target} {kpi.unit}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          kpi.status === "EXCEEDED"
                            ? "bg-[#10b981]/15 text-[#10b981]"
                            : kpi.status === "ON_TRACK"
                            ? "bg-[#3b82f6]/15 text-[#3b82f6]"
                            : "bg-[#f43f5e]/15 text-[#f43f5e]"
                        }`}
                      >
                        {kpi.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 overflow-hidden rounded-full bg-[#2a2a3a]">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          kpi.status === "EXCEEDED"
                            ? "bg-gradient-to-r from-[#10b981] to-[#059669]"
                            : kpi.status === "ON_TRACK"
                            ? "bg-gradient-to-r from-[#3b82f6] to-[#2563eb]"
                            : "bg-gradient-to-r from-[#f43f5e] to-[#e11d48]"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-[#9090a0]">{progress}%</span>
                    <span className={`text-xs font-medium ${
                      kpi.trend.startsWith("+") ? "text-[#10b981]" : kpi.trend.startsWith("-") && !kpi.unit.includes("min") ? "text-[#f43f5e]" : "text-[#10b981]"
                    }`}>
                      {kpi.trend}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {/* Recent Efficiency Reports */}
          <div id="reports-section" className="glass-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#f0f0f5]">Recent Efficiency Reports</h3>
              <button
                onClick={() => router.push("/dashboard/bem")}
                className="flex items-center gap-1 text-sm text-[#d4a843] hover:text-[#b8942f]"
              >
                View All <ArrowRight size={14} />
              </button>
            </div>
            <div className="space-y-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between rounded-xl border border-[#2a2a3a] bg-[#1c1c28]/50 p-3 transition-all hover:bg-[#1c1c28]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3b82f6]/10">
                      <FileText size={14} className="text-[#3b82f6]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#f0f0f5]">{report.title}</p>
                      <p className="text-xs text-[#606070]">{report.category} &middot; {report.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-[#d4a843]">{report.score}%</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        report.status === "COMPLETED"
                          ? "bg-[#10b981]/15 text-[#10b981]"
                          : "bg-[#f59e0b]/15 text-[#f59e0b]"
                      }`}
                    >
                      {report.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Process Improvements */}
          <div className="glass-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#f0f0f5]">Process Improvements</h3>
            </div>
            <div className="space-y-3">
              {improvements.map((improvement) => (
                <div
                  key={improvement.id}
                  className="rounded-xl border border-[#2a2a3a] bg-[#1c1c28]/50 p-4 transition-all hover:bg-[#1c1c28]"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap size={14} className="text-[#8b5cf6]" />
                      <span className="text-sm font-medium text-[#f0f0f5]">{improvement.process}</span>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        improvement.status === "IMPLEMENTED"
                          ? "bg-[#10b981]/15 text-[#10b981]"
                          : "bg-[#f59e0b]/15 text-[#f59e0b]"
                      }`}
                    >
                      {improvement.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#9090a0] mb-2">{improvement.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-[#10b981]">
                      <TrendingUp size={12} />
                      <span>{improvement.impact}</span>
                    </div>
                    <span className="text-xs text-[#606070]">{improvement.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
