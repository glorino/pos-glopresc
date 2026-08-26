import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const incidents = await db.incident.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(incidents);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, severity, description } = body;

  if (!title || !severity) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const incident = await db.incident.create({
    data: {
      title,
      severity,
      description: description || null,
      status: "REPORTED",
      reportedBy: (session.user as { id: string }).id,
    },
  });

  // Notify all managers
  const managers = await db.user.findMany({
    where: { role: { in: ["OWNER", "MANAGER", "BUSINESS_CONTINUITY_MANAGER"] }, isActive: true },
  });
  for (const m of managers) {
    await db.notification.create({
      data: {
        userId: m.id,
        title: "New Incident Reported",
        message: `${title} (${severity})`,
        type: severity === "CRITICAL" ? "ERROR" : "WARNING",
      },
    });
  }

  return NextResponse.json(incident, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, status: newStatus } = body;

  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const incident = await db.incident.update({
    where: { id },
    data: { status: newStatus || undefined },
  });

  return NextResponse.json(incident);
}
