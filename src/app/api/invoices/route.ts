import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");

    const where: Record<string, any> = {};

    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate + "T23:59:59");
    }
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: "insensitive" } },
        { customer: { firstName: { contains: search, mode: "insensitive" } } },
        { customer: { lastName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      db.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
      db.invoice.count({ where }),
    ]);

    return NextResponse.json({
      invoices: invoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        customer: inv.customer
          ? `${inv.customer.firstName} ${inv.customer.lastName}`
          : "Walk-in",
        customerEmail: inv.customer?.email || null,
        amount: Number(inv.amount),
        tax: Number(inv.tax),
        total: Number(inv.total),
        status: inv.status,
        dueDate: inv.dueDate.toISOString(),
        paidDate: inv.paidDate?.toISOString() || null,
        createdAt: inv.createdAt.toISOString(),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Invoices GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      invoiceNumber,
      customerId,
      amount,
      tax = 0,
      total,
      dueDate,
    } = body;

    if (!invoiceNumber || amount === undefined || !dueDate) {
      return NextResponse.json(
        { error: "Invoice number, amount, and due date are required" },
        { status: 400 }
      );
    }

    const invoice = await db.invoice.create({
      data: {
        invoiceNumber,
        customerId: customerId || null,
        amount,
        tax,
        total: total ?? amount + tax,
        dueDate: new Date(dueDate),
      },
      include: {
        customer: { select: { firstName: true, lastName: true } },
      },
    });

    return NextResponse.json(
      {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customer: invoice.customer
          ? `${invoice.customer.firstName} ${invoice.customer.lastName}`
          : "Walk-in",
        amount: Number(invoice.amount),
        tax: Number(invoice.tax),
        total: Number(invoice.total),
        status: invoice.status,
        dueDate: invoice.dueDate.toISOString(),
        createdAt: invoice.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Invoices POST error:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "An invoice with this number already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to create invoice" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Invoice ID is required" },
        { status: 400 }
      );
    }

    if (data.dueDate) data.dueDate = new Date(data.dueDate);
    if (data.paidDate) data.paidDate = new Date(data.paidDate);

    const invoice = await db.invoice.update({
      where: { id },
      data,
      include: {
        customer: { select: { firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customer: invoice.customer
        ? `${invoice.customer.firstName} ${invoice.customer.lastName}`
        : "Walk-in",
      amount: Number(invoice.amount),
      tax: Number(invoice.tax),
      total: Number(invoice.total),
      status: invoice.status,
      dueDate: invoice.dueDate.toISOString(),
      paidDate: invoice.paidDate?.toISOString() || null,
      createdAt: invoice.createdAt.toISOString(),
    });
  } catch (error: any) {
    console.error("Invoices PUT error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update invoice" },
      { status: 500 }
    );
  }
}
