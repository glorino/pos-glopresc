"use client";

import { CartProvider } from "@/contexts/CartContext";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}
