import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;
  try {
    const body = await request.json();
    const { amount, email, name, description } = body;

    if (!amount || !email || !name) {
      return NextResponse.json(
        { error: "amount, email, and name are required" },
        { status: 400 }
      );
    }

    const publicKey = process.env.NEXT_PUBLIC_FLW_PUBLIC_KEY;
    if (!publicKey) {
      return NextResponse.json(
        { error: "Flutterwave public key not configured" },
        { status: 500 }
      );
    }

    const txRef = `TX-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    return NextResponse.json({
      status: "success",
      tx_ref: txRef,
      public_key: publicKey,
      amount,
      currency: "NGN",
      customer: { email, name },
      description: description || "Payment",
    });
  } catch (error) {
    console.error("Payment initiation error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to initiate payment" },
      { status: 500 }
    );
  }
}
