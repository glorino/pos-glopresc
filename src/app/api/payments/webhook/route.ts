import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const secretHash = process.env.FLW_SECRET_HASH;
    const signature = request.headers.get("verif-hash");

    if (!secretHash) {
      console.error("FLW_SECRET_HASH not configured");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }

    if (!signature || signature !== secretHash) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = body;

    if (event.event === "charge.completed" && event.data) {
      const data = event.data;
      const txRef = data.tx_ref;
      const status = data.status;
      const amount = Number(data.amount);

      if (status === "successful") {
        const existingPayment = await db.payment.findFirst({
          where: { reference: txRef },
        });

        if (!existingPayment) {
          console.error(`Webhook: Payment not found for tx_ref: ${txRef}`);
          return NextResponse.json({ received: true });
        }

        if (existingPayment.status === "COMPLETED") {
          return NextResponse.json({ received: true });
        }

        await db.payment.update({
          where: { id: existingPayment.id },
          data: { status: "COMPLETED" },
        });

        if (existingPayment.saleId) {
          const sale = await db.sale.findUnique({
            where: { id: existingPayment.saleId },
          });

          if (sale) {
            const newAmountPaid = Number(sale.amountPaid) + amount;

            await db.sale.update({
              where: { id: existingPayment.saleId! },
              data: {
                paymentMethod: "ONLINE",
                amountPaid: newAmountPaid,
                status: newAmountPaid >= Number(sale.total) ? "COMPLETED" : "PENDING",
              },
            });
          }
        }
      } else if (status === "failed") {
        await db.payment.updateMany({
          where: { reference: txRef },
          data: { status: "FAILED" },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
