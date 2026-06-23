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

    const categoryImageMap: Record<string, string> = {
      "Food & Snacks": "https://placehold.co/400x300/2d1f0e/f59e0b?text=Food",
      "Beverages": "https://placehold.co/400x300/0f1a2e/3b82f6?text=Beverage",
      "Electronics": "https://placehold.co/400x300/1a0f2e/8b5cf6?text=Electronics",
      "Fashion": "https://placehold.co/400x300/2e0f1a/ec4899?text=Fashion",
      "Health & Beauty": "https://placehold.co/400x300/0f2e1a/10b981?text=Health",
      "Home & Kitchen": "https://placehold.co/400x300/2e2a0f/f59e0b?text=Home",
    };

    return NextResponse.json({
      products: products.map((p) => ({
        ...p,
        price: Number(p.price),
        costPrice: Number(p.costPrice),
        image: p.image || categoryImageMap[p.category?.name as string] || "https://placehold.co/400x300/1a1a2e/d4a843?text=Product",
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

    if (stockQuantity <= minStockLevel) {
      const procurementUsers = await db.user.findMany({
        where: {
          isActive: true,
          role: { in: ["PROCUREMENT_MANAGER", "PROCUREMENT_REP"] },
        },
        select: { id: true },
      });
      if (procurementUsers.length > 0) {
        await db.notification.createMany({
          data: procurementUsers.map((u) => ({
            userId: u.id,
            title: "Low Stock Alert",
            message: `${product.name} (${product.sku}) is below minimum stock level. Current: ${stockQuantity}, Min: ${minStockLevel}`,
            type: "WARNING" as const,
            link: "/dashboard/inventory/stock",
          })),
        });
      }
    }

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
