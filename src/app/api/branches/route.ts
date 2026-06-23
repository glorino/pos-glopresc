import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const where: Record<string, any> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
      ];
    }

    const branches = await db.branch.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { users: true, products: true, sales: true, expenses: true },
        },
        sales: {
          select: { total: true },
        },
      },
    });

    const branchesWithStats = branches.map((branch) => ({
      id: branch.id,
      name: branch.name,
      code: branch.code,
      address: branch.address,
      phone: branch.phone,
      email: branch.email,
      isActive: branch.isActive,
      isDefault: branch.isDefault,
      createdAt: branch.createdAt,
      updatedAt: branch.updatedAt,
      userCount: branch._count.users,
      productCount: branch._count.products,
      saleCount: branch._count.sales,
      expenseCount: branch._count.expenses,
      totalRevenue: branch.sales.reduce((sum, s) => sum + Number(s.total), 0),
    }));

    return NextResponse.json({ branches: branchesWithStats });
  } catch (error) {
    console.error("Branches GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch branches" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, code, address, phone, email, isDefault } = body;

    if (!name || !code) {
      return NextResponse.json(
        { error: "Name and code are required" },
        { status: 400 }
      );
    }

    const existingBranch = await db.branch.findUnique({
      where: { code },
    });
    if (existingBranch) {
      return NextResponse.json(
        { error: "A branch with this code already exists" },
        { status: 409 }
      );
    }

    if (isDefault) {
      await db.branch.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const branch = await db.branch.create({
      data: {
        name,
        code,
        address: address || null,
        phone: phone || null,
        email: email || null,
        isDefault: isDefault || false,
      },
    });

    return NextResponse.json(branch, { status: 201 });
  } catch (error: any) {
    console.error("Branches POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create branch" },
      { status: 500 }
    );
  }
}
