"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowLeft,
  ShoppingCart,
  Plus,
  Minus,
  Package,
  CheckCircle,
  Store,
  Star,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  costPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  description: string | null;
  image: string | null;
  categoryId: string | null;
  category: { id: string; name: string } | null;
  supplier: { id: string; name: string } | null;
}

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  async function fetchProduct() {
    try {
      setLoading(true);
      const res = await fetch(`/api/products/${id}`);
      if (res.ok) {
        const data = await res.json();
        setProduct(data);
        if (data.categoryId) {
          fetchRelated(data.categoryId, data.id);
        }
      }
    } catch (error) {
      console.error("Failed to load product:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRelated(categoryId: string, excludeId: string) {
    try {
      const res = await fetch(`/api/products?limit=4&isActive=true&categoryId=${categoryId}`);
      if (res.ok) {
        const data = await res.json();
        setRelatedProducts(data.products.filter((p: Product) => p.id !== excludeId).slice(0, 4));
      }
    } catch (error) {
      console.error("Failed to load related products:", error);
    }
  }

  function addToCart() {
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4a843] border-t-transparent" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0f] text-[#606070]">
        <Package size={48} className="mb-4 opacity-30" />
        <p className="text-lg font-medium">Product not found</p>
        <Link href="/shop" className="btn btn-primary mt-4">
          Back to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 border-b border-[#2a2a3a] bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/shop" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#d4a843] to-[#b8942f]">
              <svg viewBox="0 0 64 64" fill="none" className="h-5 w-5">
                <path d="M16 24 L22 24 L28 40 L48 40 L52 26 L24 26" stroke="#000" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="30" cy="46" r="3" fill="#000"/>
                <circle cx="46" cy="46" r="3" fill="#000"/>
              </svg>
            </div>
            <span className="text-lg font-bold text-[#f0f0f5]">SSV Shop</span>
          </Link>
          <Link href="/booking" className="text-sm font-medium text-[#9090a0] hover:text-[#d4a843]">
            Book a Service
          </Link>
        </div>
      </nav>

      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-4 py-4">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-sm text-[#606070] transition-colors hover:text-[#d4a843]"
        >
          <ArrowLeft size={16} />
          Back to Shop
        </Link>
      </div>

      {/* Product Detail */}
      <div className="mx-auto max-w-7xl px-4 pb-20">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Product Image */}
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-[#2a2a3a] bg-[#111118]">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <Package size={80} className="text-[#3a3a4a]" />
            )}
          </div>

          {/* Product Info */}
          <div>
            {product.category && (
              <span className="mb-3 inline-block rounded-lg bg-[#d4a843]/10 px-3 py-1 text-xs font-medium text-[#d4a843]">
                {product.category.name}
              </span>
            )}
            <h1 className="text-2xl font-bold text-[#f0f0f5] sm:text-3xl">{product.name}</h1>
            <p className="mt-1 text-sm text-[#606070]">SKU: {product.sku}</p>

            <div className="mt-4 text-3xl font-bold text-[#d4a843]">
              {formatCurrency(product.price)}
            </div>

            <div className="mt-4 flex items-center gap-2">
              {product.stockQuantity > 10 ? (
                <span className="flex items-center gap-1 rounded-lg bg-[#10b981]/10 px-3 py-1.5 text-sm font-medium text-[#10b981]">
                  <CheckCircle size={14} />
                  In Stock ({product.stockQuantity} available)
                </span>
              ) : product.stockQuantity > 0 ? (
                <span className="rounded-lg bg-[#f59e0b]/10 px-3 py-1.5 text-sm font-medium text-[#f59e0b]">
                  Low Stock ({product.stockQuantity} left)
                </span>
              ) : (
                <span className="rounded-lg bg-[#f43f5e]/10 px-3 py-1.5 text-sm font-medium text-[#f43f5e]">
                  Out of Stock
                </span>
              )}
            </div>

            {product.description && (
              <p className="mt-6 leading-relaxed text-[#9090a0]">{product.description}</p>
            )}

            {product.supplier && (
              <p className="mt-3 text-sm text-[#606070]">
                Supplier: <span className="text-[#9090a0]">{product.supplier.name}</span>
              </p>
            )}

            {/* Quantity Selector */}
            <div className="mt-8">
              <p className="mb-2 text-sm font-medium text-[#9090a0]">Quantity</p>
              <div className="inline-flex items-center gap-3 rounded-xl border border-[#2a2a3a] bg-[#1c1c28] p-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-[#9090a0] transition-colors hover:bg-[#111118] hover:text-[#f0f0f5]"
                >
                  <Minus size={16} />
                </button>
                <span className="w-12 text-center text-lg font-bold text-[#f0f0f5]">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-[#9090a0] transition-colors hover:bg-[#111118] hover:text-[#f0f0f5]"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Add to Cart */}
            <button
              onClick={addToCart}
              disabled={product.stockQuantity <= 0}
              className={`btn mt-6 w-full gap-2 py-3 text-base font-bold ${
                addedToCart
                  ? "bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30"
                  : "btn-primary"
              }`}
            >
              {addedToCart ? (
                <>
                  <CheckCircle size={18} />
                  Added to Cart!
                </>
              ) : (
                <>
                  <ShoppingCart size={18} />
                  Add to Cart — {formatCurrency(product.price * quantity)}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="mb-6 text-xl font-bold text-[#f0f0f5]">Related Products</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {relatedProducts.map((rp) => (
                <Link
                  key={rp.id}
                  href={`/shop/${rp.id}`}
                  className="group rounded-2xl border border-[#2a2a3a] bg-[#111118] p-4 transition-all hover:border-[#d4a843]/30"
                >
                  <div className="mb-3 flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-[#1c1c28]">
                    {rp.image ? (
                      <img src={rp.image} alt={rp.name} className="h-full w-full object-cover" />
                    ) : (
                      <Package size={32} className="text-[#3a3a4a]" />
                    )}
                  </div>
                  <h3 className="line-clamp-2 text-sm font-medium text-[#f0f0f5] group-hover:text-[#d4a843]">
                    {rp.name}
                  </h3>
                  <p className="mt-1 text-sm font-bold text-[#d4a843]">{formatCurrency(rp.price)}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-[#2a2a3a] bg-[#111118] py-8">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <p className="text-xs text-[#606070]">
            &copy; {new Date().getFullYear()} SSV Shop. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
