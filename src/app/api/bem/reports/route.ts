import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

export async function GET() {
  const { error } = await requireAuth(["OWNER", "MANAGER", "BUSINESS_EFFICIENCY_MANAGER"]);
  if (error) return error;

  try {
    const sales = await db.sale.findMany({
      where: { status: "COMPLETED" },
      select: { total: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total), 0);
    const avgOrderValue = sales.length > 0 ? totalRevenue / sales.length : 0;

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const thisMonthSales = sales.filter((s) => s.createdAt >= thisMonth);
    const thisMonthRevenue = thisMonthSales.reduce((sum, s) => sum + Number(s.total), 0);

    const reports = [
      {
        id: "1",
        title: "Monthly Revenue Summary",
        score: Math.min(100, Math.round(thisMonthRevenue / 100)),
        date: new Date().toISOString().split("T")[0],
        category: "Revenue",
        status: "ACTIVE",
      },
      {
        id: "2",
        title: "Order Efficiency Report",
        score: Math.min(100, Math.round(avgOrderValue / 50)),
        date: new Date().toISOString().split("T")[0],
        category: "Operations",
        status: "ACTIVE",
      },
      {
        id: "3",
        title: "Process Throughput Analysis",
        score: Math.min(100, Math.round(sales.length / 10)),
        date: new Date().toISOString().split("T")[0],
        category: "Efficiency",
        status: "ACTIVE",
      },
    ];

    return NextResponse.json(reports);
  } catch (error) {
    console.error("BEM reports GET error:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}
