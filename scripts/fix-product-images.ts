import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const fixes: Record<string, string> = {
  "120g Pure Wave Bar Soap": "https://images.unsplash.com/photo-1607006344380-b6775a0824a7?w=400&h=300&fit=crop",
  "Prestige Pressure Cooker (5L)": "https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=400&h=300&fit=crop",
  "Infinix XPad 10": "https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=400&h=300&fit=crop",
  "Polo T-Shirt (Men)": "https://images.unsplash.com/photo-1625910513413-5fc42ffe9cc0?w=400&h=300&fit=crop",
  "Samsung Galaxy Buds": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop",
  "Gucci Belt": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop",
  "Nigerian Cast Iron Pot": "https://images.unsplash.com/photo-1585837146751-a44118597393?w=400&h=300&fit=crop",
  "Dove Shampoo (400ml)": "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400&h=300&fit=crop",
  "Infinix Washing Machine (8kg)": "https://images.unsplash.com/photo-1521656693884-5c5d1b5b9f74?w=400&h=300&fit=crop",
  "Thermocool Refrigerator (Small)": "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400&h=300&fit=crop",
  "Binatone Blender": "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=400&h=300&fit=crop",
  "Peak Milk Powder (900g)": "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=300&fit=crop",
  "Knorr Chicken Cubes (Pack)": "https://images.unsplash.com/photo-1596097635121-14b63a7e0d75?w=400&h=300&fit=crop",
  "Coca-Cola (50cl)": "https://images.unsplash.com/photo-1625772299848-391e45334923?w=400&h=300&fit=crop",
  "Pepsi (50cl)": "https://images.unsplash.com/photo-1629203851122-3710db9e2e88?w=400&h=300&fit=crop",
  "Fanta Orange (50cl)": "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=300&fit=crop",
  "Monster Energy Drink": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&h=300&fit=crop",
  "Star Beer (60cl)": "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&h=300&fit=crop",
  "Gulder Lager (60cl)": "https://images.unsplash.com/photo-1566633806327-68e152aaf26d?w=400&h=300&fit=crop",
  "Dettol Antiseptic (500ml)": "https://images.unsplash.com/photo-1584483766114-2cea6facdf57?w=400&h=300&fit=crop",
  "Vitamin C Supplements (60 tabs)": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=300&fit=crop",
  "Nivea Body Lotion (400ml)": "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&h=300&fit=crop",
  "Paracetamol (Tablets Pack)": "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=300&fit=crop",
  "Bournvita (500g)": "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=400&h=300&fit=crop",
  "Golden Morn (500g)": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=300&fit=crop",
  "Samsung Galaxy A14": "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=300&fit=crop",
  "iPhone 14 (128GB)": "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop",
  "Tecno Spark 10": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&h=300&fit=crop",
  "Infinix Hot 30": "https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=400&h=300&fit=crop",
  "Apple AirPods Pro": "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=400&h=300&fit=crop",
  "Anker Power Bank (20000mAh)": "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&h=300&fit=crop",
  "Nike Air Max (Men)": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop",
  "Adidas Superstar (Men)": "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=300&fit=crop",
  "Levi's 501 Jeans": "https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=400&h=300&fit=crop",
  "Indomie Noodles (Pack of 10)": "https://images.unsplash.com/photo-1585237672814-8f85a8118bf6?w=400&h=300&fit=crop",
  "Indomie Noodles (Single)": "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400&h=300&fit=crop",
  "Mama Gold Rice (50kg)": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop",
  "Topic Rice (25kg)": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop",
  " Eva Water (75cl)": "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=300&fit=crop",
  "5L Palm Oil": "https://images.unsplash.com/photo-1474979266404-7f28bfce87c0?w=400&h=300&fit=crop",
  "12L Palm Oil": "https://images.unsplash.com/photo-1474979266404-7f28bfce87c0?w=400&h=300&fit=crop",
  "20L Palm Oil": "https://images.unsplash.com/photo-1474979266404-7f28bfce87c0?w=400&h=300&fit=crop",
};

async function main() {
  let count = 0;
  for (const [name, image] of Object.entries(fixes)) {
    const p = await prisma.product.findFirst({ where: { name } });
    if (p) {
      await prisma.product.update({ where: { id: p.id }, data: { image } });
      console.log(`✅ ${name}`);
      count++;
    }
  }
  console.log(`\nUpdated ${count} products.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
