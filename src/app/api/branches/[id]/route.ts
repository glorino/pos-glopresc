import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const branch = await db.branch.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true, products: true, sales: true, expenses: true },
        },
      },
    });

    if (!branch) {
      return NextResponse.json(
        { error: "Branch not found" },
        { status: 404 }
      );
    }

    const users = await db.user.findMany({
      where: { branchId: id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        branchId: true,
      },
    });

    return NextResponse.json({
      ...branch,
      users,
      userCount: branch._count.users,
      productCount: branch._count.products,
      saleCount: branch._count.sales,
      expenseCount: branch._count.expenses,
    });
  } catch (error) {
    console.error("Branch GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch branch" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAuth(["OWNER", "MANAGER"]);
  if (error) return error;
  try {
    const { id } = params;
    const body = await request.json();
    const { name, code, address, phone, email, isActive, isDefault } = body;

    const existingBranch = await db.branch.findUnique({ where: { id } });
    if (!existingBranch) {
      return NextResponse.json(
        { error: "Branch not found" },
        { status: 404 }
      );
    }

    if (code && code !== existingBranch.code) {
      const codeExists = await db.branch.findUnique({ where: { code } });
      if (codeExists) {
        return NextResponse.json(
          { error: "A branch with this code already exists" },
          { status: 409 }
        );
      }
    }

    if (isDefault) {
      await db.branch.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const branch = await db.branch.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existingBranch.name,
        code: code !== undefined ? code : existingBranch.code,
        address: address !== undefined ? address : existingBranch.address,
        phone: phone !== undefined ? phone : existingBranch.phone,
        email: email !== undefined ? email : existingBranch.email,
        isActive: isActive !== undefined ? isActive : existingBranch.isActive,
        isDefault: isDefault !== undefined ? isDefault : existingBranch.isDefault,
      },
    });

    return NextResponse.json(branch);
  } catch (error: any) {
    console.error("Branch PUT error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update branch" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAuth(["OWNER"]);
  if (error) return error;
  try {
    const { id } = params;

    const branch = await db.branch.findUnique({ where: { id } });
    if (!branch) {
      return NextResponse.json(
        { error: "Branch not found" },
        { status: 404 }
      );
    }

    if (branch.isDefault) {
      return NextResponse.json(
        { error: "Cannot delete the default branch" },
        { status: 400 }
      );
    }

    await db.branch.delete({ where: { id } });

    return NextResponse.json({ message: "Branch deleted successfully" });
  } catch (error: any) {
    console.error("Branch DELETE error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete branch" },
      { status: 500 }
    );
  }
}
