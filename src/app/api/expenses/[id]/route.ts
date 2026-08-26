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

    const data: Record<string, unknown> = {};
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

    if (status === "APPROVED" || status === "REJECTED") {
      const authSession = await requireAuth(["OWNER", "MANAGER", "ACCOUNTANT"]);
      if (!authSession.error && authSession.session?.user) {
        const approverId = (authSession.session.user as { id: string }).id;

        await db.expenseApproval.create({
          data: {
            expenseId: id,
            userId: approverId,
            status: status === "APPROVED" ? "APPROVED" : "REJECTED",
            notes: notes || null,
          },
        });

        const expenseUser = await db.user.findUnique({ where: { id: expense.userId } });
        if (expenseUser) {
          await db.notification.create({
            data: {
              userId: expense.userId,
              title: `Expense ${status}`,
              message: `Your expense of ${Number(expense.amount)} has been ${status.toLowerCase()}.`,
              type: status === "APPROVED" ? "SUCCESS" : "WARNING",
            },
          });
        }
      }
    }

    return NextResponse.json({ ...expense, amount: Number(expense.amount) });
  } catch (error: unknown) {
    console.error("Expense PUT error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update expense" },
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
  } catch (error: unknown) {
    console.error("Expense DELETE error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete expense" },
      { status: 500 }
    );
  }
}
