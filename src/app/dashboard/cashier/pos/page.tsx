"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import POSTerminal from "@/components/pos/POSTerminal";

export default function POSPage() {
  return (
    <DashboardLayout role="SALES_REP" title="POS Terminal">
      <div className="h-[calc(100vh-64px)] -m-4 sm:-m-6">
        <POSTerminal />
      </div>
    </DashboardLayout>
  );
}
