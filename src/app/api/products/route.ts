import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function generateSKU(name: string): string {
  const prefix = name
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 3);
  const random = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");
  return `${prefix}-${random}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const search = searchParams.get("search");
    const categoryId = searchParams.get("categoryId");
    const isActive = searchParams.get("isActive");

    const where: Record<string, any> = {};

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    if (categoryId) where.categoryId = categoryId;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { barcode: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          category: { select: { id: true, name: true } },
          supplier: { select: { id: true, name: true } },
        },
      }),
      db.product.count({ where }),
    ]);

    return NextResponse.json({
      products: products.map((p) => ({
        ...p,
        price: Number(p.price),
        costPrice: Number(p.costPrice),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Products GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      price,
      costPrice = 0,
      stockQuantity = 0,
      minStockLevel = 5,
      maxStockLevel = 1000,
      unit = "piece",
      barcode,
      image,
      isActive = true,
      isFeatured = false,
      categoryId,
      supplierId,
    } = body;

    if (!name || price === undefined) {
      return NextResponse.json(
        { error: "Name and price are required" },
        { status: 400 }
      );
    }

    const sku = generateSKU(name);

    const product = await db.product.create({
      data: {
        name,
        sku,
        description: description || null,
        price,
        costPrice,
        stockQuantity,
        minStockLevel,
        maxStockLevel,
        unit,
        barcode: barcode || null,
        image: image || null,
        isActive,
        isFeatured,
        categoryId: categoryId || null,
        supplierId: supplierId || null,
      },
      include: {
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(
      {
        ...product,
        price: Number(product.price),
        costPrice: Number(product.costPrice),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Products POST error:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A product with this SKU or barcode already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to create product" },
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
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    if (data.price !== undefined) data.price = Number(data.price);
    if (data.costPrice !== undefined) data.costPrice = Number(data.costPrice);

    const product = await db.product.update({
      where: { id },
      data,
      include: {
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      ...product,
      price: Number(product.price),
      costPrice: Number(product.costPrice),
    });
  } catch (error: any) {
    console.error("Products PUT error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    await db.product.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: "Product deactivated successfully" });
  } catch (error: any) {
    console.error("Products DELETE error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete product" },
      { status: 500 }
    );
  }
}
