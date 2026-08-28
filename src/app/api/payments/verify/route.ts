import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const rateLimitKey = getRateLimitKey(request, "payment-verify");
  const rateLimit = checkRateLimit(rateLimitKey, 20, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const transactionId = searchParams.get("transaction_id");

  if (!transactionId) {
    return NextResponse.json(
      { error: "transaction_id is required" },
      { status: 400 }
    );
  }

  if (!/^\d+$/.test(transactionId)) {
    return NextResponse.json(
      { error: "Invalid transaction_id format" },
      { status: 400 }
    );
  }

  const secretKey = process.env.FLW_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "Payment gateway not configured" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (data.status === "success" && data.data) {
      const txRef = data.data.tx_ref;

      await db.payment.updateMany({
        where: { reference: txRef },
        data: { status: "COMPLETED" },
      });

      const payment = await db.payment.findUnique({
        where: { reference: txRef },
        select: { saleId: true },
      });

      if (payment?.saleId) {
        await db.sale.update({
          where: { id: payment.saleId },
          data: {
            paymentMethod: "ONLINE",
            amountPaid: Number(data.data.amount),
            status: "COMPLETED",
          },
        });
      }

      return NextResponse.json({
        status: "success",
        transaction: {
          id: data.data.id,
          tx_ref: data.data.tx_ref,
          amount: data.data.amount,
          currency: data.data.currency,
          status: data.data.status,
          payment_type: data.data.payment_type,
          customer: data.data.customer,
          created_at: data.data.created_at,
        },
      });
    }

    return NextResponse.json(
      { error: data.message || "Transaction verification failed" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Flutterwave verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify transaction" },
      { status: 500 }
    );
  }
}
