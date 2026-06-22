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
} from "lucide-react";

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
      ],
    },
    {
      title: "Operations",
      items: [
        { icon: ShoppingCart, label: "POS Terminal", href: "/dashboard/pos" },
        { icon: Package, label: "Products", href: "/dashboard/products" },
        { icon: Users, label: "Customers", href: "/dashboard/customers" },
        { icon: ClipboardList, label: "Orders", href: "/dashboard/orders" },
      ],
    },
    {
      title: "Finance",
      items: [
        { icon: BarChart3, label: "Reports", href: "/dashboard/reports" },
        { icon: CreditCard, label: "Expenses", href: "/dashboard/expenses" },
        { icon: FileText, label: "Invoices", href: "/dashboard/invoices" },
      ],
    },
    {
      title: "Management",
      items: [
        { icon: Truck, label: "Suppliers", href: "/dashboard/suppliers" },
        { icon: Shield, label: "Users", href: "/dashboard/users" },
        { icon: Bell, label: "Notifications", href: "/dashboard/notifications" },
        { icon: Settings, label: "Settings", href: "/dashboard/settings" },
      ],
    },
  ],
  MANAGER: [
    {
      items: [
        { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard/manager" },
      ],
    },
    {
      title: "Operations",
      items: [
        { icon: ShoppingCart, label: "POS Terminal", href: "/dashboard/pos" },
        { icon: Package, label: "Products", href: "/dashboard/products" },
        { icon: Users, label: "Customers", href: "/dashboard/customers" },
        { icon: ClipboardList, label: "Orders", href: "/dashboard/orders" },
      ],
    },
    {
      title: "Finance",
      items: [
        { icon: BarChart3, label: "Reports", href: "/dashboard/reports" },
        { icon: CreditCard, label: "Expenses", href: "/dashboard/expenses" },
      ],
    },
    {
      title: "Management",
      items: [
        { icon: Truck, label: "Suppliers", href: "/dashboard/suppliers" },
        { icon: Bell, label: "Notifications", href: "/dashboard/notifications" },
      ],
    },
  ],
  SALES_MANAGER: [
    {
      items: [
        { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard/sales" },
      ],
    },
    {
      items: [
        { icon: ShoppingCart, label: "POS Terminal", href: "/dashboard/pos" },
        { icon: Users, label: "Customers", href: "/dashboard/customers" },
        { icon: ClipboardList, label: "Orders", href: "/dashboard/orders" },
        { icon: BarChart3, label: "Sales Reports", href: "/dashboard/reports" },
        { icon: Bell, label: "Notifications", href: "/dashboard/notifications" },
      ],
    },
  ],
  CASHIER: [
    {
      items: [
        { icon: ShoppingCart, label: "POS Terminal", href: "/dashboard/pos" },
        { icon: ClipboardList, label: "My Sales", href: "/dashboard/my-sales" },
        { icon: Bell, label: "Notifications", href: "/dashboard/notifications" },
      ],
    },
  ],
  INVENTORY_MANAGER: [
    {
      items: [
        { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard/inventory" },
      ],
    },
    {
      items: [
        { icon: Package, label: "Products", href: "/dashboard/products" },
        { icon: Truck, label: "Suppliers", href: "/dashboard/suppliers" },
        { icon: ClipboardList, label: "Purchase Orders", href: "/dashboard/purchase-orders" },
        { icon: BarChart3, label: "Stock Reports", href: "/dashboard/stock-reports" },
        { icon: Bell, label: "Notifications", href: "/dashboard/notifications" },
      ],
    },
  ],
  PROCUREMENT: [
    {
      items: [
        { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard/procurement" },
      ],
    },
    {
      items: [
        { icon: Truck, label: "Suppliers", href: "/dashboard/suppliers" },
        { icon: ClipboardList, label: "Purchase Orders", href: "/dashboard/purchase-orders" },
        { icon: Package, label: "Products", href: "/dashboard/products" },
        { icon: Bell, label: "Notifications", href: "/dashboard/notifications" },
      ],
    },
  ],
  ACCOUNTANT: [
    {
      items: [
        { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard/accountant" },
      ],
    },
    {
      title: "Finance",
      items: [
        { icon: BarChart3, label: "Reports", href: "/dashboard/reports" },
        { icon: CreditCard, label: "Expenses", href: "/dashboard/expenses" },
        { icon: FileText, label: "Invoices", href: "/dashboard/invoices" },
        { icon: CreditCard, label: "Payments", href: "/dashboard/payments" },
        { icon: Bell, label: "Notifications", href: "/dashboard/notifications" },
      ],
    },
  ],
  AUDITOR: [
    {
      items: [
        { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard/auditor" },
      ],
    },
    {
      items: [
        { icon: BarChart3, label: "Reports", href: "/dashboard/reports" },
        { icon: Shield, label: "Audit Logs", href: "/dashboard/audit-logs" },
        { icon: FileText, label: "Invoices", href: "/dashboard/invoices" },
      ],
    },
  ],
  CUSTOMER: [
    {
      items: [
        { icon: LayoutDashboard, label: "My Account", href: "/dashboard/customer" },
      ],
    },
    {
      items: [
        { icon: ShoppingCart, label: "Browse Shop", href: "/shop" },
        { icon: ClipboardList, label: "My Orders", href: "/dashboard/customer" },
        { icon: Bell, label: "Notifications", href: "/dashboard/customer" },
      ],
    },
  ],
};

interface SidebarProps {
  role: UserRole;
  currentPath: string;
}

export default function Sidebar({ role, currentPath }: SidebarProps) {
  const sections = roleNavConfig[role] || roleNavConfig.CASHIER;

  return (
    <aside className="sidebar flex flex-col" id="sidebar">
      <div className="flex h-16 items-center gap-2 border-b border-[#2a2a3a] px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#d4a843] to-[#c49a38]">
          <span className="text-sm font-bold text-black">G</span>
        </div>
        <span className="text-lg font-bold text-[#f0f0f5]">Glopresc</span>
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
