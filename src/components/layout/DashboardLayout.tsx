"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import AIChatbot from "@/components/ui/AIChatbot";

type UserRole =
  | "OWNER"
  | "MANAGER"
  | "SALES_MANAGER"
  | "CASHIER"
  | "INVENTORY_MANAGER"
  | "PROCUREMENT"
  | "ACCOUNTANT"
  | "AUDITOR"
  | "CUSTOMER";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: UserRole;
  title: string;
  user?: {
    name: string;
    role: string;
    email: string;
  };
}

export default function DashboardLayout({
  children,
  role,
  title,
  user,
}: DashboardLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const displayUser = user || {
    name: "User",
    role: role.replace("_", " "),
    email: "user@ssvshop.com",
  };

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-[#0a0a0f]">
      <div
        className={`fixed inset-0 z-30 bg-black/50 transition-opacity lg:hidden ${
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      <div
        className={`lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform lg:transition-none`}
      >
        <Sidebar role={role} currentPath={pathname} />
      </div>

      <div className="flex flex-1 flex-col lg:pl-[260px]">
        <Topbar title={title} user={displayUser} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>

      <AIChatbot />
    </div>
  );
}
