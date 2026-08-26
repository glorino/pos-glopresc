import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { APP_NAME } from "@/lib/utils";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const rateLimitKey = getRateLimitKey(request, "payment-init");
  const rateLimit = checkRateLimit(rateLimitKey, 10, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { amount, email, name, description, saleId } = body;

    if (!amount || !email || !name) {
      return NextResponse.json(
        { error: "amount, email, and name are required" },
        { status: 400 }
      );
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { error: "Amount must be a positive number" },
        { status: 400 }
      );
    }

    if (numAmount > 1000000) {
      return NextResponse.json(
        { error: "Amount exceeds maximum allowed" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
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

    const currency = (await db.setting.findUnique({
      where: { key: "currency.code" },
    }))?.value || "NGN";

    const txRef = `TX-${Date.now()}-${Math.random().toString(36).slice(2, 12).toUpperCase()}`;

    if (saleId) {
      await db.sale.update({
        where: { id: saleId },
        data: { txRef },
      });
    }

    await db.payment.create({
      data: {
        saleId: saleId || undefined,
        amount: numAmount,
        method: "ONLINE",
        reference: txRef,
        description: description || `Payment for ${APP_NAME}`,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      status: "success",
      tx_ref: txRef,
      public_key: publicKey,
      amount: numAmount,
      currency,
      customer: { email, name },
      description: description || `Payment for ${APP_NAME}`,
    });
  } catch (error) {
    console.error("Payment initiation error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to initiate payment" },
      { status: 500 }
    );
  }
}
