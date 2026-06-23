"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { formatCurrency, formatDateTime, formatDate } from "@/lib/utils";
import {
  ShoppingCart,
  DollarSign,
  Star,
  Calendar,
  Store,
  Clock,
  History,
  Edit3,
  RefreshCw,
  ArrowRight,
} from "lucide-react";

interface CustomerProfile {
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    loyaltyPoints: number;
    totalSpent: number;
    createdAt: string;
  };
  orders: {
    id: string;
    invoiceNumber: string;
    total: number;
    status: string;
    paymentMethod: string;
    createdAt: string;
    items: {
      id: string;
      quantity: number;
      unitPrice: number;
      product: { name: string };
    }[];
  }[];
  bookings: {
    id: string;
    bookingNumber: string;
    serviceType: string;
    date: string;
    time: string;
    status: string;
    totalAmount: number | null;
  }[];
  stats: {
    totalOrders: number;
    totalSpent: number;
    loyaltyPoints: number;
    activeBookings: number;
  };
}

export default function CustomerDashboard() {
  const [data, setData] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch("/api/customer/profile");
      if (res.ok) {
        const json = await res.json();
        setData(json);
        if (json.customer) {
          setProfileForm({
            firstName: json.customer.firstName,
            lastName: json.customer.lastName,
            email: json.customer.email ?? "",
            phone: json.customer.phone ?? "",
            address: json.customer.address ?? "",
            city: json.customer.city ?? "",
            state: json.customer.state ?? "",
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleProfileUpdate() {
    try {
      const res = await fetch("/api/customer/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });
      if (res.ok) {
        setEditing(false);
        fetchData();
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
    }
  }

  const stats = [
    {
      label: "My Orders",
      value: data?.stats?.totalOrders ?? 0,
      icon: ShoppingCart,
      color: "from-[#d4a843]/20 to-[#d4a843]/5",
      iconColor: "text-[#d4a843]",
    },
    {
      label: "Total Spent",
      value: formatCurrency(data?.stats?.totalSpent ?? 0),
      icon: DollarSign,
      color: "from-[#3b82f6]/20 to-[#3b82f6]/5",
      iconColor: "text-[#3b82f6]",
    },
    {
      label: "Loyalty Points",
      value: (data?.stats?.loyaltyPoints ?? 0).toLocaleString(),
      icon: Star,
      color: "from-[#8b5cf6]/20 to-[#8b5cf6]/5",
      iconColor: "text-[#8b5cf6]",
    },
    {
      label: "Active Bookings",
      value: data?.stats?.activeBookings ?? 0,
      icon: Calendar,
      color: "from-[#10b981]/20 to-[#10b981]/5",
      iconColor: "text-[#10b981]",
    },
  ];

  const quickActions = [
    { label: "Browse Shop", href: "/shop", icon: Store },
    { label: "Make Booking", href: "/booking", icon: Calendar },
    { label: "View History", href: "/dashboard/customer", icon: History },
    { label: "Edit Profile", href: "#", icon: Edit3, onClick: () => setEditing(true) },
  ];

  const orders = data?.orders ?? [];
  const bookings = data?.bookings ?? [];

  return (
    <DashboardLayout role="CUSTOMER" title="My Account">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="stat-card">
                <div className="flex items-start justify-between">
                  <div className={`stat-icon bg-gradient-to-br ${stat.color}`}>
                    <Icon size={20} className={stat.iconColor} />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-bold text-[#f0f0f5]">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-[#9090a0]">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="glass-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-[#f0f0f5]">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return action.onClick ? (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  className="flex items-center gap-3 rounded-xl border border-[#2a2a3a] bg-[#1c1c28] p-3 transition-all hover:border-[#d4a843]/30 hover:bg-[#1c1c28]/80"
                >
                  <Icon size={18} className="text-[#d4a843]" />
                  <span className="text-sm font-medium text-[#f0f0f5]">{action.label}</span>
                </button>
              ) : (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-3 rounded-xl border border-[#2a2a3a] bg-[#1c1c28] p-3 transition-all hover:border-[#d4a843]/30 hover:bg-[#1c1c28]/80"
                >
                  <Icon size={18} className="text-[#d4a843]" />
                  <span className="text-sm font-medium text-[#f0f0f5]">{action.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4a843] border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {/* Recent Orders */}
            <div className="glass-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-base font-semibold text-[#f0f0f5]">My Recent Orders</h4>
                <Link href="/dashboard/customer" className="text-xs text-[#d4a843] hover:underline">
                  View All
                </Link>
              </div>
              <div className="space-y-3">
                {orders.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-xl border border-[#2a2a3a] bg-[#1c1c28] p-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-xs font-medium text-[#f0f0f5]">
                          {order.invoiceNumber}
                        </p>
                        <span className={`badge ${
                          order.status === "COMPLETED" ? "badge-success"
                          : order.status === "PENDING" ? "badge-warning"
                          : order.status === "RETURNED" ? "badge-info"
                          : "badge-danger"
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#606070]">
                        {formatDateTime(order.createdAt)} · {order.items.length} item(s)
                      </p>
                    </div>
                    <p className="font-semibold text-[#d4a843]">
                      {formatCurrency(order.total)}
                    </p>
                  </div>
                ))}
                {orders.length === 0 && (
                  <p className="text-center text-sm text-[#606070] py-4">No orders yet</p>
                )}
              </div>
            </div>

            {/* Bookings */}
            <div className="glass-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-base font-semibold text-[#f0f0f5]">My Bookings</h4>
                <Link href="/booking" className="text-xs text-[#d4a843] hover:underline">
                  View All
                </Link>
              </div>
              <div className="space-y-3">
                {bookings.slice(0, 5).map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between rounded-xl border border-[#2a2a3a] bg-[#1c1c28] p-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-xs font-medium text-[#f0f0f5]">
                          {booking.bookingNumber}
                        </p>
                        <span className={`badge ${
                          booking.status === "CONFIRMED" ? "badge-success"
                          : booking.status === "PENDING" ? "badge-warning"
                          : booking.status === "COMPLETED" ? "badge-info"
                          : booking.status === "CANCELLED"
                          ? "badge-danger"
                          : "badge-purple"
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#606070]">
                        {booking.serviceType} · {formatDate(booking.date)} at {booking.time}
                      </p>
                    </div>
                    {booking.totalAmount && (
                      <p className="font-semibold text-[#d4a843]">
                        {formatCurrency(booking.totalAmount)}
                      </p>
                    )}
                  </div>
                ))}
                {bookings.length === 0 && (
                  <p className="text-center text-sm text-[#606070] py-4">No bookings yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Profile Edit Section */}
        <div className="glass-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-base font-semibold text-[#f0f0f5]">Profile Information</h4>
            <button
              onClick={() => setEditing(!editing)}
              className="btn btn-secondary btn-sm"
            >
              <Edit3 size={14} />
              {editing ? "Cancel" : "Edit"}
            </button>
          </div>

          {editing ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-[#9090a0]">First Name</label>
                <input
                  type="text"
                  value={profileForm.firstName}
                  onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#9090a0]">Last Name</label>
                <input
                  type="text"
                  value={profileForm.lastName}
                  onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#9090a0]">Email</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#9090a0]">Phone</label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#9090a0]">Address</label>
                <input
                  type="text"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#9090a0]">City</label>
                <input
                  type="text"
                  value={profileForm.city}
                  onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#9090a0]">State</label>
                <input
                  type="text"
                  value={profileForm.state}
                  onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                  className="input"
                />
              </div>
              <div className="flex items-end">
                <button onClick={handleProfileUpdate} className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-[#606070]">Name</p>
                <p className="font-medium text-[#f0f0f5]">
                  {data?.customer?.firstName} {data?.customer?.lastName}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#606070]">Email</p>
                <p className="font-medium text-[#f0f0f5]">{data?.customer?.email ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-[#606070]">Phone</p>
                <p className="font-medium text-[#f0f0f5]">{data?.customer?.phone ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-[#606070]">Address</p>
                <p className="font-medium text-[#f0f0f5]">
                  {data?.customer?.address ?? "—"}, {data?.customer?.city ?? ""}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
