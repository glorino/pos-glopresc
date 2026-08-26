import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const { error } = await requireAuth(["OWNER", "MANAGER", "WAREHOUSE_MANAGER", "WAREHOUSE_REP", "CHIEF_CHEF", "SALES_MANAGER", "SALES_REP"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const lowStock = searchParams.get("lowStock");

    const where: Record<string, unknown> = { isActive: true };

    if (lowStock === "true") {
      where.stockQuantity = { lte: 10 };
    }

    const products = await db.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        sku: true,
        stockQuantity: true,
        minStockLevel: true,
        unit: true,
        category: { select: { name: true } },
      },
      orderBy: { stockQuantity: "asc" },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Inventory stock GET error:", error);
    return NextResponse.json({ error: "Failed to fetch stock" }, { status: 500 });
  }
}
