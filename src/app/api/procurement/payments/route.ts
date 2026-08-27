import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const { error } = await requireAuth(["OWNER", "MANAGER", "ACCOUNTANT", "CFO", "PROCUREMENT_MANAGER"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");

    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      db.procurementPayment.findMany({
        skip,
        take: limit,
        orderBy: { paidAt: "desc" },
        include: {
          purchaseOrder: {
            select: {
              id: true,
              orderNumber: true,
              supplier: { select: { id: true, name: true } }
            }
          },
          payer: { select: { id: true, firstName: true, lastName: true } }
        }
      }),
      db.procurementPayment.count(),
    ]);

    return NextResponse.json({
      payments: payments.map((p) => ({
        ...p,
        amount: Number(p.amount),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Procurement Payments GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch procurement payments" },
      { status: 500 }
    );
  }
}