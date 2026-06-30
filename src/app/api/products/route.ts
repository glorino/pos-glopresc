import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getToken } from "next-auth/jwt";
import { getBranchFilter } from "@/lib/branch-filter";

const PRODUCT_ROLES = ["OWNER", "MANAGER", "WAREHOUSE_MANAGER"];

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

    const isPublic = searchParams.get("public") === "true";
    if (!isPublic) {
      const branchFilter = await getBranchFilter(request);
      if (branchFilter) {
        where.AND = [branchFilter];
      }
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
      "Food & Snacks": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop",
      "Beverages": "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop",
      "Electronics": "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400&h=300&fit=crop",
      "Fashion": "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=300&fit=crop",
      "Health & Beauty": "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=300&fit=crop",
      "Home & Kitchen": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop",
    };

    return NextResponse.json({
      products: products.map((p) => ({
        ...p,
        price: Number(p.price),
        costPrice: Number(p.costPrice),
        image: p.image || categoryImageMap[p.category?.name as string] || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop",
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
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !PRODUCT_ROLES.includes(token.role as string)) {
      return NextResponse.json({ error: "Unauthorized: Only owners, managers, and warehouse managers can manage products" }, { status: 403 });
    }

    const branchId = token.branchId as string | undefined;

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
        branchId: branchId || null,
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
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !PRODUCT_ROLES.includes(token.role as string)) {
      return NextResponse.json({ error: "Unauthorized: Only owners, managers, and warehouse managers can manage products" }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...rawData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    const ALLOWED_FIELDS = ["name", "description", "price", "costPrice", "stockQuantity", "minStockLevel", "maxStockLevel", "unit", "barcode", "image", "isActive", "isFeatured", "categoryId", "supplierId"] as const;
    const data: Record<string, any> = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in rawData) data[key] = rawData[key];
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
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !PRODUCT_ROLES.includes(token.role as string)) {
      return NextResponse.json({ error: "Unauthorized: Only owners, managers, and warehouse managers can manage products" }, { status: 403 });
    }

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
