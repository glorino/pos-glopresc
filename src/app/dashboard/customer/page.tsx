"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { formatCurrency, formatDateTime, formatDate } from "@/lib/utils";
import { useTranslation } from "@/contexts/LanguageContext";
import {
  ShoppingCart,
  DollarSign,
  Star,
  Calendar,
  Store,
  Clock,
  Edit3,
  RefreshCw,
  ArrowRight,
  MessageSquare,
  Package,
  CheckCircle,
  RotateCcw,
  TrendingUp,
  ChevronRight,
  Filter,
  BadgeCheck,
} from "lucide-react";

type OrderStatus = "ALL" | "COMPLETED" | "PENDING" | "REFUNDED";

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

const LOYALTY_TIERS = [
  { name: "Bronze", min: 0, max: 499, color: "text-amber-600", bg: "bg-amber-900/30" },
  { name: "Silver", min: 500, max: 1999, color: "text-gray-300", bg: "bg-gray-500/20" },
  { name: "Gold", min: 2000, max: 4999, color: "text-[#d4a843]", bg: "bg-[#d4a843]/20" },
  { name: "Platinum", min: 5000, max: Infinity, color: "text-purple-400", bg: "bg-purple-500/20" },
];

function getLoyaltyTier(points: number) {
  return LOYALTY_TIERS.find((t) => points >= t.min && points <= t.max) ?? LOYALTY_TIERS[0];
}

function getNextTier(points: number) {
  const idx = LOYALTY_TIERS.findIndex((t) => points >= t.min && points <= t.max);
  return idx < LOYALTY_TIERS.length - 1 ? LOYALTY_TIERS[idx + 1] : null;
}

export default function CustomerDashboard() {
  const router = useRouter();
  const { t } = useTranslation();
  const ordersRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [orderFilter, setOrderFilter] = useState<OrderStatus>("ALL");
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

  function scrollToOrders() {
    ordersRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  const stats = [
    {
      label: t("totalOrders"),
      value: data?.stats?.totalOrders ?? 0,
      icon: ShoppingCart,
      color: "from-[#d4a843]/20 to-[#d4a843]/5",
      iconColor: "text-[#d4a843]",
    },
    {
      label: t("totalSpent"),
      value: formatCurrency(data?.stats?.totalSpent ?? 0),
      icon: DollarSign,
      color: "from-[#3b82f6]/20 to-[#3b82f6]/5",
      iconColor: "text-[#3b82f6]",
    },
    {
      label: t("loyaltyPointsLabel"),
      value: (data?.stats?.loyaltyPoints ?? 0).toLocaleString(),
      icon: Star,
      color: "from-[#8b5cf6]/20 to-[#8b5cf6]/5",
      iconColor: "text-[#8b5cf6]",
    },
    {
      label: t("activeBookingsLabel"),
      value: data?.stats?.activeBookings ?? 0,
      icon: Calendar,
      color: "from-[#10b981]/20 to-[#10b981]/5",
      iconColor: "text-[#10b981]",
    },
  ];

  const quickActions = [
    { label: t("browseShop"), icon: Store, action: () => router.push("/shop") },
    { label: t("trackOrders"), icon: Package, action: scrollToOrders },
    { label: t("updateProfile"), icon: Edit3, action: () => setEditing(true) },
    {
      label: t("contactSupport"),
      icon: MessageSquare,
      action: () => window.open("mailto:support@glopresc.com?subject=Customer%20Support%20Request", "_blank"),
    },
  ];

  const orders = data?.orders ?? [];
  const bookings = data?.bookings ?? [];

  const filteredOrders = orders.filter((order) => {
    if (orderFilter === "ALL") return true;
    return order.status === orderFilter;
  });

  const orderCounts = {
    ALL: orders.length,
    COMPLETED: orders.filter((o) => o.status === "COMPLETED").length,
    PENDING: orders.filter((o) => o.status === "PENDING").length,
    REFUNDED: orders.filter((o) => o.status === "RETURNED" || o.status === "REFUNDED").length,
  };

  const loyaltyPoints = data?.stats?.loyaltyPoints ?? 0;
  const currentTier = getLoyaltyTier(loyaltyPoints);
  const nextTier = getNextTier(loyaltyPoints);
  const tierProgress = nextTier
    ? ((loyaltyPoints - currentTier.min) / (nextTier.min - currentTier.min)) * 100
    : 100;

  const filterTabs: { key: OrderStatus; label: string; icon: typeof Package }[] = [
    { key: "ALL", label: t("all"), icon: Package },
    { key: "COMPLETED", label: t("completed"), icon: CheckCircle },
    { key: "PENDING", label: t("pending"), icon: Clock },
    { key: "REFUNDED", label: t("refunded"), icon: RotateCcw },
  ];

  const recentOrders = filteredOrders.slice(0, 5);

  return (
    <DashboardLayout role="CUSTOMER" title={t("myAccount")}>
      <div className="space-y-6">
        {/* Stats Row */}
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
          <h3 className="mb-4 text-lg font-semibold text-[#f0f0f5]">{t("quickActions")}</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={action.action}
                  className="flex items-center gap-3 rounded-xl border border-[#2a2a3a] bg-[#1c1c28] p-3 transition-all hover:border-[#d4a843]/30 hover:bg-[#1c1c28]/80 active:scale-[0.98]"
                >
                  <Icon size={18} className="text-[#d4a843]" />
                  <span className="text-sm font-medium text-[#f0f0f5]">{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Loyalty Points Progress */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#f0f0f5]">{t("loyaltyStatus")}</h3>
            <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${currentTier.bg} ${currentTier.color}`}>
              <BadgeCheck size={14} />
              {currentTier.name} {t("member")}
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#9090a0]">{loyaltyPoints.toLocaleString()} {t("points")}</span>
              {nextTier && (
                <span className="text-[#9090a0]">
                  {nextTier.min.toLocaleString()} {t("ptsTo")} {nextTier.name}
                </span>
              )}
              {!nextTier && (
                <span className="text-[#8b5cf6]">{t("maxTierReached")}</span>
              )}
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#1c1c28]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#d4a843] to-[#8b5cf6] transition-all duration-500"
                style={{ width: `${Math.min(tierProgress, 100)}%` }}
              />
            </div>
            <div className="flex justify-between">
              {LOYALTY_TIERS.map((tier) => (
                <span
                  key={tier.name}
                  className={`text-xs ${loyaltyPoints >= tier.min ? tier.color : "text-[#606070]"}`}
                >
                  {tier.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4a843] border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Order History with Filters */}
            <div ref={ordersRef} className="glass-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-base font-semibold text-[#f0f0f5]">{t("orderHistory")}</h4>
                <button onClick={fetchData} className="flex items-center gap-1 text-xs text-[#d4a843] hover:underline">
                  <RefreshCw size={12} />
                  {t("refresh")}
                </button>
              </div>

              {/* Filter Tabs */}
              <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
                {filterTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setOrderFilter(tab.key)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap ${
                        orderFilter === tab.key
                          ? "bg-[#d4a843]/20 text-[#d4a843] border border-[#d4a843]/30"
                          : "bg-[#1c1c28] text-[#9090a0] border border-[#2a2a3a] hover:border-[#3a3a4a]"
                      }`}
                    >
                      <Icon size={14} />
                      {tab.label}
                      <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] ${
                        orderFilter === tab.key ? "bg-[#d4a843]/30" : "bg-[#2a2a3a]"
                      }`}>
                        {orderCounts[tab.key]}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Order Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#2a2a3a] text-xs text-[#606070]">
                      <th className="pb-3 font-medium">{t("orderLabel")}</th>
                      <th className="pb-3 font-medium">{t("itemsLabel")}</th>
                      <th className="pb-3 font-medium">{t("total")}</th>
                      <th className="pb-3 font-medium">{t("status")}</th>
                      <th className="pb-3 font-medium">{t("date")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2a3a]/50">
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-[#1c1c28]/50 transition-colors">
                        <td className="py-3">
                          <p className="font-mono text-xs font-medium text-[#f0f0f5]">
                            {order.invoiceNumber}
                          </p>
                          <p className="mt-0.5 text-[10px] text-[#606070]">
                            {order.paymentMethod}
                          </p>
                        </td>
                        <td className="py-3">
                          <div className="flex flex-col gap-0.5">
                            {order.items.slice(0, 2).map((item) => (
                              <p key={item.id} className="text-xs text-[#9090a0]">
                                {item.quantity}x {item.product.name}
                              </p>
                            ))}
                            {order.items.length > 2 && (
                              <p className="text-[10px] text-[#606070]">
                                +{order.items.length - 2} {t("moreItems")}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 font-semibold text-[#d4a843]">
                          {formatCurrency(order.total)}
                        </td>
                        <td className="py-3">
                          <span
                            className={`badge ${
                              order.status === "COMPLETED"
                                ? "badge-success"
                                : order.status === "PENDING"
                                ? "badge-warning"
                                : order.status === "RETURNED"
                                ? "badge-info"
                                : "badge-danger"
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 text-xs text-[#9090a0]">
                          {formatDateTime(order.createdAt)}
                        </td>
                      </tr>
                    ))}
                    {recentOrders.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-sm text-[#606070]">
                          {t("noOrdersForFilter")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bookings Section */}
            <div className="glass-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-base font-semibold text-[#f0f0f5]">{t("bookingHistory")}</h4>
                <Link href="/booking" className="flex items-center gap-1 text-xs text-[#d4a843] hover:underline">
                  {t("newBooking")} <ChevronRight size={12} />
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
                        <span
                          className={`badge ${
                            booking.status === "CONFIRMED"
                              ? "badge-success"
                              : booking.status === "PENDING"
                              ? "badge-warning"
                              : booking.status === "COMPLETED"
                              ? "badge-info"
                              : booking.status === "CANCELLED"
                              ? "badge-danger"
                              : "badge-purple"
                          }`}
                        >
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
                  <div className="flex flex-col items-center py-6 text-center">
                    <Calendar size={32} className="mb-2 text-[#606070]" />
                    <p className="text-sm text-[#606070]">{t("noBookingsYet")}</p>
                    <Link href="/booking" className="mt-2 text-xs text-[#d4a843] hover:underline">
                      {t("makeFirstBooking")}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Profile Edit Section */}
        <div className="glass-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-base font-semibold text-[#f0f0f5]">{t("profileInformation")}</h4>
            <button
              onClick={() => setEditing(!editing)}
              className="btn btn-secondary btn-sm"
            >
              <Edit3 size={14} />
              {editing ? t("cancel") : t("edit")}
            </button>
          </div>

          {editing ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-[#9090a0]">{t("firstName")}</label>
                <input
                  type="text"
                  value={profileForm.firstName}
                  onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#9090a0]">{t("lastName")}</label>
                <input
                  type="text"
                  value={profileForm.lastName}
                  onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#9090a0]">{t("emailLabel")}</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#9090a0]">{t("phoneLabel")}</label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#9090a0]">{t("addressLabel")}</label>
                <input
                  type="text"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#9090a0]">{t("city")}</label>
                <input
                  type="text"
                  value={profileForm.city}
                  onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#9090a0]">{t("state")}</label>
                <input
                  type="text"
                  value={profileForm.state}
                  onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                  className="input"
                />
              </div>
              <div className="flex items-end">
                <button onClick={handleProfileUpdate} className="btn btn-primary">
                  {t("saveChanges")}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-[#606070]">{t("name")}</p>
                <p className="font-medium text-[#f0f0f5]">
                  {data?.customer?.firstName} {data?.customer?.lastName}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#606070]">{t("emailLabel")}</p>
                <p className="font-medium text-[#f0f0f5]">{data?.customer?.email ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-[#606070]">{t("phoneLabel")}</p>
                <p className="font-medium text-[#f0f0f5]">{data?.customer?.phone ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-[#606070]">{t("addressLabel")}</p>
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
