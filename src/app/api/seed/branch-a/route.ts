import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const secret = body.secret || request.headers.get("x-seed-secret");
    
    if (secret !== process.env.SEED_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let branchA = await db.branch.findUnique({ where: { code: "BR-001" } });
    if (!branchA) {
      branchA = await db.branch.create({
        data: {
          name: "Branch A",
          code: "BR-001",
          address: "123 Commerce Street, Lagos, Nigeria",
          phone: "+234 800 SSVSHOP",
          email: "brancha@ssvshop.com",
          isDefault: true,
        },
      });
    }

    const userEmails = [
      "manager@ssvshop.com",
      "warehouse-manager@ssvshop.com",
      "warehouse-rep@ssvshop.com",
      "procurement-manager@ssvshop.com",
      "procurement-rep@ssvshop.com",
      "sales-manager@ssvshop.com",
      "sales-rep@ssvshop.com",
      "accountant@ssvshop.com",
      "auditor@ssvshop.com",
      "customer@ssvshop.com",
    ];

    const results = [];
    for (const email of userEmails) {
      const user = await db.user.findUnique({ where: { email } });
      if (user) {
        await db.user.update({
          where: { email },
          data: { branchId: branchA.id },
        });
        results.push({ email, status: "assigned" });
      } else {
        results.push({ email, status: "not found" });
      }
    }

    return NextResponse.json({
      branch: { id: branchA.id, name: branchA.name, code: branchA.code },
      users: results,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to seed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
