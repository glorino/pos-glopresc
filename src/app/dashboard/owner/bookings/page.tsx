"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { formatCurrency } from "@/lib/utils";
import { useTranslation } from "@/contexts/LanguageContext";
import Pagination from "@/components/ui/Pagination";
import {
  Calendar,
  Clock,
  Edit2,
  Trash2,
  Search,
  Plus,
  X,
  CheckCircle,
} from "lucide-react";

interface Booking {
  id: string;
  bookingNumber: string;
  customerId: string;
  customer?: { id: string; firstName: string; lastName: string } | null;
  serviceType: string;
  description: string | null;
  date: string;
  time: string;
  duration: number;
  status: string;
  notes: string | null;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "#f59e0b" },
  CONFIRMED: { label: "Confirmed", color: "#3b82f6" },
  IN_PROGRESS: { label: "In Progress", color: "#8b5cf6" },
  COMPLETED: { label: "Completed", color: "#10b981" },
  CANCELLED: { label: "Cancelled", color: "#f43f5e" },
};

const ITEMS_PER_PAGE = 10;

export default function BookingsPage() {
  const { t } = useTranslation();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [formData, setFormData] = useState({
    status: "PENDING",
    notes: "",
    totalAmount: 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  async function fetchBookings() {
    setLoading(true);
    try {
      const res = await fetch("/api/bookings");
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || data);
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      !search ||
      b.bookingNumber.toLowerCase().includes(search.toLowerCase()) ||
      b.serviceType.toLowerCase().includes(search.toLowerCase()) ||
      (b.customer &&
        `${b.customer.firstName} ${b.customer.lastName}`
          .toLowerCase()
          .includes(search.toLowerCase()));
    const matchesStatus = !statusFilter || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  function openEditModal(booking: Booking) {
    setEditingBooking(booking);
    setFormData({
      status: booking.status,
      notes: booking.notes || "",
      totalAmount: booking.totalAmount,
    });
    setError("");
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingBooking) return;
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/bookings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingBooking.id,
          status: formData.status,
          notes: formData.notes || null,
          totalAmount: formData.totalAmount,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update booking");
      }
      setShowModal(false);
      fetchBookings();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch("/api/bookings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setDeleteConfirm(null);
        fetchBookings();
      }
    } catch (error) {
      console.error("Failed to delete booking:", error);
    }
  }

  function formatDateTime(date: string, time: string) {
    const d = new Date(date);
    return `${d.toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })} ${time}`;
  }

  return (
    <DashboardLayout title="Bookings">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 sm:w-72">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606070]" />
              <input
                type="text"
                placeholder="Search bookings..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input select w-auto"
            >
              <option value="">All Statuses</option>
              {Object.entries(statusConfig).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-sm text-[#9090a0]">
            <Calendar size={16} />
            <span>{filteredBookings.length} bookings found</span>
          </div>
        </div>

        {loading ? (
          <div className="flex h-[40vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4a843] border-t-transparent" />
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Booking #</th>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Date/Time</th>
                  <th>Duration (min)</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="font-medium text-[#f0f0f5]">
                      {booking.bookingNumber}
                    </td>
                    <td className="text-[#9090a0]">
                      {booking.customer
                        ? `${booking.customer.firstName} ${booking.customer.lastName}`
                        : "—"}
                    </td>
                    <td>
                      <span className="badge badge-info">
                        {booking.serviceType}
                      </span>
                    </td>
                    <td className="text-[#9090a0]">
                      {formatDateTime(booking.date, booking.time)}
                    </td>
                    <td className="text-[#9090a0]">{booking.duration}</td>
                    <td>
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: `${statusConfig[booking.status]?.color}20`,
                          color: statusConfig[booking.status]?.color,
                        }}
                      >
                        {booking.status === "COMPLETED" && <CheckCircle size={12} />}
                        {statusConfig[booking.status]?.label || booking.status}
                      </span>
                    </td>
                    <td className="text-[#9090a0]">
                      {formatCurrency(booking.totalAmount)}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(booking)}
                          className="rounded-lg p-2 text-[#9090a0] hover:bg-[#2a2a3a] hover:text-[#3b82f6]"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(booking.id)}
                          className="rounded-lg p-2 text-[#9090a0] hover:bg-[#2a2a3a] hover:text-[#f43f5e]"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedBookings.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center text-[#606070]">
                      No bookings found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {showModal && editingBooking && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="glass-card w-full max-w-lg p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#f0f0f5]">
                Edit Booking — {editingBooking.bookingNumber}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-[#606070] hover:text-[#f0f0f5]">
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-[#f43f5e]/20 bg-[#f43f5e]/10 p-3 text-sm text-[#f43f5e]">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-[#9090a0]">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="input select"
                >
                  {Object.entries(statusConfig).map(([key, val]) => (
                    <option key={key} value={key}>
                      {val.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm text-[#9090a0]">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input min-h-[80px] resize-y"
                  placeholder="Add notes..."
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-[#9090a0]">Total Amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.totalAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, totalAmount: parseFloat(e.target.value) || 0 })
                  }
                  className="input"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? "Saving..." : "Update Booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="glass-card w-full max-w-md p-6">
            <h2 className="mb-4 text-xl font-semibold text-[#f0f0f5]">Delete Booking</h2>
            <p className="mb-6 text-[#9090a0]">
              Are you sure you want to delete this booking? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="btn bg-[#f43f5e] text-white hover:bg-[#e11d48]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
