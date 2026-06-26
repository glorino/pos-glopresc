import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getBranchFilter } from "@/lib/branch-filter";
import { getToken } from "next-auth/jwt";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");

    const where: Record<string, any> = {};

    const branchFilter = await getBranchFilter(request);
    if (branchFilter) {
      where.branchId = branchFilter.branchId;
    }

    if (status) where.status = status;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate + "T23:59:59");
    }
    if (search) {
      where.OR = [
        { description: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [expenses, total] = await Promise.all([
      db.expense.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { firstName: true, lastName: true } },
          category: { select: { id: true, name: true } },
        },
      }),
      db.expense.count({ where }),
    ]);

    return NextResponse.json({
      expenses: expenses.map((e) => ({
        ...e,
        amount: Number(e.amount),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Expenses GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, categoryId, description, amount, date, receipt, notes } = body;

    if (!userId || !categoryId || !description || amount === undefined) {
      return NextResponse.json(
        { error: "User ID, category ID, description, and amount are required" },
        { status: 400 }
      );
    }

    const token = await getToken({ req: request as any });
    const branchId = token?.branchId as string | undefined || null;

    const expense = await db.expense.create({
      data: {
        userId,
        categoryId,
        description,
        amount,
        date: date ? new Date(date) : new Date(),
        receipt: receipt || null,
        notes: notes || null,
        branchId: branchId,
      },
      include: {
        user: { select: { firstName: true, lastName: true } },
        category: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(
      { ...expense, amount: Number(expense.amount) },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Expenses POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create expense" },
      { status: 500 }
    );
  }
}
