"use client";

import { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";
import { formatCurrency, APP_NAME, APP_CURRENCY } from "@/lib/utils";

declare global {
  interface Window {
    FlutterwaveCheckout: (config: Record<string, unknown>) => void;
  }
}

interface FlutterwavePaymentProps {
  amount: number;
  email: string;
  name: string;
  description?: string;
  onSuccess?: (response: Record<string, unknown>) => void;
  onClose?: () => void;
}

export default function FlutterwavePayment({
  amount,
  email,
  name,
  description = "Payment",
  onSuccess,
  onClose,
}: FlutterwavePaymentProps) {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (document.getElementById("flutterwave-script")) {
      setScriptLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "flutterwave-script";
    script.src = "https://checkout.flutterwave.com/js/flutterwave.js";
    script.onload = () => setScriptLoaded(true);
    document.head.appendChild(script);
  }, []);

  const handlePayment = async () => {
    if (!window.FlutterwaveCheckout) {
      alert("Payment gateway is still loading. Please try again.");
      return;
    }

    setLoading(true);
    try {
      const initiateRes = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, email, name, description }),
      });

      if (!initiateRes.ok) {
        const data = await initiateRes.json();
        alert(data.error || data.message || "Failed to initiate payment");
        setLoading(false);
        return;
      }

      const { tx_ref, public_key } = await initiateRes.json();

      window.FlutterwaveCheckout({
        public_key,
        tx_ref,
        amount,
          currency: APP_CURRENCY,
        customer: { email, name },
        customizations: {
          title: APP_NAME,
          description,
          logo: "",
        },
        callback: (response: Record<string, unknown>) => {
          setLoading(false);
          if (onSuccess) onSuccess(response);
        },
        onclose: () => {
          setLoading(false);
          if (onClose) onClose();
        },
      });
    } catch {
      alert("Failed to initiate payment. Please try again.");
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={!scriptLoaded || amount <= 0 || loading}
      className="btn-primary flex w-full items-center justify-center gap-3 rounded-xl px-6 py-4 text-lg font-bold transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <CreditCard size={22} />
      {loading ? "Processing..." : `Pay ${formatCurrency(amount)} with Flutterwave`}
    </button>
  );
}
