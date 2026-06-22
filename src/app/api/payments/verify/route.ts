import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const transactionId = searchParams.get("transaction_id");

  if (!transactionId) {
    return NextResponse.json(
      { error: "transaction_id is required" },
      { status: 400 }
    );
  }

  const secretKey = process.env.FLW_SECRET_KEY || "FLWSECK_TEST-secret_key_here";

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
      { status: "error", message: data.message || "Transaction verification failed" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Flutterwave verification error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to verify transaction" },
      { status: 500 }
    );
  }
}
