import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getToken } from "next-auth/jwt";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request as any });
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const product = await db.finishedProduct.findUnique({
      where: { id },
      include: { category: { select: { id: true, name: true } } },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...product,
      sellingPrice: Number(product.sellingPrice),
      unitCost: Number(product.unitCost),
    });
  } catch (error) {
    console.error("Finished product GET error:", error);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const FINISHED_PRODUCT_ROLES = ["CHIEF_CHEF", "MANAGER", "OWNER"];
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token || !FINISHED_PRODUCT_ROLES.includes(token.role as string)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, quantityProduced, unitCost, sellingPrice, stockQuantity, minStockLevel, unit, image, categoryId, isActive, addedToStore } = body;

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (quantityProduced !== undefined) data.quantityProduced = parseInt(quantityProduced);
    if (unitCost !== undefined) data.unitCost = parseFloat(unitCost);
    if (sellingPrice !== undefined) data.sellingPrice = parseFloat(sellingPrice);
    if (stockQuantity !== undefined) data.stockQuantity = parseInt(stockQuantity);
    if (minStockLevel !== undefined) data.minStockLevel = parseInt(minStockLevel);
    if (unit !== undefined) data.unit = unit;
    if (image !== undefined) data.image = image;
    if (categoryId !== undefined) data.categoryId = categoryId || null;
    if (isActive !== undefined) data.isActive = isActive;
    if (addedToStore !== undefined) data.addedToStore = addedToStore;

    const product = await db.finishedProduct.update({
      where: { id },
      data,
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Finished product PUT error:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const FINISHED_PRODUCT_ROLES = ["CHIEF_CHEF", "MANAGER", "OWNER"];
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token || !FINISHED_PRODUCT_ROLES.includes(token.role as string)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;

    await db.finishedProduct.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Finished product DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
