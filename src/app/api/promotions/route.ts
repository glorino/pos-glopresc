import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const active = searchParams.get("active");

    const where: Record<string, any> = {};

    if (active !== null) {
      where.active = active === "true";
    }

    const promotions = await db.promotion.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(promotions.map((p) => ({
      ...p,
      value: Number(p.value),
      minAmount: p.minAmount ? Number(p.minAmount) : null,
    })));
  } catch (error) {
    console.error("Promotions GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch promotions" },
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
      type,
      value,
      minAmount,
      startDate,
      endDate,
      active,
      maxUsage,
    } = body;

    if (!name || !type || !value || !startDate || !endDate) {
      return NextResponse.json(
        { error: "name, type, value, startDate, and endDate are required" },
        { status: 400 }
      );
    }

    const promotion = await db.promotion.create({
      data: {
        name,
        description: description || null,
        type,
        value: Number(value),
        minAmount: minAmount ? Number(minAmount) : null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        active: active !== undefined ? active : true,
        maxUsage: maxUsage ? Number(maxUsage) : null,
      },
    });

    return NextResponse.json({
      ...promotion,
      value: Number(promotion.value),
      minAmount: promotion.minAmount ? Number(promotion.minAmount) : null,
    }, { status: 201 });
  } catch (error: any) {
    console.error("Promotions POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create promotion" },
      { status: 500 }
    );
  }
}
