import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const risks = await db.riskAssessment.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(risks);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { area, riskLevel, score } = body;

  if (!area || !riskLevel || score === undefined) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const risk = await db.riskAssessment.create({
    data: { area, riskLevel, score: parseInt(score) },
  });

  return NextResponse.json(risk, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, ...data } = body;

  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const risk = await db.riskAssessment.update({ where: { id }, data });
  return NextResponse.json(risk);
}
