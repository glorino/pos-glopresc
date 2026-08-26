import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const defaultCategories = [
  "Rent",
  "Utilities",
  "Salaries",
  "Office Supplies",
  "Marketing",
  "Transportation",
  "Maintenance",
  "Insurance",
  "Tax",
  "Other",
];

export async function GET() {
  try {
    const dbCategories = await db.expenseCategory.findMany({
      orderBy: { name: "asc" },
    });

    if (dbCategories.length > 0) {
      return NextResponse.json({
        categories: dbCategories.map((c) => c.name),
      });
    }

    // Seed default categories if none exist
    for (const name of defaultCategories) {
      await db.expenseCategory.upsert({
        where: { id: name },
        update: {},
        create: { id: name, name },
      });
    }

    return NextResponse.json({ categories: defaultCategories });
  } catch (error) {
    console.error("Failed to fetch expense categories:", error);
    return NextResponse.json({ categories: defaultCategories });
  }
}
