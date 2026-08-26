import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  let webhookLog: { id: string } | null = null;

  try {
    const body = await request.json();
    const secretHash = process.env.FLW_SECRET_HASH;
    const signature = request.headers.get("verif-hash");

    // Log the webhook
    webhookLog = await db.webhook.create({
      data: {
        event: body?.event || "unknown",
        source: "flutterwave",
        payload: body || {},
        status: "RECEIVED",
      },
    });

    if (!secretHash) {
      await db.webhook.update({
        where: { id: webhookLog.id },
        data: { status: "ERROR", error: "FLW_SECRET_HASH not configured" },
      });
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }

    if (!signature || signature !== secretHash) {
      await db.webhook.update({
        where: { id: webhookLog.id },
        data: { status: "ERROR", error: "Invalid signature" },
      });
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
          await db.webhook.update({
            where: { id: webhookLog.id },
            data: { status: "PROCESSED" },
          });
          return NextResponse.json({ received: true });
        }

        if (existingPayment.status === "COMPLETED") {
          await db.webhook.update({
            where: { id: webhookLog.id },
            data: { status: "PROCESSED" },
          });
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

    await db.webhook.update({
      where: { id: webhookLog.id },
      data: { status: "PROCESSED" },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    if (webhookLog) {
      await db.webhook.update({
        where: { id: webhookLog.id },
        data: { status: "ERROR", error: error instanceof Error ? error.message : "Unknown error" },
      }).catch(() => {});
    }
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
