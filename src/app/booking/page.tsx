"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  FileText,
  CheckCircle,
  ArrowRight,
  Loader2,
} from "lucide-react";

interface BookingForm {
  fullName: string;
  email: string;
  phone: string;
  serviceType: string;
  date: string;
  time: string;
  duration: string;
  description: string;
}

const SERVICE_TYPES = [
  "Consultation",
  "Meeting",
  "Support",
  "Training",
  "Other",
];

const DURATION_OPTIONS = [
  { value: "30", label: "30 minutes" },
  { value: "60", label: "1 hour" },
  { value: "120", label: "2 hours" },
  { value: "240", label: "Half day" },
  { value: "480", label: "Full day" },
];

const TIME_SLOTS = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
];

export default function BookingPage() {
  const router = useRouter();
  const [form, setForm] = useState<BookingForm>({
    fullName: "",
    email: "",
    phone: "",
    serviceType: "",
    date: "",
    time: "",
    duration: "60",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function updateField(field: keyof BookingForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!form.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = "Invalid email";
    if (!form.phone.trim()) newErrors.phone = "Phone number is required";
    if (!form.serviceType) newErrors.serviceType = "Service type is required";
    if (!form.date) newErrors.date = "Date is required";
    if (!form.time) newErrors.time = "Time is required";
    if (!form.duration) newErrors.duration = "Duration is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          serviceType: form.serviceType,
          date: form.date,
          time: form.time,
          duration: parseInt(form.duration),
          description: form.description,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Booking failed");
      }

      const data = await res.json();
      router.push(
        `/confirmation?booking=${data.bookingNumber}&service=${encodeURIComponent(form.serviceType)}&date=${form.date}&time=${form.time}`
      );
    } catch (error: any) {
      setErrors({ submit: error.message || "Failed to submit booking" });
    } finally {
      setSubmitting(false);
    }
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 border-b border-[#2a2a3a] bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#d4a843] to-[#b8942f]">
              <svg viewBox="0 0 64 64" fill="none" className="h-5 w-5">
                <path d="M16 24 L22 24 L28 40 L48 40 L52 26 L24 26" stroke="#000" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="30" cy="46" r="3" fill="#000"/>
                <circle cx="46" cy="46" r="3" fill="#000"/>
              </svg>
            </div>
            <span className="text-lg font-bold text-[#f0f0f5]">SSV Shop</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/shop" className="text-sm text-[#9090a0] hover:text-[#d4a843]">
              Shop
            </Link>
            <Link href="/booking" className="text-sm font-medium text-[#d4a843]">
              Book a Service
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="hero-gradient">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="text-3xl font-bold text-[#f0f0f5] sm:text-4xl">
            Book a{" "}
            <span className="bg-gradient-to-r from-[#d4a843] to-[#c49a38] bg-clip-text text-transparent">
              Service
            </span>
          </h1>
          <p className="mt-4 text-[#9090a0]">
            Schedule a consultation, meeting, or training session with our team.
            Choose your preferred date and time.
          </p>
        </div>
      </div>

      {/* Booking Form */}
      <div className="mx-auto max-w-2xl px-4 pb-20">
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.submit && (
            <div className="rounded-xl border border-[#f43f5e]/30 bg-[#f43f5e]/10 px-4 py-3 text-sm text-[#f43f5e]">
              {errors.submit}
            </div>
          )}

          {/* Personal Info */}
          <div className="rounded-2xl border border-[#2a2a3a] bg-[#111118] p-6">
            <h3 className="mb-4 text-lg font-semibold text-[#f0f0f5]">Personal Information</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[#9090a0]">Full Name *</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606070]" />
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                    placeholder="Enter your full name"
                    className={`input pl-10 ${errors.fullName ? "border-[#f43f5e]" : ""}`}
                  />
                </div>
                {errors.fullName && <p className="mt-1 text-xs text-[#f43f5e]">{errors.fullName}</p>}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#9090a0]">Email *</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606070]" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      placeholder="you@email.com"
                      className={`input pl-10 ${errors.email ? "border-[#f43f5e]" : ""}`}
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-xs text-[#f43f5e]">{errors.email}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#9090a0]">Phone *</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606070]" />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      placeholder="+234 xxx xxx xxxx"
                      className={`input pl-10 ${errors.phone ? "border-[#f43f5e]" : ""}`}
                    />
                  </div>
                  {errors.phone && <p className="mt-1 text-xs text-[#f43f5e]">{errors.phone}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Service Details */}
          <div className="rounded-2xl border border-[#2a2a3a] bg-[#111118] p-6">
            <h3 className="mb-4 text-lg font-semibold text-[#f0f0f5]">Service Details</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[#9090a0]">Service Type *</label>
                <select
                  value={form.serviceType}
                  onChange={(e) => updateField("serviceType", e.target.value)}
                  className={`input select ${errors.serviceType ? "border-[#f43f5e]" : ""}`}
                >
                  <option value="">Select a service</option>
                  {SERVICE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {errors.serviceType && <p className="mt-1 text-xs text-[#f43f5e]">{errors.serviceType}</p>}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#9090a0]">Date *</label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606070]" />
                    <input
                      type="date"
                      min={today}
                      value={form.date}
                      onChange={(e) => updateField("date", e.target.value)}
                      className={`input pl-10 ${errors.date ? "border-[#f43f5e]" : ""}`}
                    />
                  </div>
                  {errors.date && <p className="mt-1 text-xs text-[#f43f5e]">{errors.date}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#9090a0]">Duration *</label>
                  <select
                    value={form.duration}
                    onChange={(e) => updateField("duration", e.target.value)}
                    className={`input select ${errors.duration ? "border-[#f43f5e]" : ""}`}
                  >
                    {DURATION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#9090a0]">Preferred Time *</label>
                <div className="relative">
                  <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606070]" />
                  <select
                    value={form.time}
                    onChange={(e) => updateField("time", e.target.value)}
                    className={`input select pl-10 ${errors.time ? "border-[#f43f5e]" : ""}`}
                  >
                    <option value="">Select a time</option>
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.time && <p className="mt-1 text-xs text-[#f43f5e]">{errors.time}</p>}
              </div>

              {/* Available Time Slots */}
              <div>
                <p className="mb-2 text-sm font-medium text-[#9090a0]">Available Time Slots</p>
                <div className="flex flex-wrap gap-2">
                  {TIME_SLOTS.filter((_, i) => i % 2 === 0).map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => updateField("time", slot)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                        form.time === slot
                          ? "border-[#d4a843]/30 bg-[#d4a843]/10 text-[#d4a843]"
                          : "border-[#2a2a3a] bg-[#1c1c28] text-[#9090a0] hover:border-[#3a3a4a]"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#9090a0]">Notes / Description</label>
                <div className="relative">
                  <FileText size={16} className="absolute left-3 top-3 text-[#606070]" />
                  <textarea
                    value={form.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="Any additional details or requirements..."
                    rows={4}
                    className="input resize-none pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary flex w-full items-center justify-center gap-2 py-3 text-base font-bold"
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Book Now
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#2a2a3a] bg-[#111118] py-8">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <p className="text-xs text-[#606070]">
            &copy; {new Date().getFullYear()} SSV Shop. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
