"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  CheckCircle,
  Calendar,
  Clock,
  ArrowLeft,
  FileText,
  Hash,
  Mail,
  Phone,
} from "lucide-react";

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const bookingNumber = searchParams.get("booking") || "BK-00000000";
  const serviceType = searchParams.get("service") || "N/A";
  const date = searchParams.get("date") || "";
  const time = searchParams.get("time") || "";

  const formattedDate = date
    ? new Date(date + "T00:00:00").toLocaleDateString("en-NG", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

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
        </div>
      </nav>

      <div className="hero-gradient">
        <div className="mx-auto max-w-xl px-4 py-16 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#10b981]/10">
            <CheckCircle size={40} className="text-[#10b981]" />
          </div>

          <h1 className="text-3xl font-bold text-[#f0f0f5]">Thank You!</h1>
          <p className="mt-3 text-[#9090a0]">
            Your booking has been submitted successfully. We&apos;ll get back to you shortly.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 pb-20">
        {/* Booking Details Card */}
        <div className="rounded-2xl border border-[#2a2a3a] bg-[#111118] p-6">
          <h3 className="mb-4 text-lg font-semibold text-[#f0f0f5]">Booking Details</h3>

          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl border border-[#2a2a3a] bg-[#1c1c28] p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#d4a843]/10">
                <Hash size={18} className="text-[#d4a843]" />
              </div>
              <div>
                <p className="text-xs text-[#606070]">Booking Number</p>
                <p className="font-bold text-[#f0f0f5]">{bookingNumber}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-[#2a2a3a] bg-[#1c1c28] p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3b82f6]/10">
                <FileText size={18} className="text-[#3b82f6]" />
              </div>
              <div>
                <p className="text-xs text-[#606070]">Service Type</p>
                <p className="font-bold text-[#f0f0f5]">{serviceType}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-[#2a2a3a] bg-[#1c1c28] p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#10b981]/10">
                <Calendar size={18} className="text-[#10b981]" />
              </div>
              <div>
                <p className="text-xs text-[#606070]">Date</p>
                <p className="font-bold text-[#f0f0f5]">{formattedDate}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-[#2a2a3a] bg-[#1c1c28] p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#8b5cf6]/10">
                <Clock size={18} className="text-[#8b5cf6]" />
              </div>
              <div>
                <p className="text-xs text-[#606070]">Time</p>
                <p className="font-bold text-[#f0f0f5]">{time || "N/A"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="mt-6 rounded-2xl border border-[#2a2a3a] bg-[#111118] p-6">
          <h3 className="mb-4 text-lg font-semibold text-[#f0f0f5]">Next Steps</h3>
          <ol className="space-y-3 text-sm text-[#9090a0]">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#d4a843]/10 text-[10px] font-bold text-[#d4a843]">
                1
              </span>
              <span>You&apos;ll receive a confirmation email shortly with your booking details.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#d4a843]/10 text-[10px] font-bold text-[#d4a843]">
                2
              </span>
              <span>Our team will review your booking and confirm availability.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#d4a843]/10 text-[10px] font-bold text-[#d4a843]">
                3
              </span>
              <span>You&apos;ll receive a confirmation notification with any additional instructions.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#d4a843]/10 text-[10px] font-bold text-[#d4a843]">
                4
              </span>
              <span>For urgent inquiries, contact us at support@ssvshop.com.</span>
            </li>
          </ol>
        </div>

        <div className="mt-6 flex gap-3">
          <Link href="/" className="btn btn-secondary flex-1 items-center justify-center gap-2">
            <ArrowLeft size={16} />
            Back to Home
          </Link>
          <Link href="/shop" className="btn btn-primary flex-1 items-center justify-center gap-2">
            Browse Shop
          </Link>
        </div>
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

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4a843] border-t-transparent" />
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
