import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const productImages: Record<string, string> = {
  // Food & Snacks
  "FD-001": "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400&h=300&fit=crop",
  "FD-002": "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400&h=300&fit=crop",
  "FD-003": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop",
  "FD-004": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop",
  "FD-005": "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400&h=300&fit=crop",
  "FD-006": "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=300&fit=crop",
  "FD-007": "https://images.unsplash.com/photo-1579932263233-c4e7e940e0f2?w=400&h=300&fit=crop",
  "FD-008": "https://images.unsplash.com/photo-1558024920-b41e1887dc32?w=400&h=300&fit=crop",

  // Beverages
  "BV-001": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&h=300&fit=crop",
  "BV-002": "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400&h=300&fit=crop",
  "BV-003": "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=300&fit=crop",
  "BV-004": "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=300&fit=crop",
  "BV-005": "https://images.unsplash.com/photo-1622542086126-92f789f41f8e?w=400&h=300&fit=crop",
  "BV-006": "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&h=300&fit=crop",
  "BV-007": "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&h=300&fit=crop",

  // Electronics
  "EL-001": "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=300&fit=crop",
  "EL-002": "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop",
  "EL-003": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&h=300&fit=crop",
  "EL-004": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&h=300&fit=crop",
  "EL-005": "https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=400&h=300&fit=crop",
  "EL-006": "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=400&h=300&fit=crop",
  "EL-007": "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&h=300&fit=crop",
  "EL-008": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop",

  // Fashion
  "FS-001": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop",
  "FS-002": "https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=400&h=300&fit=crop",
  "FS-003": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop",
  "FS-004": "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=300&fit=crop",
  "FS-005": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=300&fit=crop",

  // Health & Beauty
  "HB-001": "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=300&fit=crop",
  "HB-002": "https://images.unsplash.com/photo-1584483766114-2cea6facdf57?w=400&h=300&fit=crop",
  "HB-003": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=300&fit=crop",
  "HB-004": "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400&h=300&fit=crop",
  "HB-005": "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=300&fit=crop",

  // Home & Kitchen
  "HK-001": "https://images.unsplash.com/photo-1585837146751-a44118595098?w=400&h=300&fit=crop",
  "HK-002": "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=400&h=300&fit=crop",
  "HK-003": "https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&h=300&fit=crop",
  "HK-004": "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400&h=300&fit=crop",
  "HK-005": "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400&h=300&fit=crop",
};

export async function POST() {
  try {
    let updated = 0;
    for (const [sku, image] of Object.entries(productImages)) {
      const result = await db.product.updateMany({
        where: { sku },
        data: { image },
      });
      updated += result.count;
    }
    return NextResponse.json({ message: `Updated ${updated} products with images`, updated });
  } catch (error) {
    console.error("Seed images error:", error);
    return NextResponse.json({ error: "Failed to update images" }, { status: 500 });
  }
}
