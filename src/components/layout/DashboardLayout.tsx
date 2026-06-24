"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import AIChatbot from "@/components/ui/AIChatbot";

type UserRole =
  | "OWNER"
  | "MANAGER"
  | "WAREHOUSE_MANAGER"
  | "WAREHOUSE_REP"
  | "PROCUREMENT_MANAGER"
  | "PROCUREMENT_REP"
  | "SALES_MANAGER"
  | "SALES_REP"
  | "ACCOUNTANT"
  | "AUDITOR"
  | "CUSTOMER";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  role?: UserRole;
}

export default function DashboardLayout({
  children,
  title,
  role: roleProp,
}: DashboardLayoutProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sessionRole = (session?.user as any)?.role as UserRole | undefined;
  const role: UserRole = sessionRole || roleProp || "OWNER";

  const userName = session?.user?.name || "User";
  const userRole = role.replace(/_/g, " ");
  const userEmail = session?.user?.email || "user@ssvshop.com";

  const displayUser = {
    name: userName,
    role: userRole,
    email: userEmail,
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
        className={`fixed inset-y-0 left-0 z-40 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform lg:sticky lg:transition-none`}
      >
        <Sidebar role={role} currentPath={pathname} />
      </div>

      <div className="flex flex-1 flex-col lg:pl-[260px]">
        <Topbar title={title} user={displayUser} onMenuToggle={() => setSidebarOpen((p) => !p)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>

      <AIChatbot />
    </div>
  );
}
