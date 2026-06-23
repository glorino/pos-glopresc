import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { userId, categoryId, description, amount, date, receipt, notes, status } = body;

    const expense = await db.expense.update({
      where: { id },
      data: {
        ...(userId && { userId }),
        ...(categoryId && { categoryId }),
        ...(description && { description }),
        ...(amount !== undefined && { amount }),
        ...(date && { date: new Date(date) }),
        ...(receipt !== undefined && { receipt }),
        ...(notes !== undefined && { notes }),
        ...(status && { status }),
      },
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
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

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
