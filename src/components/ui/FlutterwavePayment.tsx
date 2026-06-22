"use client";

import { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";

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

  const handlePayment = () => {
    if (!window.FlutterwaveCheckout) {
      alert("Payment gateway is still loading. Please try again.");
      return;
    }

    const txRef = `TX-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    window.FlutterwaveCheckout({
      public_key: process.env.NEXT_PUBLIC_FLW_PUBLIC_KEY || "FLWPUBK_TEST-d6487d955432e2041f36d5496f8cb98a-X",
      tx_ref: txRef,
      amount: amount,
      currency: "NGN",
      customer: {
        email: email,
        name: name,
      },
      customizations: {
        title: "SSV Shop",
        description: description,
        logo: "",
      },
      callback: (response: Record<string, unknown>) => {
        if (response.status === "successful" && onSuccess) {
          onSuccess(response);
        }
      },
      onclose: () => {
        if (onClose) onClose();
      },
    });
  };

  return (
    <button
      onClick={handlePayment}
      disabled={!scriptLoaded || amount <= 0}
      className="btn-primary flex w-full items-center justify-center gap-3 rounded-xl px-6 py-4 text-lg font-bold transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <CreditCard size={22} />
      Pay ₦{(amount / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })} with Flutterwave
    </button>
  );
}
