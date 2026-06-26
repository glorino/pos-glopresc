import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const secret = body.secret || request.headers.get("x-seed-secret");
    
    // Simple protection - only allow from server or with secret
    if (secret !== "ssv-shop-seed-2024") {
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
  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to seed" },
      { status: 500 }
    );
  }
}
