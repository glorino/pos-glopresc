import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const userId = searchParams.get("userId");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (userId) where.userId = userId;

  // Non-admins can only see their own
  const role = (session.user as { role?: string }).role;
  if (!["OWNER", "MANAGER", "HR_MANAGER"].includes(role || "")) {
    where.userId = (session.user as { id?: string }).id;
  }

  const requests = await db.leaveRequest.findMany({
    where,
    include: { user: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(requests);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { type, startDate, endDate, reason } = body;

  if (!type || !startDate || !endDate) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    return NextResponse.json({ error: "User ID not found in session" }, { status: 400 });
  }

  const request = await db.leaveRequest.create({
    data: {
      userId,
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      status: "PENDING",
    },
  });

  return NextResponse.json(request, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: string }).role;
  if (!["OWNER", "MANAGER", "HR_MANAGER"].includes(role || "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { id, status: newStatus } = body;

  if (!id || !newStatus) {
    return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
  }

  const request = await db.leaveRequest.update({
    where: { id },
    data: {
      status: newStatus,
      approvedBy: (session.user as { id?: string }).id,
    },
  });

  // Notify the employee
  await db.notification.create({
    data: {
      userId: request.userId,
      title: `Leave Request ${newStatus}`,
      message: `Your leave request has been ${newStatus.toLowerCase()}.`,
      type: newStatus === "APPROVED" ? "SUCCESS" : "WARNING",
    },
  });

  return NextResponse.json(request);
}
