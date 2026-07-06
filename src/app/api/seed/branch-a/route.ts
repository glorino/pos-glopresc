import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const secret = body.secret || request.headers.get("x-seed-secret");
    
    // Simple protection - only allow from server or with secret
    if (secret !== process.env.SEED_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create Branch A if it doesn't exist
    let branchA = await db.branch.findUnique({ where: { code: "BR-001" } });
    if (!branchA) {
      branchA = await db.branch.create({
        data: {
          name: "Branch A",
          code: "BR-001",
          address: "123 Commerce Street, Lagos, Nigeria",
          phone: "+234 800 FFBFHUB",
          email: "brancha@FFBFHUB.com",
          isDefault: true,
        },
      });
    }

    const userEmails = [
      "manager@FFBFHUB.com",
      "warehouse-manager@FFBFHUB.com",
      "warehouse-rep@FFBFHUB.com",
      "procurement-manager@FFBFHUB.com",
      "procurement-rep@FFBFHUB.com",
      "sales-manager@FFBFHUB.com",
      "sales-rep@FFBFHUB.com",
      "accountant@FFBFHUB.com",
      "auditor@FFBFHUB.com",
      "customer@FFBFHUB.com",
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
  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to seed" },
      { status: 500 }
    );
  }
}
