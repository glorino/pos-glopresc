import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const productImages: Record<string, string> = {
  "FD-001": "https://placehold.co/400x300/2d1f0e/f59e0b?text=Indomie+Noodles",
  "FD-002": "https://placehold.co/400x300/2d1f0e/f59e0b?text=Indomie+Single",
  "FD-003": "https://placehold.co/400x300/2d1f0e/f59e0b?text=Mama+Gold+Rice",
  "FD-004": "https://placehold.co/400x300/2d1f0e/f59e0b?text=Topic+Rice",
  "FD-005": "https://placehold.co/400x300/2d1f0e/f59e0b?text=Knorr+Chicken",
  "FD-006": "https://placehold.co/400x300/2d1f0e/f59e0b?text=Peak+Milk",
  "FD-007": "https://placehold.co/400x300/2d1f0e/f59e0b?text=Bournvita",
  "FD-008": "https://placehold.co/400x300/2d1f0e/f59e0b?text=Golden+Morn",
  "BV-001": "https://placehold.co/400x300/0f1a2e/3b82f6?text=Pepsi+50cl",
  "BV-002": "https://placehold.co/400x300/0f1a2e/3b82f6?text=Coca-Cola",
  "BV-003": "https://placehold.co/400x300/0f1a2e/3b82f6?text=Fanta+Orange",
  "BV-004": "https://placehold.co/400x300/0f1a2e/3b82f6?text=Eva+Water",
  "BV-005": "https://placehold.co/400x300/0f1a2e/3b82f6?text=Monster+Energy",
  "BV-006": "https://placehold.co/400x300/0f1a2e/3b82f6?text=Star+Beer",
  "BV-007": "https://placehold.co/400x300/0f1a2e/3b82f6?text=Gulder+Lager",
  "EL-001": "https://placehold.co/400x300/1a0f2e/8b5cf6?text=Samsung+A14",
  "EL-002": "https://placehold.co/400x300/1a0f2e/8b5cf6?text=iPhone+14",
  "EL-003": "https://placehold.co/400x300/1a0f2e/8b5cf6?text=Tecno+Spark+10",
  "EL-004": "https://placehold.co/400x300/1a0f2e/8b5cf6?text=Infinix+Hot+30",
  "EL-005": "https://placehold.co/400x300/1a0f2e/8b5cf6?text=Galaxy+Buds",
  "EL-006": "https://placehold.co/400x300/1a0f2e/8b5cf6?text=AirPods+Pro",
  "EL-007": "https://placehold.co/400x300/1a0f2e/8b5cf6?text=Anker+PowerBank",
  "EL-008": "https://placehold.co/400x300/1a0f2e/8b5cf6?text=Infinix+XPad",
  "FS-001": "https://placehold.co/400x300/2e0f1a/ec4899?text=Nike+Air+Max",
  "FS-002": "https://placehold.co/400x300/2e0f1a/ec4899?text=Adidas+Superstar",
  "FS-003": "https://placehold.co/400x300/2e0f1a/ec4899?text=Gucci+Belt",
  "FS-004": "https://placehold.co/400x300/2e0f1a/ec4899?text=Levis+Jeans",
  "FS-005": "https://placehold.co/400x300/2e0f1a/ec4899?text=Polo+T-Shirt",
  "HB-001": "https://placehold.co/400x300/0f2e1a/10b981?text=Nivea+Lotion",
  "HB-002": "https://placehold.co/400x300/0f2e1a/10b981?text=Dettol+Antiseptic",
  "HB-003": "https://placehold.co/400x300/0f2e1a/10b981?text=Vitamin+C",
  "HB-004": "https://placehold.co/400x300/0f2e1a/10b981?text=Dove+Shampoo",
  "HB-005": "https://placehold.co/400x300/0f2e1a/10b981?text=Paracetamol",
  "HK-001": "https://placehold.co/400x300/2e2a0f/f59e0b?text=Pressure+Cooker",
  "HK-002": "https://placehold.co/400x300/2e2a0f/f59e0b?text=Binatone+Blender",
  "HK-003": "https://placehold.co/400x300/2e2a0f/f59e0b?text=Cast+Iron+Pot",
  "HK-004": "https://placehold.co/400x300/2e2a0f/f59e0b?text=Thermocool+Fridge",
  "HK-005": "https://placehold.co/400x300/2e2a0f/f59e0b?text=Washing+Machine",
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
