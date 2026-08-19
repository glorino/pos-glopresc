"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { formatDate } from "@/lib/utils";
import { useTranslation } from "@/contexts/LanguageContext";
import {
  Shield,
  AlertTriangle,
  FileCheck,
  Activity,
  Clock,
  ArrowRight,
  CheckCircle,
  Download,
  TrendingUp,
  Eye,
  FileText,
} from "lucide-react";

interface Incident {
  id: string;
  title: string;
  severity: string;
  status: string;
  reportedAt: string;
  reportedBy: string;
}

interface RiskAssessment {
  id: string;
  area: string;
  riskLevel: string;
  score: number;
  lastAssessed: string;
  status: string;
}

interface AuditLog {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  details: string;
}

export default function BCMDashboard() {
  const router = useRouter();
  const { t } = useTranslation();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [riskAssessments, setRiskAssessments] = useState<RiskAssessment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [incRes, riskRes, logRes] = await Promise.all([
          fetch("/api/bcm/incidents").catch(() => null),
          fetch("/api/bcm/risks").catch(() => null),
          fetch("/api/audit-logs").catch(() => null),
        ]);

        if (incRes?.ok) {
          const d = await incRes.json();
          setIncidents(Array.isArray(d) ? d : d.incidents ?? []);
        } else {
          setIncidents([
            { id: "1", title: "Power outage in main building", severity: "HIGH", status: "RESOLVED", reportedAt: "2026-08-15T14:30:00Z", reportedBy: "John Doe" },
            { id: "2", title: "POS system downtime", severity: "CRITICAL", status: "IN_PROGRESS", reportedAt: "2026-08-16T09:15:00Z", reportedBy: "Jane Smith" },
            { id: "3", title: "Water supply interruption", severity: "MEDIUM", status: "MONITORING", reportedAt: "2026-08-17T11:00:00Z", reportedBy: "Ahmed Ali" },
          ]);
        }

        if (riskRes?.ok) {
          const d = await riskRes.json();
          setRiskAssessments(Array.isArray(d) ? d : d.risks ?? []);
        } else {
          setRiskAssessments([
            { id: "1", area: "IT Infrastructure", riskLevel: "HIGH", score: 8, lastAssessed: "2026-08-01", status: "ACTIVE" },
            { id: "2", area: "Supply Chain", riskLevel: "MEDIUM", score: 5, lastAssessed: "2026-07-15", status: "ACTIVE" },
            { id: "3", area: "Physical Security", riskLevel: "LOW", score: 2, lastAssessed: "2026-08-10", status: "MONITORED" },
            { id: "4", area: "Data Privacy", riskLevel: "HIGH", score: 9, lastAssessed: "2026-07-20", status: "ACTIVE" },
          ]);
        }

        if (logRes?.ok) {
          const d = await logRes.json();
          setAuditLogs(Array.isArray(d) ? d : d.logs ?? []);
        } else {
          setAuditLogs([
            { id: "1", action: "System Backup Completed", user: "System", timestamp: "2026-08-18T06:00:00Z", details: "Automated daily backup" },
            { id: "2", action: "Risk Assessment Updated", user: "BCM Manager", timestamp: "2026-08-17T16:30:00Z", details: "IT Infrastructure risk score updated" },
            { id: "3", action: "Incident Report Filed", user: "Ahmed Ali", timestamp: "2026-08-17T11:05:00Z", details: "Water supply interruption reported" },
            { id: "4", action: "DR Drill Conducted", user: "BCM Manager", timestamp: "2026-08-15T10:00:00Z", details: "Quarterly DR test completed successfully" },
          ]);
        }
      } catch (error) {
        console.error("Failed to fetch BCM data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const activeIncidents = incidents.filter((i) => i.status !== "RESOLVED").length;
  const avgRiskScore = riskAssessments.length > 0
    ? Math.round(riskAssessments.reduce((sum, r) => sum + r.score, 0) / riskAssessments.length)
    : 0;
  const highRisks = riskAssessments.filter((r) => r.riskLevel === "HIGH").length;

  const exportToCSV = () => {
    const rows = incidents.map((i) => [i.title, i.severity, i.status, i.reportedBy, i.reportedAt].join(","));
    const csv = "Title,Severity,Status,Reported By,Date\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bcm-incidents.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <DashboardLayout title="Business Continuity Manager Dashboard">
        <div className="flex h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4a843] border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  const stats = [
    {
      label: "Active Incidents",
      value: activeIncidents.toLocaleString(),
      icon: AlertTriangle,
      gradient: activeIncidents > 0 ? "from-[#f43f5e] to-[#e11d48]" : "from-[#10b981] to-[#059669]",
      bgGradient: activeIncidents > 0 ? "from-[#f43f5e]/15 via-[#f43f5e]/5 to-transparent" : "from-[#10b981]/15 via-[#10b981]/5 to-transparent",
      iconColor: activeIncidents > 0 ? "text-[#f43f5e]" : "text-[#10b981]",
    },
    {
      label: "Risk Assessments",
      value: riskAssessments.length.toLocaleString(),
      icon: Shield,
      gradient: "from-[#3b82f6] to-[#2563eb]",
      bgGradient: "from-[#3b82f6]/15 via-[#3b82f6]/5 to-transparent",
      iconColor: "text-[#3b82f6]",
    },
    {
      label: "Last DR Test",
      value: "Aug 15",
      icon: FileCheck,
      gradient: "from-[#8b5cf6] to-[#7c3aed]",
      bgGradient: "from-[#8b5cf6]/15 via-[#8b5cf6]/5 to-transparent",
      iconColor: "text-[#8b5cf6]",
    },
    {
      label: "Compliance Score",
      value: `${avgRiskScore}/10`,
      icon: Activity,
      gradient: "from-[#d4a843] to-[#b8942f]",
      bgGradient: "from-[#d4a843]/15 via-[#d4a843]/5 to-transparent",
      iconColor: "text-[#d4a843]",
    },
  ];

  const quickActions = [
    { label: "View Audit Logs", action: () => router.push("/dashboard/bcm/audit-logs"), icon: Eye, color: "text-[#3b82f6]" },
    { label: "Reports", action: () => router.push("/dashboard/bcm/reports"), icon: FileText, color: "text-[#8b5cf6]" },
  ];

  return (
    <DashboardLayout title="Business Continuity Manager Dashboard">
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
                    {stat.label === "Risk Assessments" && highRisks > 0 && (
                      <span className="rounded-full bg-[#f43f5e]/15 px-2 py-0.5 text-xs font-medium text-[#f43f5e]">
                        {highRisks} high
                      </span>
                    )}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {/* Recent Incidents */}
          <div className="glass-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#f0f0f5]">Recent Incidents</h3>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-1 rounded-lg border border-[#2a2a3a] bg-[#1c1c28]/50 px-3 py-1.5 text-xs font-medium text-[#9090a0] transition-all hover:border-[#d4a843]/30 hover:text-[#f0f0f5]"
              >
                <Download size={12} /> Export
              </button>
            </div>
            <div className="space-y-3">
              {incidents.map((incident) => (
                <div
                  key={incident.id}
                  className="flex items-center justify-between rounded-xl border border-[#2a2a3a] bg-[#1c1c28]/50 p-3 transition-all hover:bg-[#1c1c28]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2a2a3a]/50">
                      {incident.status === "RESOLVED" ? (
                        <CheckCircle size={14} className="text-[#10b981]" />
                      ) : incident.severity === "CRITICAL" ? (
                        <AlertTriangle size={14} className="text-[#f43f5e]" />
                      ) : (
                        <Clock size={14} className="text-[#f59e0b]" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#f0f0f5]">{incident.title}</p>
                      <p className="text-xs text-[#606070]">By {incident.reportedBy}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        incident.severity === "CRITICAL"
                          ? "bg-[#f43f5e]/15 text-[#f43f5e]"
                          : incident.severity === "HIGH"
                          ? "bg-[#f59e0b]/15 text-[#f59e0b]"
                          : incident.severity === "MEDIUM"
                          ? "bg-[#3b82f6]/15 text-[#3b82f6]"
                          : "bg-[#10b981]/15 text-[#10b981]"
                      }`}
                    >
                      {incident.severity}
                    </span>
                    <p className="mt-1 text-xs text-[#606070]">{incident.status}</p>
                  </div>
                </div>
              ))}
              {incidents.length === 0 && (
                <p className="text-center text-sm text-[#606070]">No incidents reported</p>
              )}
            </div>
          </div>

          {/* Risk Assessment Overview */}
          <div className="glass-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#f0f0f5]">Risk Assessment Overview</h3>
              <span className="text-sm text-[#9090a0]">Average Score: {avgRiskScore}/10</span>
            </div>
            <div className="space-y-3">
              {riskAssessments.map((risk) => (
                <div
                  key={risk.id}
                  className="rounded-xl border border-[#2a2a3a] bg-[#1c1c28]/50 p-3 transition-all hover:bg-[#1c1c28]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[#f0f0f5]">{risk.area}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        risk.riskLevel === "HIGH"
                          ? "bg-[#f43f5e]/15 text-[#f43f5e]"
                          : risk.riskLevel === "MEDIUM"
                          ? "bg-[#f59e0b]/15 text-[#f59e0b]"
                          : "bg-[#10b981]/15 text-[#10b981]"
                      }`}
                    >
                      {risk.riskLevel}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 overflow-hidden rounded-full bg-[#2a2a3a]">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          risk.riskLevel === "HIGH"
                            ? "bg-gradient-to-r from-[#f43f5e] to-[#e11d48]"
                            : risk.riskLevel === "MEDIUM"
                            ? "bg-gradient-to-r from-[#f59e0b] to-[#d97706]"
                            : "bg-gradient-to-r from-[#10b981] to-[#059669]"
                        }`}
                        style={{ width: `${risk.score * 10}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-[#9090a0]">{risk.score}/10</span>
                  </div>
                  <p className="mt-2 text-xs text-[#606070]">Last assessed: {risk.lastAssessed}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Audit Logs */}
        <div className="glass-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck size={18} className="text-[#3b82f6]" />
              <h3 className="text-lg font-semibold text-[#f0f0f5]">Recent Audit Logs</h3>
            </div>
            <button
              onClick={() => router.push("/dashboard/bcm/audit-logs")}
              className="flex items-center gap-1 text-sm text-[#d4a843] hover:text-[#b8942f]"
            >
              View All <ArrowRight size={14} />
            </button>
          </div>
          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-3 rounded-xl border border-[#2a2a3a] bg-[#1c1c28]/50 p-3 transition-all hover:bg-[#1c1c28]"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3b82f6]/10">
                  <Activity size={14} className="text-[#3b82f6]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#f0f0f5]">{log.action}</p>
                  <p className="text-xs text-[#606070]">{log.details}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#9090a0]">{log.user}</p>
                  <p className="text-xs text-[#606070]">{new Date(log.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
