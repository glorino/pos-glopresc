"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { useTranslation } from "@/contexts/LanguageContext";
import CashDrawerReport from "@/components/ai/CashDrawerReport";

export default function CashReportsPage() {
  const { t } = useTranslation();
  return (
    <DashboardLayout role="ACCOUNTANT" title={t("cashDrawerReports")}>
      <CashDrawerReport />
    </DashboardLayout>
  );
}
