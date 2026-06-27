import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;
  try {
    const categories = await db.category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { products: true } },
      },
    });

    return NextResponse.json({
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        image: c.image,
        isActive: c.isActive,
        productCount: c._count.products,
        _count: { products: c._count.products },
      })),
    });
  } catch (error) {
    console.error("Categories GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAuth(["OWNER", "MANAGER", "WAREHOUSE_MANAGER"]);
  if (error) return error;
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    const category = await db.category.create({
      data: {
        name,
        description: description || null,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    console.error("Categories POST error:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A category with this name already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to create category" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const { error } = await requireAuth(["OWNER", "MANAGER", "WAREHOUSE_MANAGER"]);
  if (error) return error;
  try {
    const body = await request.json();
    const { id, ...rawData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    const ALLOWED_FIELDS = ["name", "description", "image", "isActive"] as const;
    const data: Record<string, any> = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in rawData) data[key] = rawData[key];
    }

    const category = await db.category.update({
      where: { id },
      data,
    });

    return NextResponse.json(category);
  } catch (error: any) {
    console.error("Categories PUT error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update category" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { error } = await requireAuth(["OWNER", "MANAGER"]);
  if (error) return error;
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    const productCount = await db.product.count({
      where: { categoryId: id, isActive: true },
    });

    if (productCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete category. ${productCount} product(s) are assigned to it.`,
        },
        { status: 400 }
      );
    }

    await db.category.delete({ where: { id } });

    return NextResponse.json({ message: "Category deleted successfully" });
  } catch (error: any) {
    console.error("Categories DELETE error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete category" },
      { status: 500 }
    );
  }
}
