import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getBranchFilter } from "@/lib/branch-filter";
import { requireAuth } from "@/lib/api-auth";

const AUTH_ROLES = ["OWNER", "MANAGER", "SALES_MANAGER", "ACCOUNTANT"];

export async function GET(request: NextRequest) {
  const { error } = await requireAuth(AUTH_ROLES);
  if (error) return error;
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const search = searchParams.get("search");

    const where: Record<string, any> = { isActive: true };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const branchFilter = await getBranchFilter(request);
    if (branchFilter) {
      where.AND = Array.isArray(where.AND) ? [...where.AND, branchFilter] : [branchFilter];
    }

    const skip = (page - 1) * limit;

    const [customers, total] = await Promise.all([
      db.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { sales: true } },
        },
      }),
      db.customer.count({ where }),
    ]);

    return NextResponse.json({
      customers: customers.map((c) => ({
        ...c,
        totalSpent: Number(c.totalSpent),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Customers GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAuth(AUTH_ROLES);
  if (error) return error;
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, address, city, state, notes } = body;

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "First name and last name are required" },
        { status: 400 }
      );
    }

    const customer = await db.customer.create({
      data: {
        firstName,
        lastName,
        email: email || null,
        phone: phone || null,
        address: address || null,
        city: city || null,
        state: state || null,
        notes: notes || null,
      },
    });

    return NextResponse.json(
      { ...customer, totalSpent: Number(customer.totalSpent) },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Customers POST error:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A customer with this email already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to create customer" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const { error } = await requireAuth(AUTH_ROLES);
  if (error) return error;
  try {
    const body = await request.json();
    const { id, ...rawData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      );
    }

    const ALLOWED_FIELDS = ["firstName", "lastName", "email", "phone", "address", "city", "state", "notes"] as const;
    const data: Record<string, any> = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in rawData) data[key] = rawData[key];
    }

    const customer = await db.customer.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      ...customer,
      totalSpent: Number(customer.totalSpent),
    });
  } catch (error: any) {
    console.error("Customers PUT error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update customer" },
      { status: 500 }
    );
  }
}
