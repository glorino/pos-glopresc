"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import {
  Search,
  ShoppingCart,
  X,
  Plus,
  Minus,
  Trash2,
  Package,
  Menu,
  ChevronRight,
  ArrowLeft,
  Store,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stockQuantity: number;
  image: string | null;
  description: string | null;
  categoryId: string | null;
  category: { id: string; name: string } | null;
}

interface CartItem {
  product: Product;
  quantity: number;
}

const CATEGORIES = ["All", "Food", "Beverages", "Electronics", "Clothing", "Health", "Home", "Other"];

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      setLoading(true);
      const res = await fetch("/api/products?limit=100&isActive=true");
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error("Failed to load products:", error);
    } finally {
      setLoading(false);
    }
  }

  function addToCart(product: Product) {
    if (product.stockQuantity <= 0) return;
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) return prev;
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setCartOpen(true);
  }

  function updateQuantity(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.stockQuantity) return item;
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  }

  function removeItem(productId: string) {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      !searchQuery ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" ||
      product.category?.name?.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 border-b border-[#2a2a3a] bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#d4a843] to-[#c49a38]">
              <span className="text-sm font-bold text-black">G</span>
            </div>
            <span className="text-lg font-bold text-[#f0f0f5]">Glopresc Shop</span>
          </Link>

          <div className="hidden max-w-md flex-1 px-8 md:block">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606070]" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/booking"
              className="hidden text-sm font-medium text-[#9090a0] transition-colors hover:text-[#d4a843] md:block"
            >
              Book a Service
            </Link>
            <button
              onClick={() => setCartOpen(true)}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#2a2a3a] bg-[#1c1c28] text-[#9090a0] transition-colors hover:border-[#d4a843]/50 hover:text-[#d4a843]"
            >
              <ShoppingCart size={20} />
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#d4a843] text-[10px] font-bold text-black">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-3 md:hidden">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606070]" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 text-sm"
            />
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="hero-gradient relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:py-20">
          <h1 className="text-3xl font-bold text-[#f0f0f5] sm:text-5xl">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-[#d4a843] to-[#c49a38] bg-clip-text text-transparent">
              Glopresc Shop
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-[#9090a0]">
            Discover our wide range of quality products at competitive prices.
            Fast checkout, secure payments, and nationwide delivery.
          </p>
        </div>
      </div>

      {/* Categories */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                selectedCategory === cat
                  ? "bg-gradient-to-r from-[#d4a843] to-[#c49a38] text-black"
                  : "border border-[#2a2a3a] bg-[#1c1c28] text-[#9090a0] hover:border-[#3a3a4a] hover:text-[#f0f0f5]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="mx-auto max-w-7xl px-4 pb-20">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4a843] border-t-transparent" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-[#606070]">
            <Package size={48} className="mb-4 opacity-30" />
            <p className="text-lg font-medium">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="group rounded-2xl border border-[#2a2a3a] bg-[#111118] p-4 transition-all hover:border-[#d4a843]/30 hover:shadow-lg hover:shadow-[#d4a843]/5"
              >
                <Link href={`/shop/${product.id}`}>
                  <div className="mb-3 flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-[#1c1c28]">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <Package size={40} className="text-[#3a3a4a]" />
                    )}
                  </div>
                </Link>
                <div>
                  <Link href={`/shop/${product.id}`}>
                    <h3 className="line-clamp-2 text-sm font-medium text-[#f0f0f5] group-hover:text-[#d4a843]">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="mt-1 text-lg font-bold text-[#d4a843]">
                    {formatCurrency(product.price)}
                  </p>
                  <div className="mt-1 flex items-center justify-between">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${
                        product.stockQuantity > 10
                          ? "bg-[#10b981]/15 text-[#10b981]"
                          : product.stockQuantity > 0
                          ? "bg-[#f59e0b]/15 text-[#f59e0b]"
                          : "bg-[#f43f5e]/15 text-[#f43f5e]"
                      }`}
                    >
                      {product.stockQuantity > 0 ? "In Stock" : "Out of Stock"}
                    </span>
                  </div>
                  <button
                    onClick={() => addToCart(product)}
                    disabled={product.stockQuantity <= 0}
                    className="btn btn-primary mt-3 w-full text-xs"
                  >
                    <ShoppingCart size={14} />
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart Sidebar */}
      {cartOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setCartOpen(false)}
          />
          <div className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-[#2a2a3a] bg-[#111118] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2a2a3a] px-6 py-4">
              <div className="flex items-center gap-2">
                <ShoppingCart size={18} className="text-[#d4a843]" />
                <h2 className="text-lg font-bold text-[#f0f0f5]">Your Cart ({itemCount})</h2>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#606070] hover:bg-[#1c1c28] hover:text-[#f0f0f5]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {cart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-[#606070]">
                  <ShoppingCart size={40} className="mb-3 opacity-20" />
                  <p className="font-medium">Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="rounded-xl border border-[#2a2a3a] bg-[#1c1c28] p-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate text-sm font-medium text-[#f0f0f5]">
                            {item.product.name}
                          </h4>
                          <p className="mt-0.5 text-xs text-[#9090a0]">
                            {formatCurrency(item.product.price)}
                          </p>
                        </div>
                        <button
                          onClick={() => removeItem(item.product.id)}
                          className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#606070] hover:bg-[#f43f5e]/10 hover:text-[#f43f5e]"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#2a2a3a] bg-[#111118] text-[#9090a0] hover:text-[#f0f0f5]"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold text-[#f0f0f5]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#2a2a3a] bg-[#111118] text-[#9090a0] hover:text-[#f0f0f5]"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <span className="text-sm font-bold text-[#d4a843]">
                          {formatCurrency(item.product.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-[#2a2a3a] px-6 py-4">
                <div className="mb-4 flex justify-between text-sm">
                  <span className="text-[#9090a0]">Subtotal</span>
                  <span className="font-bold text-[#d4a843]">{formatCurrency(subtotal)}</span>
                </div>
                <Link
                  href="/booking"
                  className="btn btn-primary flex w-full items-center justify-center gap-2"
                  onClick={() => setCartOpen(false)}
                >
                  Proceed to Checkout
                  <ChevronRight size={16} />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-[#2a2a3a] bg-[#111118] py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#d4a843] to-[#c49a38]">
                <span className="text-sm font-bold text-black">G</span>
              </div>
              <span className="text-lg font-bold text-[#f0f0f5]">Glopresc</span>
            </div>
            <div className="flex gap-6 text-sm text-[#606070]">
              <Link href="/" className="hover:text-[#d4a843]">Home</Link>
              <Link href="/shop" className="hover:text-[#d4a843]">Shop</Link>
              <Link href="/booking" className="hover:text-[#d4a843]">Book a Service</Link>
            </div>
            <p className="text-xs text-[#606070]">
              &copy; {new Date().getFullYear()} Glopresc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
