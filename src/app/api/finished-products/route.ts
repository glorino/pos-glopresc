import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getToken } from "next-auth/jwt";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const search = searchParams.get("search");
    const categoryId = searchParams.get("categoryId");

    const where: Record<string, any> = { isActive: true };

    if (categoryId) where.categoryId = categoryId;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      db.finishedProduct.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          category: { select: { id: true, name: true } },
        },
      }),
      db.finishedProduct.count({ where }),
    ]);

    return NextResponse.json({
      items: items.map((p) => ({
        ...p,
        sellingPrice: Number(p.sellingPrice),
        unitCost: Number(p.unitCost),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Finished products GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch finished products" },
      { status: 500 }
    );
  }
}

const FINISHED_PRODUCT_ROLES = ["CHIEF_CHEF", "MANAGER", "OWNER"];

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !FINISHED_PRODUCT_ROLES.includes(token.role as string)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      quantityProduced,
      unitCost,
      sellingPrice,
      stockQuantity,
      minStockLevel,
      unit,
      image,
      categoryId,
      addedToStore,
    } = body;

    if (!name || !sellingPrice) {
      return NextResponse.json(
        { error: "Name and selling price are required" },
        { status: 400 }
      );
    }

    const prefix = name
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .split(/\s+/)
      .map((w: string) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 3);
    const random = Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, "0");
    const sku = `FP-${prefix}-${random}`;

    const product = await db.finishedProduct.create({
      data: {
        name,
        sku,
        description: description || null,
        quantityProduced: quantityProduced || 0,
        unitCost: unitCost || 0,
        sellingPrice,
        stockQuantity: stockQuantity || 0,
        minStockLevel: minStockLevel || 5,
        unit: unit || "piece",
        image: image || null,
        categoryId: categoryId || null,
        addedToStore: addedToStore || false,
        branchId: (token.branchId as string) || null,
        createdBy: token.id as string,
      },
      include: {
        category: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(
      {
        ...product,
        sellingPrice: Number(product.sellingPrice),
        unitCost: Number(product.unitCost),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Finished products POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create finished product" },
      { status: 500 }
    );
  }
}
