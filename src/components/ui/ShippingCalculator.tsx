"use client";

import { useState, useEffect } from "react";
import { MapPin, Truck, Loader2 } from "lucide-react";

interface ShippingSettings {
  originAddress: string;
  ratePerKm: number;
  minFee: number;
  freeShippingThreshold: number;
}

interface ShippingCalculatorProps {
  weight: number;
  onCalculate: (fee: number, estimate: string) => void;
}

function getDeliveryEstimate(distanceKm: number): string {
  if (distanceKm <= 30) return "1-2 business days";
  if (distanceKm <= 100) return "2-3 business days";
  if (distanceKm <= 300) return "3-5 business days";
  if (distanceKm <= 600) return "5-7 business days";
  return "7-10 business days";
}

export default function ShippingCalculator({ weight, onCalculate }: ShippingCalculatorProps) {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    fee: number;
    estimate: string;
    distance: number;
    ratePerKm: number;
  } | null>(null);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState<ShippingSettings>({
    originAddress: "",
    ratePerKm: 100,
    minFee: 500,
    freeShippingThreshold: 0,
  });

  useEffect(() => {
    fetch("/api/settings/shipping")
      .then((res) => res.json())
      .then((data) => {
        setSettings({
          originAddress: data.originAddress || "",
          ratePerKm: data.ratePerKm || 100,
          minFee: data.minFee || 500,
          freeShippingThreshold: data.freeShippingThreshold || 0,
        });
      })
      .catch(() => {});
  }, []);

  async function handleCalculate() {
    if (!address.trim()) {
      setError("Please enter a delivery address");
      return;
    }
    if (!settings.originAddress) {
      setError("Business address not configured. Please contact support.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const origin = settings.originAddress;
      const destination = address;
      const res = await fetch("/api/shipping/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin, destination }),
      });
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
      const fee = Math.max(Math.ceil(distanceKm * settings.ratePerKm), settings.minFee);
      const estimate = getDeliveryEstimate(distanceKm);

      const shippingResult = {
        fee,
        estimate,
        distance: distanceKm,
        ratePerKm: settings.ratePerKm,
      };
      setResult(shippingResult);
      onCalculate(fee, estimate);
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
            placeholder="Enter delivery address"
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
              <p className="text-xs text-[#9090a0]">Rate: ₦{result.ratePerKm.toLocaleString()}/km</p>
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
