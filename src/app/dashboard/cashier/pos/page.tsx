"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import POSTerminal from "@/components/pos/POSTerminal";
import { APP_CURRENCY } from "@/lib/utils";
import { Lock, Unlock, X } from "lucide-react";

export default function POSPage() {
  const [drawerOpen, setDrawerOpen] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [openingBalance, setOpeningBalance] = useState("");
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    fetchDrawerStatus();
  }, []);

  async function fetchDrawerStatus() {
    try {
      const res = await fetch("/api/cash-drawer");
      if (res.ok) {
        const data = await res.json();
        const isOpen = data.openDrawer?.status === "OPEN" || data.openDrawer?.isOpen === true;
        setDrawerOpen(isOpen);
        if (!isOpen) setShowModal(true);
      }
    } catch {
      setDrawerOpen(false);
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleOpenRegister() {
    if (!openingBalance || Number(openingBalance) < 0) {
      alert("Please enter a valid opening balance");
      return;
    }
    setOpening(true);
    try {
      const res = await fetch("/api/cash-drawer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openingBalance: Number(openingBalance) }),
      });
      if (res.ok) {
        setDrawerOpen(true);
        setShowModal(false);
        setOpeningBalance("");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to open register");
      }
    } catch {
      alert("Failed to open register");
    } finally {
      setOpening(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="POS Terminal" noPadding>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4a843] border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="POS Terminal" noPadding>
      <div className="h-[calc(100vh-64px)]">
        {drawerOpen ? (
          <POSTerminal />
        ) : (
          <div className="flex h-full items-center justify-center bg-[#0a0a0f]">
            <div className="text-center">
              <Lock size={48} className="mx-auto mb-4 text-[#f43f5e]" />
              <h2 className="text-xl font-bold text-[#f0f0f5]">Register Closed</h2>
              <p className="mt-2 text-[#9090a0]">Open your cash register to start selling.</p>
            </div>
          </div>
        )}
      </div>

      {/* Enforce Open Register Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl border border-[#2a2a3a] bg-[#111118] p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#10b981] to-[#059669]">
                  <Unlock size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#f0f0f5]">Open Cash Register</h3>
                  <p className="text-sm text-[#9090a0]">Required before processing sales</p>
                </div>
              </div>
            </div>

            <div className="mb-6 rounded-xl border border-[#f59e0b]/20 bg-[#f59e0b]/10 px-4 py-3 text-sm text-[#f59e0b]">
              You must open your cash register before you can use the POS terminal.
            </div>

            <div className="mb-6">
              <label className="mb-1.5 block text-sm font-medium text-[#9090a0]">Opening Balance ({APP_CURRENCY})</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                placeholder="Enter cash in drawer"
                className="input"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => window.location.href = "/dashboard/cashier"}
                className="btn btn-secondary flex-1 gap-2"
              >
                <X size={16} />
                Cancel
              </button>
              <button
                onClick={handleOpenRegister}
                disabled={opening || !openingBalance}
                className="btn btn-primary flex-[2] gap-2 bg-gradient-to-r from-[#10b981] to-[#059669]"
              >
                <Unlock size={16} />
                {opening ? "Opening..." : "Open Register"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
