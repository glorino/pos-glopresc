import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const customer = await db.customer.findUnique({
      where: { id },
      include: {
        _count: { select: { sales: true } },
        sales: {
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            invoiceNumber: true,
            total: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...customer,
      totalSpent: Number(customer.totalSpent),
      sales: customer.sales.map((s) => ({
        ...s,
        total: Number(s.total),
      })),
    });
  } catch (error) {
    console.error("Customer detail GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer" },
      { status: 500 }
    );
  }
}
