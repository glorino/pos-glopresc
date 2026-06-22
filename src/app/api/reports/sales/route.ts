import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const groupBy = searchParams.get("groupBy") ?? "day";

    const where: Record<string, any> = { status: "COMPLETED" };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate + "T23:59:59");
    }

    const dateConditions = Prisma.sql`
      AND "createdAt" >= ${startDate ? new Date(startDate) : new Date("2000-01-01")}
      AND "createdAt" <= ${endDate ? new Date(endDate + "T23:59:59") : new Date()}
    `;

    const groupExpr =
      groupBy === "week"
        ? `TO_CHAR("createdAt", 'IYYY-"W"IW')`
        : groupBy === "month"
        ? `TO_CHAR("createdAt", 'YYYY-MM')`
        : `TO_CHAR("createdAt", 'YYYY-MM-DD')`;

    const [
      totalSalesResult,
      totalTransactions,
      salesByPeriod,
      paymentMethodBreakdown,
      topProducts,
      salesByHour,
      recentSales,
    ] = await Promise.all([
      db.sale.aggregate({
        _sum: { total: true, discount: true, tax: true, subtotal: true },
        _avg: { total: true },
        where,
      }),
      db.sale.count({ where }),
      db.$queryRaw<{ period: string; revenue: number; count: number }[]>(Prisma.sql`
        SELECT
          ${Prisma.raw(groupExpr)} AS period,
          SUM("total")::float AS revenue,
          COUNT(*)::int AS count
        FROM "Sale"
        WHERE "status" = 'COMPLETED' ${dateConditions}
        GROUP BY period
        ORDER BY period ASC
      `),
      db.sale.groupBy({
        by: ["paymentMethod"],
        _sum: { total: true },
        _count: true,
        where,
      }),
      db.saleItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true, total: true },
        _count: true,
        orderBy: { _sum: { total: "desc" } },
        take: 10,
      }),
      db.$queryRaw<{ hour: number; count: number; revenue: number }[]>(Prisma.sql`
        SELECT
          EXTRACT(HOUR FROM "createdAt")::int AS hour,
          COUNT(*)::int AS count,
          SUM("total")::float AS revenue
        FROM "Sale"
        WHERE "status" = 'COMPLETED' ${dateConditions}
        GROUP BY hour
        ORDER BY hour ASC
      `),
      db.sale.findMany({
        where,
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { firstName: true, lastName: true } },
          customer: { select: { firstName: true, lastName: true } },
          items: { include: { product: { select: { name: true } } } },
        },
      }),
    ]);

    const resolvedTopProducts = await Promise.all(
      topProducts.map(async (tp) => {
        const product = await db.product.findUnique({
          where: { id: tp.productId },
          select: { name: true, sku: true, price: true },
        });
        return {
          name: product?.name ?? "Unknown",
          sku: product?.sku ?? "",
          totalSold: tp._sum.quantity ?? 0,
          totalRevenue: Number(tp._sum.total ?? 0),
          transactionCount: tp._count,
        };
      })
    );

    const paymentBreakdown = paymentMethodBreakdown.map((pm) => ({
      method: pm.paymentMethod,
      total: Number(pm._sum.total ?? 0),
      count: pm._count,
    }));

    const totalRevenue = Number(totalSalesResult._sum.total ?? 0);
    const totalDiscount = Number(totalSalesResult._sum.discount ?? 0);
    const totalTax = Number(totalSalesResult._sum.tax ?? 0);
    const avgSaleValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalDiscount,
        totalTax,
        totalTransactions,
        avgSaleValue,
      },
      salesByPeriod: salesByPeriod.map((s) => ({
        period: s.period,
        revenue: Number(s.revenue),
        count: s.count,
      })),
      paymentBreakdown,
      topProducts: resolvedTopProducts,
      salesByHour: salesByHour.map((s) => ({
        hour: s.hour,
        count: s.count,
        revenue: Number(s.revenue),
      })),
      recentSales: recentSales.map((s) => ({
        id: s.id,
        invoiceNumber: s.invoiceNumber,
        cashier: `${s.user.firstName} ${s.user.lastName}`,
        customer: s.customer
          ? `${s.customer.firstName} ${s.customer.lastName}`
          : "Walk-in",
        subtotal: Number(s.subtotal),
        discount: Number(s.discount),
        tax: Number(s.tax),
        total: Number(s.total),
        paymentMethod: s.paymentMethod,
        createdAt: s.createdAt.toISOString(),
        items: s.items.map((i) => ({
          name: i.product.name,
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice),
          total: Number(i.total),
        })),
      })),
    });
  } catch (error) {
    console.error("Sales report GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales report" },
      { status: 500 }
    );
  }
}
