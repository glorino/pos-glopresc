import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAuth();
    if (error) return error;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const customerId = searchParams.get("customerId");

    const where: Record<string, any> = {};

    if (status) where.status = status;
    if (customerId) where.customerId = customerId;

    const tickets = await db.supportTicket.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        assignee: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Support tickets GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch support tickets" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error } = await requireAuth();
    if (error) return error;
    const body = await request.json();
    const { customerId, subject, message, priority, assigneeId } = body;

    if (!customerId || !subject || !message) {
      return NextResponse.json(
        { error: "customerId, subject, and message are required" },
        { status: 400 }
      );
    }

    const customer = await db.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    const ticket = await db.supportTicket.create({
      data: {
        customerId,
        subject,
        message,
        priority: priority || "NORMAL",
        assigneeId: assigneeId || null,
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        assignee: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error: any) {
    console.error("Support tickets POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create support ticket" },
      { status: 500 }
    );
  }
}
