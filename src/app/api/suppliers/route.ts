import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const search = searchParams.get("search");
    const isActive = searchParams.get("isActive");

    const where: Record<string, any> = {};

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { contactName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [suppliers, total] = await Promise.all([
      db.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { purchaseOrders: true, products: true } },
          products: {
            select: { costPrice: true },
            where: { isActive: true },
          },
          purchaseOrders: {
            select: { createdAt: true, total: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      }),
      db.supplier.count({ where }),
    ]);

    const enrichedSuppliers = suppliers.map((supplier) => {
      const products = supplier.products;
      const avgCost = products.length > 0
        ? products.reduce((sum, p) => sum + Number(p.costPrice), 0) / products.length
        : 0;
      const lastOrderDate = supplier.purchaseOrders.length > 0
        ? supplier.purchaseOrders[0].createdAt
        : null;
      const totalOrderValue = supplier.purchaseOrders.length > 0
        ? Number(supplier.purchaseOrders[0].total)
        : 0;

      return {
        id: supplier.id,
        name: supplier.name,
        contactName: supplier.contactName,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
        city: supplier.city,
        state: supplier.state,
        country: supplier.country,
        isActive: supplier.isActive,
        createdAt: supplier.createdAt,
        updatedAt: supplier.updatedAt,
        _count: supplier._count,
        avgItemCost: Math.round(avgCost * 100) / 100,
        totalItemsSupplied: products.length,
        lastOrderDate: lastOrderDate ? lastOrderDate.toISOString() : null,
        lastOrderTotal: totalOrderValue,
      };
    });

    return NextResponse.json({
      suppliers: enrichedSuppliers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Suppliers GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch suppliers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAuth(["OWNER", "MANAGER", "PROCUREMENT_MANAGER"]);
  if (error) return error;
  try {
    const body = await request.json();
    const { name, contactName, email, phone, address, city, state, country } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Supplier name is required" },
        { status: 400 }
      );
    }

    const supplier = await db.supplier.create({
      data: {
        name,
        contactName: contactName || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        city: city || null,
        state: state || null,
        country: country || "Nigeria",
      },
    });

    return NextResponse.json(supplier, { status: 201 });
  } catch (error: any) {
    console.error("Suppliers POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create supplier" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const { error } = await requireAuth(["OWNER", "MANAGER", "PROCUREMENT_MANAGER"]);
  if (error) return error;
  try {
    const body = await request.json();
    const { id, ...rawData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Supplier ID is required" },
        { status: 400 }
      );
    }

    const ALLOWED_FIELDS = ["name", "contactName", "email", "phone", "address", "city", "state", "country", "isActive"] as const;
    const data: Record<string, any> = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in rawData) data[key] = rawData[key];
    }

    const supplier = await db.supplier.update({
      where: { id },
      data,
    });

    return NextResponse.json(supplier);
  } catch (error: any) {
    console.error("Suppliers PUT error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update supplier" },
      { status: 500 }
    );
  }
}
