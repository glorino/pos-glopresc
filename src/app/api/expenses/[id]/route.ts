import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth(["OWNER", "MANAGER", "ACCOUNTANT"]);
  if (error) return error;
  try {
    const { id } = await params;
    const body = await request.json();
    const { userId, categoryId, description, amount, date, receipt, notes, status } = body;

    const data: Record<string, any> = {};
    if (userId) data.userId = userId;
    if (categoryId) data.categoryId = categoryId;
    if (description !== undefined) data.description = description;
    if (amount !== undefined) data.amount = amount;
    if (date) data.date = new Date(date);
    if (receipt !== undefined) data.receipt = receipt;
    if (notes !== undefined) data.notes = notes;
    if (status) data.status = status;

    const expense = await db.expense.update({
      where: { id },
      data,
      include: {
        user: { select: { firstName: true, lastName: true } },
        category: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ ...expense, amount: Number(expense.amount) });
  } catch (error: any) {
    console.error("Expense PUT error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update expense" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth(["OWNER", "MANAGER"]);
  if (error) return error;
  try {
    const { id } = await params;

    await db.expense.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Expense deleted successfully" });
  } catch (error: any) {
    console.error("Expense DELETE error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete expense" },
      { status: 500 }
    );
  }
}
