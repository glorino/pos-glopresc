"use client";

import Link from "next/link";
import {
  Home,
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  CreditCard,
  Settings,
  FileText,
  Truck,
  ClipboardList,
  Shield,
  Bell,
  ChevronLeft,
  ChevronRight,
  Store,
  Building2,
} from "lucide-react";
import { useTranslation } from "@/contexts/LanguageContext";
import type { TranslationKey } from "@/lib/translations";

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

interface NavItem {
  icon: React.ElementType;
  label: TranslationKey;
  href: string;
}

interface NavSection {
  title?: TranslationKey;
  items: NavItem[];
}

const roleNavConfig: Record<UserRole, NavSection[]> = {
  OWNER: [
    {
      items: [
        { icon: Home, label: "home", href: "/" },
        { icon: LayoutDashboard, label: "dashboard", href: "/dashboard/owner" },
        { icon: Store, label: "shop", href: "/shop" },
      ],
    },
    {
      title: "management",
      items: [
        { icon: BarChart3, label: "reports", href: "/dashboard/owner/reports" },
        { icon: Shield, label: "users", href: "/dashboard/owner/users" },
        { icon: Building2, label: "branches", href: "/dashboard/owner/branches" },
        { icon: Settings, label: "settings", href: "/dashboard/owner/settings" },
      ],
    },
  ],
  MANAGER: [
    {
      items: [
        { icon: Home, label: "home", href: "/" },
        { icon: LayoutDashboard, label: "dashboard", href: "/dashboard/manager" },
        { icon: Store, label: "shop", href: "/shop" },
      ],
    },
    {
      title: "operations",
      items: [
        { icon: ShoppingCart, label: "sales", href: "/dashboard/sales-manager/sales" },
        { icon: Package, label: "inventory", href: "/dashboard/inventory" },
        { icon: Truck, label: "procurement", href: "/dashboard/procurement" },
      ],
    },
    {
      title: "finance",
      items: [
        { icon: BarChart3, label: "reports", href: "/dashboard/owner/reports" },
      ],
    },
  ],
  WAREHOUSE_MANAGER: [
    {
      items: [
        { icon: Home, label: "home", href: "/" },
        { icon: LayoutDashboard, label: "dashboard", href: "/dashboard/inventory" },
      ],
    },
    {
      title: "warehouse",
      items: [
        { icon: Package, label: "products", href: "/dashboard/inventory/products" },
        { icon: ClipboardList, label: "stock", href: "/dashboard/inventory/stock" },
        { icon: FileText, label: "categories", href: "/dashboard/inventory/categories" },
      ],
    },
  ],
  WAREHOUSE_REP: [
    {
      items: [
        { icon: Home, label: "home", href: "/" },
        { icon: LayoutDashboard, label: "dashboard", href: "/dashboard/inventory" },
      ],
    },
    {
      title: "warehouse",
      items: [
        { icon: Package, label: "products", href: "/dashboard/inventory/products" },
        { icon: ClipboardList, label: "stockAdjustments", href: "/dashboard/inventory/stock" },
      ],
    },
  ],
  PROCUREMENT_MANAGER: [
    {
      items: [
        { icon: Home, label: "home", href: "/" },
        { icon: LayoutDashboard, label: "dashboard", href: "/dashboard/procurement" },
      ],
    },
    {
      title: "procurement",
      items: [
        { icon: Truck, label: "suppliers", href: "/dashboard/procurement" },
        { icon: ClipboardList, label: "purchaseOrders", href: "/dashboard/procurement" },
      ],
    },
    {
      title: "finance",
      items: [
        { icon: BarChart3, label: "reports", href: "/dashboard/owner/reports" },
      ],
    },
  ],
  PROCUREMENT_REP: [
    {
      items: [
        { icon: Home, label: "home", href: "/" },
        { icon: LayoutDashboard, label: "dashboard", href: "/dashboard/procurement" },
      ],
    },
    {
      title: "procurement",
      items: [
        { icon: Truck, label: "suppliers", href: "/dashboard/procurement" },
        { icon: ClipboardList, label: "stockRequests", href: "/dashboard/procurement" },
      ],
    },
  ],
  SALES_MANAGER: [
    {
      items: [
        { icon: Home, label: "home", href: "/" },
        { icon: LayoutDashboard, label: "dashboard", href: "/dashboard/sales-manager" },
      ],
    },
    {
      title: "sales",
      items: [
        { icon: ShoppingCart, label: "sales", href: "/dashboard/sales-manager/sales" },
        { icon: Package, label: "products", href: "/dashboard/sales-manager/products" },
        { icon: Users, label: "customers", href: "/dashboard/sales-manager/customers" },
      ],
    },
  ],
  SALES_REP: [
    {
      items: [
        { icon: Home, label: "home", href: "/" },
        { icon: LayoutDashboard, label: "dashboard", href: "/dashboard/cashier" },
      ],
    },
    {
      title: "sales",
      items: [
        { icon: ShoppingCart, label: "pos", href: "/dashboard/cashier/pos" },
        { icon: ClipboardList, label: "mySales", href: "/dashboard/sales-manager/sales" },
        { icon: Users, label: "customers", href: "/dashboard/sales-manager/customers" },
      ],
    },
  ],
  ACCOUNTANT: [
    {
      items: [
        { icon: Home, label: "home", href: "/" },
        { icon: LayoutDashboard, label: "dashboard", href: "/dashboard/accounting" },
      ],
    },
    {
      title: "finance",
      items: [
        { icon: CreditCard, label: "expenses", href: "/dashboard/accounting/expenses" },
        { icon: FileText, label: "invoices", href: "/dashboard/accounting/invoices" },
      ],
    },
  ],
  AUDITOR: [
    {
      items: [
        { icon: Home, label: "home", href: "/" },
        { icon: LayoutDashboard, label: "dashboard", href: "/dashboard/auditor" },
      ],
    },
  ],
  CUSTOMER: [
    {
      items: [
        { icon: Home, label: "home", href: "/" },
        { icon: LayoutDashboard, label: "dashboard", href: "/dashboard/customer" },
      ],
    },
  ],
};

interface SidebarProps {
  role: UserRole;
  currentPath: string;
}

export default function Sidebar({ role, currentPath }: SidebarProps) {
  const { t } = useTranslation();
  const sections = roleNavConfig[role] || roleNavConfig.SALES_REP;

  return (
    <aside className="sidebar flex flex-col" id="sidebar">
      <div className="flex h-16 items-center gap-2 border-b border-[#2a2a3a] px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#d4a843] to-[#c49a38]">
          <span className="text-sm font-bold text-black">G</span>
        </div>
        <span className="text-lg font-bold text-[#f0f0f5]">SSV Shop</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {sections.map((section, si) => (
          <div key={si} className="sidebar-section">
            {section.title && (
              <div className="sidebar-section-title">{t(section.title)}</div>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sidebar-link ${isActive ? "active" : ""}`}
                  >
                    <Icon size={18} />
                    <span>{t(item.label)}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
