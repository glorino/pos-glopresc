import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const settings = await db.setting.findMany({
      where: { key: { startsWith: "shipping." } },
    });

    const shipping: Record<string, string> = {};
    for (const s of settings) {
      const key = s.key.replace("shipping.", "");
      shipping[key] = s.value;
    }

    return NextResponse.json({
      originAddress: shipping.originAddress || "",
      ratePerKm: Number(shipping.ratePerKm) || 100,
      minFee: Number(shipping.minFee) || 500,
      freeShippingThreshold: Number(shipping.freeShippingThreshold) || 0,
    });
  } catch {
    return NextResponse.json({
      originAddress: "",
      ratePerKm: 100,
      minFee: 500,
      freeShippingThreshold: 0,
    });
  }
}
