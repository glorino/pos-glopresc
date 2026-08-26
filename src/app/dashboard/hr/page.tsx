"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { formatDate } from "@/lib/utils";
import { useTranslation } from "@/contexts/LanguageContext";
import {
  Users,
  Calendar,
  Clock,
  Briefcase,
  CheckCircle,
  XCircle,
  ArrowRight,
  TrendingUp,
  Download,
  UserCheck,
  FileText,
} from "lucide-react";

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: string;
  joinDate: string;
}

interface Attendance {
  id: string;
  userId: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  status: string;
  user?: { name: string };
}

interface LeaveRequest {
  id: string;
  employeeName: string;
  type: string;
  startDate: string;
  endDate: string;
  status: string;
  days: number;
}

export default function HRDashboard() {
  const router = useRouter();
  const { t } = useTranslation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [empRes, attRes, leaveRes] = await Promise.all([
          fetch("/api/users"),
          fetch("/api/attendance"),
          fetch("/api/leave-requests"),
        ]);
        if (empRes.ok) {
          const empData = await empRes.json();
          setEmployees(Array.isArray(empData) ? empData : empData.users ?? []);
        }
        if (attRes.ok) {
          const attData = await attRes.json();
          setAttendance(Array.isArray(attData) ? attData : attData.attendance ?? []);
        }
        if (leaveRes.ok) {
          const leaveData = await leaveRes.json();
          const mapped = (Array.isArray(leaveData) ? leaveData : []).map((l: Record<string, unknown>) => ({
            id: l.id as string,
            employeeName: (l.user as Record<string, string>)?.firstName
              ? `${(l.user as Record<string, string>).firstName} ${(l.user as Record<string, string>).lastName}`
              : "Unknown",
            type: l.type as string,
            startDate: l.startDate as string,
            endDate: l.endDate as string,
            status: l.status as string,
            days: Math.max(1, Math.round((new Date(l.endDate as string).getTime() - new Date(l.startDate as string).getTime()) / 86400000)),
          }));
          setLeaveRequests(mapped);
        }
      } catch (error) {
        console.error("Failed to fetch HR data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const totalEmployees = employees.length;
  const pendingLeave = leaveRequests.filter((r) => r.status === "PENDING").length;
  const activeAttendance = attendance.filter((a) => a.clockIn && !a.clockOut).length;
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayAttendance = attendance.filter((a) => a.date === todayStr);
  const presentCount = todayAttendance.filter((a) => a.status === "PRESENT" || a.clockIn).length;
  const absentCount = todayAttendance.length - presentCount;

  const exportToCSV = () => {
    const rows = employees.map((e) => [e.name, e.email, e.role, e.department, e.status, e.joinDate].join(","));
    const csv = "Name,Email,Role,Department,Status,Join Date\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "employees.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <DashboardLayout title="HR Manager Dashboard">
        <div className="flex h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4a843] border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  const stats = [
    {
      label: "Total Employees",
      value: totalEmployees.toLocaleString(),
      icon: Users,
      gradient: "from-[#d4a843] to-[#b8942f]",
      bgGradient: "from-[#d4a843]/15 via-[#d4a843]/5 to-transparent",
      iconColor: "text-[#d4a843]",
    },
    {
      label: "Pending Leave",
      value: pendingLeave.toLocaleString(),
      icon: Calendar,
      gradient: "from-[#f59e0b] to-[#d97706]",
      bgGradient: "from-[#f59e0b]/15 via-[#f59e0b]/5 to-transparent",
      iconColor: "text-[#f59e0b]",
    },
    {
      label: "Active Attendance",
      value: activeAttendance.toLocaleString(),
      icon: Clock,
      gradient: "from-[#3b82f6] to-[#2563eb]",
      bgGradient: "from-[#3b82f6]/15 via-[#3b82f6]/5 to-transparent",
      iconColor: "text-[#3b82f6]",
    },
    {
      label: "Upcoming Reviews",
      value: "4",
      icon: Briefcase,
      gradient: "from-[#8b5cf6] to-[#7c3aed]",
      bgGradient: "from-[#8b5cf6]/15 via-[#8b5cf6]/5 to-transparent",
      iconColor: "text-[#8b5cf6]",
    },
  ];

  const quickActions = [
    { label: "View Employees", action: () => router.push("/dashboard/owner/users"), icon: Users, color: "text-[#d4a843]" },
    { label: "Manage Leave", action: () => document.getElementById("leave-section")?.scrollIntoView({ behavior: "smooth" }), icon: Calendar, color: "text-[#f59e0b]" },
    { label: "View Attendance", action: () => document.getElementById("attendance-section")?.scrollIntoView({ behavior: "smooth" }), icon: Clock, color: "text-[#3b82f6]" },
  ];

  return (
    <DashboardLayout title="HR Manager Dashboard">
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
                  className="group flex flex-col items-center gap-2 rounded-xl border border-[#2a2a3a] bg-[#1c1c28]/50 p-4 transition-all duration-200 hover:border-[#d4a843]/30 hover:bg-[#1c1c28] hover:shadow-lg"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2a2a3a]/50 transition-all group-hover:bg-[#2a2a3a]">
                    <Icon size={20} className={action.color} />
                  </div>
                  <span className="text-xs font-medium text-[#f0f0f5]">{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {/* Recent Leave Requests */}
          <div id="leave-section" className="glass-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#f0f0f5]">Recent Leave Requests</h3>
              <button
                onClick={() => document.getElementById("leave-section")?.scrollIntoView({ behavior: "smooth" })}
                className="flex items-center gap-1 text-sm text-[#d4a843] hover:text-[#b8942f]"
              >
                View All <ArrowRight size={14} />
              </button>
            </div>
            <div className="space-y-3">
              {leaveRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between rounded-xl border border-[#2a2a3a] bg-[#1c1c28]/50 p-3 transition-all hover:bg-[#1c1c28]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2a2a3a]/50">
                      {request.status === "APPROVED" ? (
                        <CheckCircle size={14} className="text-[#10b981]" />
                      ) : request.status === "PENDING" ? (
                        <Clock size={14} className="text-[#f59e0b]" />
                      ) : (
                        <XCircle size={14} className="text-[#f43f5e]" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#f0f0f5]">{request.employeeName}</p>
                      <p className="text-xs text-[#606070]">{request.type} &middot; {request.days} day{request.days !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        request.status === "APPROVED"
                          ? "bg-[#10b981]/15 text-[#10b981]"
                          : request.status === "PENDING"
                          ? "bg-[#f59e0b]/15 text-[#f59e0b]"
                          : "bg-[#f43f5e]/15 text-[#f43f5e]"
                      }`}
                    >
                      {request.status}
                    </span>
                    <p className="mt-1 text-xs text-[#606070]">{request.startDate}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Attendance Overview */}
          <div id="attendance-section" className="glass-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#f0f0f5]">Today&apos;s Attendance</h3>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-1 rounded-lg border border-[#2a2a3a] bg-[#1c1c28]/50 px-3 py-1.5 text-xs font-medium text-[#9090a0] transition-all hover:border-[#d4a843]/30 hover:text-[#f0f0f5]"
              >
                <Download size={12} /> Export
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="rounded-xl border border-[#10b981]/20 bg-[#10b981]/5 p-4 text-center">
                <p className="text-2xl font-bold text-[#10b981]">{presentCount}</p>
                <p className="text-sm text-[#9090a0]">Present</p>
              </div>
              <div className="rounded-xl border border-[#f43f5e]/20 bg-[#f43f5e]/5 p-4 text-center">
                <p className="text-2xl font-bold text-[#f43f5e]">{absentCount}</p>
                <p className="text-sm text-[#9090a0]">Absent</p>
              </div>
            </div>
            <div className="space-y-2">
              {todayAttendance.slice(0, 5).map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between rounded-lg border border-[#2a2a3a] bg-[#1c1c28]/50 p-3"
                >
                  <div className="flex items-center gap-3">
                    <UserCheck size={14} className="text-[#3b82f6]" />
                    <span className="text-sm text-[#f0f0f5]">{record.user?.name ?? record.userId}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#606070]">
                    <span>In: {record.clockIn ? new Date(record.clockIn).toLocaleTimeString() : "--"}</span>
                    <span>Out: {record.clockOut ? new Date(record.clockOut).toLocaleTimeString() : "--"}</span>
                  </div>
                </div>
              ))}
              {todayAttendance.length === 0 && (
                <p className="text-center text-sm text-[#606070]">No attendance records for today</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
