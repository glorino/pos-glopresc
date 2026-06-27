import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const openDrawer = await db.cashDrawer.findFirst({
      where: { status: "OPEN", userId: session.user.id },
      orderBy: { openedAt: "desc" },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
    });

    const recentDrawers = await db.cashDrawer.findMany({
      take: 10,
      orderBy: { openedAt: "desc" },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({
      openDrawer: openDrawer
        ? {
            ...openDrawer,
            openingBalance: Number(openDrawer.openingBalance),
            closingBalance: openDrawer.closingBalance ? Number(openDrawer.closingBalance) : null,
            actualBalance: openDrawer.actualBalance ? Number(openDrawer.actualBalance) : null,
            difference: openDrawer.difference ? Number(openDrawer.difference) : null,
            cashier: `${openDrawer.user.firstName} ${openDrawer.user.lastName}`,
          }
        : null,
      recentDrawers: recentDrawers.map((d) => ({
        id: d.id,
        openingBalance: Number(d.openingBalance),
        closingBalance: d.closingBalance ? Number(d.closingBalance) : null,
        actualBalance: d.actualBalance ? Number(d.actualBalance) : null,
        difference: d.difference ? Number(d.difference) : null,
        status: d.status,
        cashier: `${d.user.firstName} ${d.user.lastName}`,
        openedAt: d.openedAt.toISOString(),
        closedAt: d.closedAt?.toISOString() ?? null,
      })),
    });
  } catch (error) {
    console.error("Cash drawer GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cash drawer" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingOpen = await db.cashDrawer.findFirst({
      where: { status: "OPEN", userId: session.user.id },
    });

    if (existingOpen) {
      return NextResponse.json(
        { error: "A cash drawer is already open. Close it before opening a new one.", openDrawerId: existingOpen.id },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { openingBalance } = body;

    if (openingBalance === undefined || openingBalance < 0) {
      return NextResponse.json(
        { error: "A valid opening balance is required" },
        { status: 400 }
      );
    }

    const drawer = await db.cashDrawer.create({
      data: {
        userId: session.user.id,
        openingBalance: Number(openingBalance),
        status: "OPEN",
      },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "OPEN_DRAWER",
        resource: "cash_drawer",
        resourceId: drawer.id,
        details: { openingBalance: Number(openingBalance) },
      },
    });

    return NextResponse.json(
      {
        ...drawer,
        openingBalance: Number(drawer.openingBalance),
        cashier: `${drawer.user.firstName} ${drawer.user.lastName}`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Cash drawer POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to open cash drawer" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { drawerId, closingBalance, actualBalance } = body;

    if (closingBalance === undefined || actualBalance === undefined) {
      return NextResponse.json(
        { error: "Closing balance and actual balance are required" },
        { status: 400 }
      );
    }

    const openDrawer = drawerId
      ? await db.cashDrawer.findUnique({ where: { id: drawerId } })
      : await db.cashDrawer.findFirst({ where: { status: "OPEN", userId: session.user.id } });

    if (!openDrawer) {
      return NextResponse.json(
        { error: "No open cash drawer found" },
        { status: 404 }
      );
    }

    const difference = Number(actualBalance) - Number(closingBalance);

    const drawer = await db.cashDrawer.update({
      where: { id: openDrawer.id },
      data: {
        closingBalance: Number(closingBalance),
        actualBalance: Number(actualBalance),
        difference,
        status: "CLOSED",
        closedAt: new Date(),
      },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CLOSE_DRAWER",
        resource: "cash_drawer",
        resourceId: drawer.id,
        details: {
          closingBalance: Number(closingBalance),
          actualBalance: Number(actualBalance),
          difference,
        },
      },
    });

    return NextResponse.json({
      ...drawer,
      openingBalance: Number(drawer.openingBalance),
      closingBalance: Number(drawer.closingBalance),
      actualBalance: Number(drawer.actualBalance),
      difference,
      cashier: `${drawer.user.firstName} ${drawer.user.lastName}`,
    });
  } catch (error: any) {
    console.error("Cash drawer PUT error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to close cash drawer" },
      { status: 500 }
    );
  }
}
