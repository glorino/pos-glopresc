"use client";

import Link from "next/link";
import {
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
} from "lucide-react";

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
  label: string;
  href: string;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const roleNavConfig: Record<UserRole, NavSection[]> = {
  OWNER: [
    {
      items: [
        { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard/owner" },
        { icon: Store, label: "Shop", href: "/shop" },
      ],
    },
    {
      title: "Management",
      items: [
        { icon: BarChart3, label: "Reports", href: "/dashboard/owner/reports" },
        { icon: Shield, label: "Users", href: "/dashboard/owner/users" },
        { icon: Settings, label: "Settings", href: "/dashboard/owner/settings" },
      ],
    },
  ],
  MANAGER: [
    {
      items: [
        { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard/manager" },
        { icon: Store, label: "Shop", href: "/shop" },
      ],
    },
    {
      title: "Operations",
      items: [
        { icon: ShoppingCart, label: "Sales", href: "/dashboard/sales-manager/sales" },
        { icon: Package, label: "Inventory", href: "/dashboard/inventory" },
        { icon: Truck, label: "Procurement", href: "/dashboard/procurement" },
      ],
    },
    {
      title: "Finance",
      items: [
        { icon: BarChart3, label: "Reports", href: "/dashboard/owner/reports" },
      ],
    },
  ],
  WAREHOUSE_MANAGER: [
    {
      items: [
        { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard/inventory" },
      ],
    },
    {
      title: "Warehouse",
      items: [
        { icon: Package, label: "Products", href: "/dashboard/inventory/products" },
        { icon: ClipboardList, label: "Stock", href: "/dashboard/inventory/stock" },
        { icon: FileText, label: "Categories", href: "/dashboard/inventory/categories" },
      ],
    },
  ],
  WAREHOUSE_REP: [
    {
      items: [
        { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard/inventory" },
      ],
    },
    {
      title: "Warehouse",
      items: [
        { icon: Package, label: "Products", href: "/dashboard/inventory/products" },
        { icon: ClipboardList, label: "Stock Adjustments", href: "/dashboard/inventory/stock" },
      ],
    },
  ],
  PROCUREMENT_MANAGER: [
    {
      items: [
        { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard/procurement" },
      ],
    },
    {
      title: "Procurement",
      items: [
        { icon: Truck, label: "Suppliers", href: "/dashboard/procurement" },
        { icon: ClipboardList, label: "Purchase Orders", href: "/dashboard/procurement" },
      ],
    },
    {
      title: "Finance",
      items: [
        { icon: BarChart3, label: "Reports", href: "/dashboard/owner/reports" },
      ],
    },
  ],
  PROCUREMENT_REP: [
    {
      items: [
        { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard/procurement" },
      ],
    },
    {
      title: "Procurement",
      items: [
        { icon: Truck, label: "Suppliers", href: "/dashboard/procurement" },
        { icon: ClipboardList, label: "Stock Requests", href: "/dashboard/procurement" },
      ],
    },
  ],
  SALES_MANAGER: [
    {
      items: [
        { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard/sales-manager" },
      ],
    },
    {
      title: "Sales",
      items: [
        { icon: ShoppingCart, label: "Sales", href: "/dashboard/sales-manager/sales" },
        { icon: Package, label: "Products", href: "/dashboard/sales-manager/products" },
        { icon: Users, label: "Customers", href: "/dashboard/sales-manager/customers" },
      ],
    },
  ],
  SALES_REP: [
    {
      items: [
        { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard/cashier" },
      ],
    },
    {
      title: "Sales",
      items: [
        { icon: ShoppingCart, label: "POS Terminal", href: "/dashboard/cashier/pos" },
        { icon: ClipboardList, label: "My Sales", href: "/dashboard/sales-manager/sales" },
        { icon: Users, label: "Customers", href: "/dashboard/sales-manager/customers" },
      ],
    },
  ],
  ACCOUNTANT: [
    {
      items: [
        { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard/accounting" },
      ],
    },
    {
      title: "Finance",
      items: [
        { icon: CreditCard, label: "Expenses", href: "/dashboard/accounting/expenses" },
        { icon: FileText, label: "Invoices", href: "/dashboard/accounting/invoices" },
      ],
    },
  ],
  AUDITOR: [
    {
      items: [
        { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard/auditor" },
      ],
    },
  ],
  CUSTOMER: [
    {
      items: [
        { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard/customer" },
      ],
    },
  ],
};

interface SidebarProps {
  role: UserRole;
  currentPath: string;
}

export default function Sidebar({ role, currentPath }: SidebarProps) {
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
              <div className="sidebar-section-title">{section.title}</div>
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
                    <span>{item.label}</span>
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
