import { NextResponse } from "next/server";

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
  return NextResponse.json({ categories: defaultCategories });
}
