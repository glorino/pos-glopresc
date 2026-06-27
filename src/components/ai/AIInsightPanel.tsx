"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Brain, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Lightbulb, BarChart3, X } from "lucide-react";
import type { AIInsight } from "@/lib/ai-insights";

interface AIInsightPanelProps {
  insights: AIInsight[];
  loading?: string;
}

const typeConfig: Record<string, { icon: React.ElementType; gradient: string; borderColor: string }> = {
  trend: { icon: TrendingUp, gradient: "from-[#3b82f6]/20 to-[#3b82f6]/5", borderColor: "border-[#3b82f6]/20" },
  alert: { icon: AlertTriangle, gradient: "from-[#f43f5e]/20 to-[#f43f5e]/5", borderColor: "border-[#f43f5e]/20" },
  opportunity: { icon: Lightbulb, gradient: "from-[#d4a843]/20 to-[#d4a843]/5", borderColor: "border-[#d4a843]/20" },
  performance: { icon: CheckCircle, gradient: "from-[#10b981]/20 to-[#10b981]/5", borderColor: "border-[#10b981]/20" },
  forecast: { icon: BarChart3, gradient: "from-[#8b5cf6]/20 to-[#8b5cf6]/5", borderColor: "border-[#8b5cf6]/20" },
  summary: { icon: Brain, gradient: "from-[#06b6d4]/20 to-[#06b6d4]/5", borderColor: "border-[#06b6d4]/20" },
};

const severityColors: Record<string, string> = {
  info: "text-[#06b6d4]",
  success: "text-[#10b981]",
  warning: "text-[#d4a843]",
  critical: "text-[#f43f5e]",
};

function InsightCard({ insight }: { insight: AIInsight }) {
  const config = typeConfig[insight.type] || typeConfig.summary;
  const Icon = config.icon;

  return (
    <div className={`glass-card border ${config.borderColor} bg-gradient-to-br ${config.gradient} p-4`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1c1c28] ${severityColors[insight.severity]}`}>
          <Icon size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-[#f0f0f5]">{insight.title}</h4>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
              insight.severity === "critical" ? "bg-[#f43f5e]/20 text-[#f43f5e]" :
              insight.severity === "warning" ? "bg-[#d4a843]/20 text-[#d4a843]" :
              insight.severity === "success" ? "bg-[#10b981]/20 text-[#10b981]" :
              "bg-[#06b6d4]/20 text-[#06b6d4]"
            }`}>
              {insight.severity}
            </span>
          </div>
          <p className="mt-1 text-xs text-[#9090a0] leading-relaxed">{insight.description}</p>
          {insight.metric && (
            <div className="mt-2 flex items-center gap-3">
              <span className="text-lg font-bold text-[#f0f0f5]">{insight.metric.value}</span>
              <span className="text-xs text-[#606070]">{insight.metric.label}</span>
              {insight.metric.change && (
                <span className={`text-xs font-medium ${
                  insight.metric.change.startsWith("+") ? "text-[#10b981]" : "text-[#f43f5e]"
                }`}>
                  {insight.metric.change}
                </span>
              )}
            </div>
          )}
          {insight.action && (
            <Link href={insight.action.href} className="mt-2 inline-block text-xs font-medium text-[#d4a843] hover:underline">
              {insight.action.label} →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AIInsightPanel({ insights, loading }: AIInsightPanelProps) {
  return (
    <div className="glass-card border border-[#8b5cf6]/20 bg-gradient-to-br from-[#8b5cf6]/10 to-[#8b5cf6]/5 p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9]">
          <Brain size={20} className="text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[#f0f0f5]">AI Business Insights</h3>
          <p className="text-xs text-[#9090a0]">Smart analysis of your business data</p>
        </div>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#8b5cf6] border-t-transparent" />
        </div>
      ) : insights.length === 0 ? (
        <p className="text-center text-sm text-[#606070]">No insights available yet.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {insights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}
    </div>
  );
}
