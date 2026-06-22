import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");

    let customer;
    if (customerId) {
      customer = await db.customer.findUnique({
        where: { id: customerId, isActive: true },
      });
    } else {
      const customers = await db.customer.findMany({
        where: { isActive: true },
        take: 1,
        orderBy: { createdAt: "desc" },
      });
      customer = customers[0] ?? null;
    }

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    const [orders, bookings] = await Promise.all([
      db.sale.findMany({
        where: { customerId: customer.id },
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          items: {
            include: {
              product: { select: { id: true, name: true } },
            },
          },
        },
      }),
      db.booking.findMany({
        where: { customerId: customer.id },
        take: 20,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const stats = {
      totalOrders: orders.length,
      totalSpent: Number(customer.totalSpent),
      loyaltyPoints: customer.loyaltyPoints,
      activeBookings: bookings.filter(
        (b) => b.status === "PENDING" || b.status === "CONFIRMED" || b.status === "IN_PROGRESS"
      ).length,
    };

    return NextResponse.json({
      customer: {
        ...customer,
        totalSpent: Number(customer.totalSpent),
      },
      orders: orders.map((order) => ({
        ...order,
        subtotal: Number(order.subtotal),
        discount: Number(order.discount),
        tax: Number(order.tax),
        total: Number(order.total),
        amountPaid: Number(order.amountPaid),
        changeDue: Number(order.changeDue),
        items: order.items.map((item) => ({
          ...item,
          unitPrice: Number(item.unitPrice),
          total: Number(item.total),
        })),
      })),
      bookings: bookings.map((booking) => ({
        ...booking,
        totalAmount: booking.totalAmount ? Number(booking.totalAmount) : null,
      })),
      stats,
    });
  } catch (error) {
    console.error("Customer Profile GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, firstName, lastName, email, phone, address, city, state } = body;

    let customerId = id;

    if (!customerId) {
      const customers = await db.customer.findMany({
        where: { isActive: true },
        take: 1,
        orderBy: { createdAt: "desc" },
      });
      customerId = customers[0]?.id;
    }

    if (!customerId) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    const customer = await db.customer.update({
      where: { id: customerId },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(email !== undefined && { email: email || null }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(address !== undefined && { address: address || null }),
        ...(city !== undefined && { city: city || null }),
        ...(state !== undefined && { state: state || null }),
      },
    });

    return NextResponse.json({
      ...customer,
      totalSpent: Number(customer.totalSpent),
    });
  } catch (error: any) {
    console.error("Customer Profile PUT error:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A customer with this email already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to update customer profile" },
      { status: 500 }
    );
  }
}
