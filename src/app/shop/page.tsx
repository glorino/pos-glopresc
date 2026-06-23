"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { useTranslation } from "@/contexts/LanguageContext";
import {
  Search,
  ShoppingCart,
  X,
  Plus,
  Minus,
  Trash2,
  Package,
  ChevronRight,
  ArrowLeft,
  CreditCard,
  CheckCircle2,
  MapPin,
} from "lucide-react";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";
import ShippingCalculator from "@/components/ui/ShippingCalculator";
import FlutterwavePayment from "@/components/ui/FlutterwavePayment";

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
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [shippingFee, setShippingFee] = useState(0);
  const [shippingEstimate, setShippingEstimate] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(0);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerName, setCustomerName] = useState("");

  useEffect(() => {
    fetchProducts();
    fetch("/api/settings/shipping")
      .then((res) => res.json())
      .then((data) => {
        setFreeShippingThreshold(data.freeShippingThreshold || 0);
      })
      .catch(() => {});
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

  function handleCheckout() {
    setCartOpen(false);
    setCheckoutOpen(true);
  }

  async function createSale(txRef: string) {
    try {
      const items = cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.product.price,
      }));

      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          paymentMethod: "online",
          amountPaid: subtotal + effectiveShipping,
          txRef,
        }),
      });

      if (res.ok) {
        setOrderSuccess(true);
        setCart([]);
        setCheckoutOpen(false);
        setShippingFee(0);
        setShippingEstimate("");
        setShippingAddress("");
      } else {
        alert("Failed to record sale. Please contact support.");
      }
    } catch {
      alert("Failed to record sale. Please contact support.");
    }
  }

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const effectiveShipping = freeShippingThreshold > 0 && subtotal >= freeShippingThreshold ? 0 : shippingFee;
  const total = subtotal + effectiveShipping;
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

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl border border-[#2a2a3a] bg-[#111118] p-8 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#10b981]/10">
              <CheckCircle2 size={40} className="text-[#10b981]" />
            </div>
            <h2 className="text-2xl font-bold text-[#f0f0f5]">{t("orderConfirmed")}</h2>
            <p className="mt-2 text-sm text-[#9090a0]">
              {t("orderConfirmedDesc")}
            </p>
            <Link
              href="/shop"
              onClick={() => setOrderSuccess(false)}
              className="btn btn-primary mt-8 inline-flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              {t("continueShopping")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <PublicHeader />

      {/* Shop Toolbar */}
      <div className="sticky top-16 z-40 border-b border-[#2a2a3a] bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="relative max-w-md flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606070]" />
            <input
              type="text"
              placeholder={t("searchProducts")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 text-sm"
            />
          </div>
          <button
            onClick={() => setCartOpen(true)}
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#2a2a3a] bg-[#1c1c28] text-[#9090a0] transition-colors hover:border-[#d4a843]/50 hover:text-[#d4a843]"
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

      {/* Hero */}
      <div className="hero-gradient relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:py-20">
          <h1 className="text-3xl font-bold text-[#f0f0f5] sm:text-5xl">
            {t("welcomeTo")}{" "}
            <span className="bg-gradient-to-r from-[#d4a843] to-[#c49a38] bg-clip-text text-transparent">
              SSV Shop
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-[#9090a0]">
            {t("shopHeroDesc")}
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
            <p className="text-lg font-medium">{t("noProductsFound")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 stagger-children">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="group rounded-2xl border border-[#2a2a3a] bg-[#111118] p-4 transition-all hover:border-[#d4a843]/30 hover:shadow-lg hover:shadow-[#d4a843]/5 opacity-0 animate-fade-in-up"
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
                      <div className={`h-full w-full flex items-center justify-center bg-gradient-to-br ${
                        product.category?.name === "Food" ? "from-[#f59e0b]/20 to-[#f59e0b]/5" :
                        product.category?.name === "Beverages" ? "from-[#3b82f6]/20 to-[#3b82f6]/5" :
                        product.category?.name === "Electronics" ? "from-[#8b5cf6]/20 to-[#8b5cf6]/5" :
                        product.category?.name === "Clothing" ? "from-[#ec4899]/20 to-[#ec4899]/5" :
                        product.category?.name === "Health" ? "from-[#10b981]/20 to-[#10b981]/5" :
                        "from-[#d4a843]/20 to-[#d4a843]/5"
                      }`}>
                        <Package size={32} className="text-[#606070]" />
                      </div>
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
                      {product.stockQuantity > 0 ? t("inStock") : t("outOfStock")}
                    </span>
                  </div>
                  <button
                    onClick={() => addToCart(product)}
                    disabled={product.stockQuantity <= 0}
                    className="btn btn-primary mt-3 w-full text-xs"
                  >
                    <ShoppingCart size={14} />
                    {t("addToCart")}
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
                <h2 className="text-lg font-bold text-[#f0f0f5]">{t("cart")} ({itemCount})</h2>
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
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-[#9090a0]">{t("subtotal")}</span>
                  <span className="font-bold text-[#d4a843]">{formatCurrency(subtotal)}</span>
                </div>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-[#9090a0]">{t("shipping")}</span>
                  <span className="font-bold text-[#d4a843]">
                    {effectiveShipping > 0 ? formatCurrency(effectiveShipping) : `₦0.00 (${t("free")})`}
                  </span>
                </div>
                <div className="mb-4 flex justify-between border-t border-[#2a2a3a] pt-2 text-sm">
                  <span className="font-semibold text-[#f0f0f5]">{t("total")}</span>
                  <span className="font-bold text-[#d4a843]">{formatCurrency(total)}</span>
                </div>
                <button
                  onClick={handleCheckout}
                  className="btn btn-primary flex w-full items-center justify-center gap-2"
                >
                  {t("checkout")}
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setCheckoutOpen(false)}
          />
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#2a2a3a] bg-[#111118] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2a2a3a] px-6 py-4">
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-[#d4a843]" />
                <h2 className="text-lg font-bold text-[#f0f0f5]">{t("checkout")}</h2>
              </div>
              <button
                onClick={() => setCheckoutOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#606070] hover:bg-[#1c1c28] hover:text-[#f0f0f5]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 px-6 py-4">
              {/* Customer Info */}
              <div>
                <label className="mb-1 block text-sm font-medium text-[#f0f0f5]">
                  Full Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="John Doe"
                  className="input text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#f0f0f5]">
                  Email Address
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="input text-sm"
                />
              </div>

              {/* Shipping Address */}
              <div>
                <label className="mb-1 block text-sm font-medium text-[#f0f0f5]">
                  <MapPin size={14} className="mr-1 inline text-[#d4a843]" />
                  {t("deliveryAddress")}
                </label>
                <input
                  type="text"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="e.g., 123 Main Street, City, Country"
                  className="input text-sm"
                />
              </div>

              {/* Shipping Calculator */}
              <ShippingCalculator
                weight={cart.reduce((sum, item) => sum + item.quantity, 0)}
                onCalculate={(fee, estimate) => {
                  setShippingFee(fee);
                  setShippingEstimate(estimate);
                }}
              />

              {shippingEstimate && (
                <p className="text-xs text-[#9090a0]">
                  Estimated delivery: <span className="font-medium text-[#10b981]">{shippingEstimate}</span>
                </p>
              )}

              {/* Order Summary */}
              <div className="rounded-xl border border-[#2a2a3a] bg-[#1c1c28] p-4">
                <h4 className="mb-3 text-sm font-semibold text-[#f0f0f5]">{t("orderSummary")}</h4>
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex justify-between text-sm">
                      <span className="text-[#9090a0]">
                        {item.product.name} x{item.quantity}
                      </span>
                      <span className="font-medium text-[#f0f0f5]">
                        {formatCurrency(item.product.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <hr className="my-3 border-[#2a2a3a]" />
                <div className="flex justify-between text-sm">
                  <span className="text-[#9090a0]">{t("subtotal")}</span>
                  <span className="font-bold text-[#d4a843]">{formatCurrency(subtotal)}</span>
                </div>
                <div className="mt-1 flex justify-between text-sm">
                  <span className="text-[#9090a0]">{t("shipping")}</span>
                  <span className="font-bold text-[#d4a843]">
                    {effectiveShipping > 0 ? formatCurrency(effectiveShipping) : `₦0.00 (${t("free")})`}
                  </span>
                </div>
                <hr className="my-3 border-[#2a2a3a]" />
                <div className="flex justify-between">
                  <span className="font-semibold text-[#f0f0f5]">{t("total")}</span>
                  <span className="text-lg font-bold text-[#d4a843]">{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Payment */}
              {!customerName || !customerEmail || !shippingAddress ? (
                <p className="text-center text-xs text-[#f59e0b]">
                  Please fill in your name, email, and delivery address to proceed.
                </p>
              ) : (
                <FlutterwavePayment
                  amount={total}
                  email={customerEmail}
                  name={customerName}
                  description={`SSV Shop Order - ${cart.length} item(s)`}
                  onSuccess={async (response) => {
                    try {
                      const verifyRes = await fetch(
                        `/api/payments/verify?transaction_id=${response.transaction_id}`
                      );
                      const verifyData = await verifyRes.json();
                      if (verifyData.status === "success") {
                        createSale(response.tx_ref as string);
                      } else {
                        alert("Payment verification failed. Please contact support.");
                      }
                    } catch {
                      alert("Could not verify payment. Please contact support.");
                    }
                  }}
                  onClose={() => {}}
                />
              )}
            </div>
          </div>
        </div>
      )}

      <PublicFooter />
    </div>
  );
}
