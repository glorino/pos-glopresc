"use client";

import { useState } from "react";
import { MapPin, Truck, Loader2 } from "lucide-react";

interface ShippingCalculatorProps {
  weight: number;
  onCalculate: (fee: number, estimate: string) => void;
}

function getShippingFee(distanceKm: number): { fee: number; label: string; estimate: string } {
  if (distanceKm <= 30) {
    return { fee: 1000, label: "Within Lagos", estimate: "1-2 business days" };
  } else if (distanceKm <= 60) {
    return { fee: 2000, label: "Lagos Metro", estimate: "2-3 business days" };
  } else if (distanceKm <= 200) {
    return { fee: 3500, label: "Southwest Nigeria", estimate: "3-5 business days" };
  } else {
    return { fee: 5000, label: "Other parts of Nigeria", estimate: "5-7 business days" };
  }
}

export default function ShippingCalculator({ weight, onCalculate }: ShippingCalculatorProps) {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ fee: number; label: string; estimate: string; distance: number } | null>(null);
  const [error, setError] = useState("");

  async function handleCalculate() {
    if (!address.trim()) {
      setError("Please enter a delivery address");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const apiKey = "AIzaSyBbMpcjjTTuZRL---5TbBeepWN9_Nt-7PQ";
      const origin = "Lagos, Nigeria";
      const destination = `${address}, Nigeria`;
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${apiKey}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.status !== "OK" || !data.rows?.[0]?.elements?.[0]) {
        setError("Could not calculate distance. Please try a different address.");
        setLoading(false);
        return;
      }

      const element = data.rows[0].elements[0];
      if (element.status !== "OK") {
        setError("Location not found. Please check the address.");
        setLoading(false);
        return;
      }

      const distanceMeters = element.distance?.value || 0;
      const distanceKm = Math.round(distanceMeters / 1000);
      const shipping = getShippingFee(distanceKm);

      const shippingResult = { ...shipping, distance: distanceKm };
      setResult(shippingResult);
      onCalculate(shipping.fee, shipping.estimate);
    } catch {
      setError("Failed to calculate shipping. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-[#2a2a3a] bg-[#1c1c28] p-4">
      <div className="mb-3 flex items-center gap-2">
        <Truck size={16} className="text-[#d4a843]" />
        <h4 className="text-sm font-semibold text-[#f0f0f5]">Shipping Calculation</h4>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606070]" />
          <input
            type="text"
            placeholder="Enter delivery address (e.g., Ikeja, Abuja)"
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              setError("");
            }}
            className="input !py-2 !pl-9 !pr-3 text-sm"
          />
        </div>
        <button
          onClick={handleCalculate}
          disabled={loading || !address.trim()}
          className="btn btn-primary shrink-0 !px-4 !py-2 text-xs"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : "Calculate"}
        </button>
      </div>

      {error && (
        <p className="mt-2 text-xs text-[#f43f5e]">{error}</p>
      )}

      {result && (
        <div className="mt-3 rounded-lg border border-[#2a2a3a] bg-[#111118] p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#9090a0]">Distance: {result.distance} km</p>
              <p className="text-xs text-[#9090a0]">Zone: {result.label}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-[#d4a843]">
                ₦{result.fee.toLocaleString()}
              </p>
              <p className="text-[10px] text-[#9090a0]">{result.estimate}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
