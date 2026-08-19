import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    const where: Record<string, any> = {};

    if (productId) where.productId = productId;

    const reviews = await db.productReview.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          select: { id: true, name: true, sku: true },
        },
        customer: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Product reviews GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch product reviews" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, customerId, rating, comment } = body;

    if (!productId || !customerId || rating === undefined) {
      return NextResponse.json(
        { error: "productId, customerId, and rating are required" },
        { status: 400 }
      );
    }

    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "rating must be a number between 1 and 5" },
        { status: 400 }
      );
    }

    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const customer = await db.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    const review = await db.productReview.upsert({
      where: {
        productId_customerId: { productId, customerId },
      },
      update: {
        rating,
        comment: comment || null,
      },
      create: {
        productId,
        customerId,
        rating,
        comment: comment || null,
      },
      include: {
        product: {
          select: { id: true, name: true, sku: true },
        },
        customer: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error: any) {
    console.error("Product reviews POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create product review" },
      { status: 500 }
    );
  }
}
