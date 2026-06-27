import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateBookingNumber } from "@/lib/utils";
import { requireAuth, getOptionalSession } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const status = searchParams.get("status");
    const serviceType = searchParams.get("serviceType");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");

    const where: Record<string, any> = {};

    if (status) where.status = status;
    if (serviceType) where.serviceType = serviceType;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate + "T23:59:59");
    }
    if (search) {
      where.OR = [
        { bookingNumber: { contains: search, mode: "insensitive" } },
        { customer: { firstName: { contains: search, mode: "insensitive" } } },
        { customer: { lastName: { contains: search, mode: "insensitive" } } },
        { customer: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      db.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          customer: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
      }),
      db.booking.count({ where }),
    ]);

    return NextResponse.json({
      bookings: bookings.map((b) => ({
        ...b,
        totalAmount: b.totalAmount ? Number(b.totalAmount) : null,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Bookings GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getOptionalSession();
  try {
    const body = await request.json();
    const { fullName, email, phone, serviceType, date, time, duration, description } = body;

    if (!fullName || !email || !phone || !serviceType || !date || !time) {
      return NextResponse.json(
        { error: "Full name, email, phone, service type, date, and time are required" },
        { status: 400 }
      );
    }

    let customer = await db.customer.findUnique({ where: { email } });

    if (!customer) {
      const nameParts = fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || fullName;
      const lastName = nameParts.slice(1).join(" ") || fullName;

      customer = await db.customer.create({
        data: {
          firstName,
          lastName,
          email,
          phone,
        },
      });
    }

    const bookingNumber = generateBookingNumber();

    const booking = await db.booking.create({
      data: {
        bookingNumber,
        customerId: customer.id,
        serviceType,
        description: description || null,
        date: new Date(date),
        time,
        duration: duration || 60,
        status: "PENDING",
        notes: null,
      },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        ...booking,
        totalAmount: booking.totalAmount ? Number(booking.totalAmount) : null,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Bookings POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create booking" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;
  try {
    const body = await request.json();
    const { id, ...rawData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Booking ID is required" },
        { status: 400 }
      );
    }

    const ALLOWED_FIELDS = ["status", "date", "time", "duration", "serviceType", "description", "notes", "totalAmount"] as const;
    const data: Record<string, any> = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in rawData) data[key] = rawData[key];
    }

    if (data.totalAmount !== undefined) data.totalAmount = Number(data.totalAmount);
    if (data.date) data.date = new Date(data.date);

    const booking = await db.booking.update({
      where: { id },
      data,
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json({
      ...booking,
      totalAmount: booking.totalAmount ? Number(booking.totalAmount) : null,
    });
  } catch (error: any) {
    console.error("Bookings PUT error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update booking" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Booking ID is required" },
        { status: 400 }
      );
    }

    await db.booking.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json({ message: "Booking cancelled successfully" });
  } catch (error: any) {
    console.error("Bookings DELETE error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to cancel booking" },
      { status: 500 }
    );
  }
}
