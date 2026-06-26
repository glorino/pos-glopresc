import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const status = searchParams.get("status");
    const urgency = searchParams.get("urgency");
    const search = searchParams.get("search");

    const where: Record<string, any> = {};

    if (status) where.status = status;
    if (urgency) where.urgency = urgency;

    if (search) {
      where.OR = [
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [supplyRequests, total] = await Promise.all([
      db.supplyRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          supplier: { select: { id: true, name: true } },
        },
      }),
      db.supplyRequest.count({ where }),
    ]);

    return NextResponse.json({
      supplyRequests,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Supply Requests GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch supply requests" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role as string;
    const userId = (session.user as any).id as string;

    const allowedRoles = ["WAREHOUSE_REP", "WAREHOUSE_MANAGER", "PROCUREMENT_REP", "PROCUREMENT_MANAGER"];
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { error: "Only warehouse and procurement staff can create supply requests" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { supplierId, description, urgency, expectedDate } = body;

    if (!supplierId || !description) {
      return NextResponse.json(
        { error: "Supplier and description are required" },
        { status: 400 }
      );
    }

    const supplyRequest = await db.supplyRequest.create({
      data: {
        supplierId,
        requestedBy: userId,
        description,
        urgency: urgency || "NORMAL",
        expectedDate: expectedDate ? new Date(expectedDate) : null,
      },
      include: {
        supplier: { select: { id: true, name: true } },
      },
    });

    const procurementUsers = await db.user.findMany({
      where: {
        isActive: true,
        role: { in: ["PROCUREMENT_MANAGER", "PROCUREMENT_REP"] },
      },
      select: { id: true },
    });

    if (procurementUsers.length > 0) {
      await db.notification.createMany({
        data: procurementUsers.map((u) => ({
          userId: u.id,
          title: "New Supply Request",
          message: `A new supply request has been submitted: ${description.substring(0, 80)}`,
          type: "INFO" as const,
          link: "/dashboard/procurement/stock-requests",
        })),
      });
    }

    return NextResponse.json(supplyRequest, { status: 201 });
  } catch (error: any) {
    console.error("Supply Requests POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create supply request" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role as string;
    const userId = (session.user as any).id as string;

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: "ID and status are required" },
        { status: 400 }
      );
    }

    const procurementRoles = ["PROCUREMENT_MANAGER", "PROCUREMENT_REP"];
    if (!procurementRoles.includes(userRole)) {
      return NextResponse.json(
        { error: "Only procurement staff can approve/reject supply requests" },
        { status: 403 }
      );
    }

    const validStatuses = ["APPROVED", "REJECTED", "ORDERED", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const supplyRequest = await db.supplyRequest.update({
      where: { id },
      data: { status },
      include: {
        supplier: { select: { id: true, name: true } },
      },
    });

    const requester = await db.user.findUnique({
      where: { id: supplyRequest.requestedBy },
      select: { id: true, firstName: true, lastName: true },
    });

    if (requester) {
      await db.notification.create({
        data: {
          userId: requester.id,
          title: `Supply Request ${status}`,
          message: `Your supply request "${supplyRequest.description.substring(0, 60)}" has been ${status.toLowerCase()}.`,
          type: status === "APPROVED" ? "SUCCESS" : status === "REJECTED" ? "ERROR" : "INFO",
          link: "/dashboard/procurement/stock-requests",
        },
      });
    }

    return NextResponse.json(supplyRequest);
  } catch (error: any) {
    console.error("Supply Requests PATCH error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update supply request" },
      { status: 500 }
    );
  }
}
