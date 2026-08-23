"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Package,
  CreditCard,
  ArrowLeft,
  Copy,
  Check,
} from "lucide-react";
import { formatCurrency, APP_NAME } from "@/lib/utils";

interface OrderItem {
  name: string;
  sku: string;
  image: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Order {
  id: string;
  invoiceNumber: string;
  status: string;
  paymentMethod: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amountPaid: number;
  changeDue: number;
  txRef: string | null;
  notes: string | null;
  createdAt: string;
  items: OrderItem[];
  payments: { method: string; reference: string; status: string; amount: number }[];
}

export default function OrderConfirmationPage() {
  const params = useParams();
  const txRef = params.txRef as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!txRef) return;
    fetch(`/api/shop/orders?txRef=${encodeURIComponent(txRef)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Order not found");
        return res.json();
      })
      .then((data) => setOrder(data))
      .catch(() => setError("Order not found"))
      .finally(() => setLoading(false));
  }, [txRef]);

  function copyInvoiceNumber() {
    if (order?.invoiceNumber) {
      navigator.clipboard.writeText(order.invoiceNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#f59e0b] border-t-transparent" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl border border-[#2a2a3a] bg-[#111118] p-8 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10">
              <Package size={40} className="text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-[#f0f0f5]">Order Not Found</h2>
            <p className="mt-2 text-sm text-[#9090a0]">
              We couldn&apos;t find an order matching this reference.
            </p>
            <Link
              href="/shop"
              className="btn btn-primary mt-8 inline-flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Back to Shop
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Link
          href="/shop"
          className="mb-8 inline-flex items-center gap-2 text-sm text-[#9090a0] hover:text-[#f0f0f5] transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Shop
        </Link>

        <div className="rounded-2xl border border-[#2a2a3a] bg-[#111118] p-8">
          <div className="text-center mb-8">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#10b981]/10">
              <CheckCircle2 size={40} className="text-[#10b981]" />
            </div>
            <h1 className="text-2xl font-bold text-[#f0f0f5]">
              Order Confirmed!
            </h1>
            <p className="mt-2 text-sm text-[#9090a0]">
              Thank you for your purchase from {APP_NAME}
            </p>
          </div>

          <div className="mb-6 rounded-xl border border-[#2a2a3a] bg-[#0d0d14] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#9090a0]">Invoice Number</p>
                <p className="text-lg font-bold text-[#f59e0b] font-mono">
                  {order.invoiceNumber}
                </p>
              </div>
              <button
                onClick={copyInvoiceNumber}
                className="rounded-lg border border-[#2a2a3a] bg-[#1a1a2e] p-2 text-[#9090a0] hover:text-[#f0f0f5] transition-colors"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          <div className="mb-6 rounded-xl border border-[#2a2a3a] bg-[#0d0d14] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1a1a2e]">
                <CreditCard size={20} className="text-[#9090a0]" />
              </div>
              <div>
                <p className="text-xs text-[#9090a0]">Payment Method</p>
                <p className="font-semibold text-[#f0f0f5]">
                  {order.paymentMethod === "ONLINE" ? "Online Payment" : order.paymentMethod}
                </p>
              </div>
              <div className="ml-auto">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    order.status === "COMPLETED"
                      ? "bg-[#10b981]/10 text-[#10b981]"
                      : order.status === "PENDING"
                      ? "bg-[#f59e0b]/10 text-[#f59e0b]"
                      : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {order.status}
                </span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="mb-3 text-sm font-semibold text-[#f0f0f5]">Order Items</h3>
            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl border border-[#2a2a3a] bg-[#0d0d14] p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1a1a2e] text-sm font-bold text-[#f59e0b]">
                      {item.quantity}x
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#f0f0f5]">{item.name}</p>
                      <p className="text-xs text-[#9090a0]">{item.sku}</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-[#f0f0f5]">
                    {formatCurrency(item.total)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#2a2a3a] bg-[#0d0d14] p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#9090a0]">Subtotal</span>
              <span className="text-[#f0f0f5]">
                {formatCurrency(order.subtotal)}
              </span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[#9090a0]">Discount</span>
                <span className="text-[#10b981]">
                  -{formatCurrency(order.discount)}
                </span>
              </div>
            )}
            {order.tax > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[#9090a0]">Tax</span>
                <span className="text-[#f0f0f5]">
                  {formatCurrency(order.tax)}
                </span>
              </div>
            )}
            <div className="border-t border-[#2a2a3a] pt-2 flex justify-between">
              <span className="text-base font-bold text-[#f0f0f5]">Total Paid</span>
              <span className="text-lg font-bold text-[#f59e0b]">
                {formatCurrency(order.total)}
              </span>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-[#9090a0] mb-4">
              Order placed on{" "}
              {new Date(order.createdAt).toLocaleDateString("en-NG", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <Link
              href="/shop"
              className="btn btn-primary inline-flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
