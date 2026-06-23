"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { formatCurrency } from "@/lib/utils";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  X,
  CreditCard,
  Banknote,
  Smartphone,
  ArrowRight,
  CheckCircle,
  XCircle,
  Package,
  Filter,
  Menu,
  Receipt,
  ScanBarcode,
} from "lucide-react";
import BarcodeScanner from "@/components/ui/BarcodeScanner";

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stockQuantity: number;
  image: string | null;
  categoryId: string | null;
  category: { id: string; name: string } | null;
}

interface CartItem {
  product: Product;
  quantity: number;
}

type PaymentMethod = "CASH" | "CARD" | "TRANSFER" | "USSD" | "MOBILE";

interface Notification {
  type: "success" | "error";
  message: string;
}

interface SaleReceipt {
  invoiceNumber: string;
  items: { name: string; quantity: number; unitPrice: number; total: number }[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  amountPaid: number;
  changeDue: number;
  date: string;
}

const CATEGORIES = ["All", "Food", "Beverages", "Electronics", "Clothing", "Health", "Home", "Other"];

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { value: "CASH", label: "Cash", icon: Banknote },
  { value: "CARD", label: "Card", icon: CreditCard },
  { value: "TRANSFER", label: "Transfer", icon: ArrowRight },
  { value: "USSD", label: "USSD", icon: Smartphone },
  { value: "MOBILE", label: "Mobile", icon: Smartphone },
];

export default function POSTerminal() {
  const { data: session } = useSession();
  const searchRef = useRef<HTMLInputElement>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [cashReceived, setCashReceived] = useState("");
  const [discount, setDiscount] = useState("0");
  const [processing, setProcessing] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<SaleReceipt | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [taxRate, setTaxRate] = useState(7.5);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings?.currency?.taxRate) {
          setTaxRate(Number(data.settings.currency.taxRate));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === "F5") {
        e.preventDefault();
        clearCart();
      } else if (e.key === "F9") {
        e.preventDefault();
        completeSale();
      } else if (e.key === "Escape") {
        e.preventDefault();
        removeLastItem();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart, paymentMethod, cashReceived, discount, processing]);

  async function fetchProducts() {
    try {
      setLoading(true);
      const res = await fetch("/api/products?limit=100&isActive=true");
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      showNotification("error", "Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  function showNotification(type: "success" | "error", message: string) {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  }

  async function handleBarcodeScan(barcode: string) {
    setShowScanner(false);
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(barcode)}&isActive=true`);
      if (res.ok) {
        const data = await res.json();
        const found = data.products?.find(
          (p: Product & { barcode?: string }) =>
            p.sku.toLowerCase() === barcode.toLowerCase() ||
            (p as any).barcode?.toLowerCase() === barcode.toLowerCase() ||
            p.name.toLowerCase().includes(barcode.toLowerCase())
        );
        if (found) {
          addToCart(found);
          showNotification("success", `Added ${found.name} to cart`);
        } else {
          showNotification("error", `No product found for barcode: ${barcode}`);
        }
      }
    } catch {
      showNotification("error", "Failed to look up product");
    }
  }

  function addToCart(product: Product) {
    if (product.stockQuantity <= 0) {
      showNotification("error", `${product.name} is out of stock`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) {
          showNotification("error", `No more stock for ${product.name}`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  function updateQuantity(productId: string, delta: number) {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.stockQuantity) {
              showNotification("error", `Max stock for ${item.product.name}`);
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  }

  function removeItem(productId: string) {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }

  function removeLastItem() {
    setCart((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev));
  }

  function clearCart() {
    setCart([]);
    setCashReceived("");
    setDiscount("0");
  }

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discountAmount = parseFloat(discount) || 0;
  const taxableAmount = subtotal - discountAmount;
  const tax = taxableAmount * (taxRate / 100);
  const total = taxableAmount + tax;
  const cashAmount = parseFloat(cashReceived) || 0;
  const change = cashAmount - total;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  async function completeSale() {
    if (cart.length === 0) {
      showNotification("error", "Cart is empty");
      return;
    }
    if (paymentMethod === "CASH" && cashAmount < total) {
      showNotification("error", "Cash received is less than total");
      return;
    }
    if (processing) return;

    setProcessing(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: (session?.user as any)?.id || "",
          items: cart.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
          paymentMethod,
          amountPaid: paymentMethod === "CASH" ? cashAmount : total,
          discount: discountAmount,
          tax,
          notes: null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Sale failed");
      }

      const sale = await res.json();
      const receipt: SaleReceipt = {
        invoiceNumber: sale.invoiceNumber,
        items: sale.items.map((i: any) => ({
          name: i.product.name,
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice),
          total: Number(i.total),
        })),
        subtotal: Number(sale.subtotal),
        tax: Number(sale.tax),
        discount: Number(sale.discount),
        total: Number(sale.total),
        paymentMethod: sale.paymentMethod,
        amountPaid: Number(sale.amountPaid),
        changeDue: Number(sale.changeDue),
        date: new Date().toISOString(),
      };

      setLastReceipt(receipt);
      setShowReceipt(true);
      clearCart();
      fetchProducts();
      showNotification("success", "Sale completed successfully!");
    } catch (error: any) {
      showNotification("error", error.message || "Failed to complete sale");
    } finally {
      setProcessing(false);
    }
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      !searchQuery ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" ||
      product.category?.name?.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="pos-layout h-[calc(100vh-64px)]">
      {notification && (
        <div className="fixed left-1/2 top-20 z-[60] -translate-x-1/2 animate-in fade-in slide-in-from-top-4">
          <div
            className={`flex items-center gap-3 rounded-xl px-5 py-3 shadow-2xl backdrop-blur-xl ${
              notification.type === "success"
                ? "border border-[#10b981]/30 bg-[#10b981]/10 text-[#10b981]"
                : "border border-[#f43f5e]/30 bg-[#f43f5e]/10 text-[#f43f5e]"
            }`}
          >
            {notification.type === "success" ? <CheckCircle size={18} /> : <XCircle size={18} />}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Product Grid Section */}
      <div className="flex h-full flex-col overflow-hidden bg-[#0a0a0f]">
        <div className="border-b border-[#2a2a3a] bg-[#111118]/80 p-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606070]" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search products... (F2)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10"
              />
            </div>
            <button
              onClick={() => setShowScanner(true)}
              className="flex h-10 items-center gap-2 rounded-xl border border-[#2a2a3a] bg-[#1c1c28] px-3 text-[#9090a0] transition-colors hover:border-[#d4a843]/50 hover:text-[#d4a843]"
              title="Scan barcode"
            >
              <ScanBarcode size={18} />
              <span className="hidden text-xs font-medium sm:inline">Scan</span>
            </button>
            <button
              onClick={() => setCartOpen(true)}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#2a2a3a] bg-[#1c1c28] text-[#9090a0] transition-colors hover:border-[#d4a843]/50 hover:text-[#d4a843] lg:hidden"
            >
              <ShoppingCart size={20} />
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#d4a843] text-[10px] font-bold text-black">
                  {itemCount}
                </span>
              )}
            </button>
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
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

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4a843] border-t-transparent" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-[#606070]">
              <Package size={48} className="mb-4 opacity-30" />
              <p className="text-lg font-medium">No products found</p>
              <p className="text-sm">Try adjusting your search or category filter</p>
            </div>
          ) : (
            <div className="product-grid">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="product-card group text-left"
                  disabled={product.stockQuantity <= 0}
                >
                  <div className="mb-3 flex h-24 items-center justify-center rounded-lg bg-[#111118]">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full rounded-lg object-cover"
                      />
                    ) : (
                      <Package size={32} className="text-[#3a3a4a]" />
                    )}
                  </div>
                  <h3 className="truncate text-sm font-medium text-[#f0f0f5] group-hover:text-[#d4a843]">
                    {product.name}
                  </h3>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-sm font-bold text-[#d4a843]">
                      {formatCurrency(product.price)}
                    </span>
                    <span
                      className={`text-[10px] font-medium ${
                        product.stockQuantity > 10
                          ? "text-[#10b981]"
                          : product.stockQuantity > 0
                          ? "text-[#f59e0b]"
                          : "text-[#f43f5e]"
                      }`}
                    >
                      {product.stockQuantity > 0
                        ? `${product.stockQuantity} in stock`
                        : "Out of stock"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="hidden border-t border-[#2a2a3a] bg-[#111118]/80 px-4 py-2 text-[11px] text-[#606070] backdrop-blur-xl lg:flex lg:justify-center lg:gap-6">
          <span><kbd className="rounded border border-[#2a2a3a] bg-[#1c1c28] px-1.5 py-0.5 text-[#9090a0]">F2</kbd> Search</span>
          <span><kbd className="rounded border border-[#2a2a3a] bg-[#1c1c28] px-1.5 py-0.5 text-[#9090a0]">F5</kbd> Clear Cart</span>
          <span><kbd className="rounded border border-[#2a2a3a] bg-[#1c1c28] px-1.5 py-0.5 text-[#9090a0]">F9</kbd> Complete Sale</span>
          <span><kbd className="rounded border border-[#2a2a3a] bg-[#1c1c28] px-1.5 py-0.5 text-[#9090a0]">Esc</kbd> Remove Last</span>
        </div>
      </div>

      {/* Cart Panel */}
      <div className={`cart-panel ${cartOpen ? "open" : ""}`}>
        <div className="flex items-center justify-between border-b border-[#2a2a3a] px-4 py-3">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-[#d4a843]" />
            <h2 className="text-sm font-semibold text-[#f0f0f5]">
              Cart ({itemCount})
            </h2>
          </div>
          <button
            onClick={() => setCartOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#606070] hover:bg-[#1c1c28] hover:text-[#f0f0f5] lg:hidden"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-[#606070]">
              <ShoppingCart size={40} className="mb-3 opacity-20" />
              <p className="text-sm font-medium">Cart is empty</p>
              <p className="mt-1 text-xs">Click products to add</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="rounded-xl border border-[#2a2a3a] bg-[#1c1c28] p-3 transition-all hover:border-[#3a3a4a]"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-medium text-[#f0f0f5]">
                        {item.product.name}
                      </h4>
                      <p className="mt-0.5 text-xs text-[#9090a0]">
                        {formatCurrency(item.product.price)} each
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#606070] transition-colors hover:bg-[#f43f5e]/10 hover:text-[#f43f5e]"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#2a2a3a] bg-[#111118] text-[#9090a0] transition-colors hover:border-[#f43f5e]/50 hover:text-[#f43f5e]"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold text-[#f0f0f5]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#2a2a3a] bg-[#111118] text-[#9090a0] transition-colors hover:border-[#10b981]/50 hover:text-[#10b981]"
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
          <div className="border-t border-[#2a2a3a] px-4 py-3">
            <div className="mb-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#9090a0]">Subtotal</span>
                <span className="text-[#f0f0f5]">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#9090a0]">Discount</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-24 rounded-lg border border-[#2a2a3a] bg-[#111118] px-2 py-1 text-right text-sm text-[#f0f0f5] outline-none focus:border-[#d4a843]"
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#9090a0]">VAT ({taxRate}%)</span>
                <span className="text-[#f0f0f5]">{formatCurrency(tax)}</span>
              </div>
              <div className="border-t border-[#2a2a3a] pt-2">
                <div className="flex justify-between">
                  <span className="text-sm font-semibold text-[#f0f0f5]">Total</span>
                  <span className="text-lg font-bold text-[#d4a843]">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            <div className="mb-3">
              <p className="mb-2 text-xs font-medium text-[#9090a0]">Payment Method</p>
              <div className="grid grid-cols-5 gap-1">
                {PAYMENT_METHODS.map((pm) => {
                  const Icon = pm.icon;
                  return (
                    <button
                      key={pm.value}
                      onClick={() => setPaymentMethod(pm.value)}
                      className={`flex flex-col items-center gap-1 rounded-lg p-2 text-[10px] font-medium transition-all ${
                        paymentMethod === pm.value
                          ? "border border-[#d4a843]/30 bg-[#d4a843]/10 text-[#d4a843]"
                          : "border border-[#2a2a3a] bg-[#111118] text-[#606070] hover:text-[#9090a0]"
                      }`}
                    >
                      <Icon size={16} />
                      {pm.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {paymentMethod === "CASH" && (
              <div className="mb-3">
                <p className="mb-1 text-xs font-medium text-[#9090a0]">Cash Received</p>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder="0.00"
                  className="input"
                />
                {cashAmount > 0 && (
                  <div className="mt-1 flex justify-between text-sm">
                    <span className="text-[#9090a0]">Change</span>
                    <span className={`font-bold ${change >= 0 ? "text-[#10b981]" : "text-[#f43f5e]"}`}>
                      {formatCurrency(Math.max(0, change))}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={clearCart}
                className="btn btn-secondary flex-1"
              >
                Clear
              </button>
              <button
                onClick={completeSale}
                disabled={processing || cart.length === 0}
                className="btn btn-primary flex-[2] gap-2 bg-gradient-to-r from-[#d4a843] to-[#c49a38] py-3 text-sm font-bold"
              >
                {processing ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                ) : (
                  <Receipt size={16} />
                )}
                Complete Sale — {formatCurrency(total)}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      {showScanner && (
        <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setShowScanner(false)} />
      )}

      {showReceipt && lastReceipt && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl border border-[#2a2a3a] bg-[#111118] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle size={20} className="text-[#10b981]" />
                <h3 className="text-lg font-bold text-[#f0f0f5]">Sale Complete</h3>
              </div>
              <button
                onClick={() => setShowReceipt(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#606070] hover:bg-[#1c1c28] hover:text-[#f0f0f5]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="rounded-xl border border-[#2a2a3a] bg-[#0a0a0f] p-4">
              <div className="mb-3 text-center">
                <p className="text-lg font-bold text-[#d4a843]">SSV SHOP</p>
                <p className="text-xs text-[#606070]">POS Receipt</p>
              </div>
              <div className="mb-3 border-t border-dashed border-[#2a2a3a] pt-3">
                <p className="text-xs text-[#606070]">Invoice: {lastReceipt.invoiceNumber}</p>
                <p className="text-xs text-[#606070]">
                  {new Date(lastReceipt.date).toLocaleString()}
                </p>
              </div>
              <div className="mb-3 space-y-1 border-t border-dashed border-[#2a2a3a] pt-3">
                {lastReceipt.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-[#9090a0]">
                      {item.name} x{item.quantity}
                    </span>
                    <span className="text-[#f0f0f5]">{formatCurrency(item.total)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1 border-t border-dashed border-[#2a2a3a] pt-3">
                <div className="flex justify-between text-xs">
                  <span className="text-[#606070]">Subtotal</span>
                  <span className="text-[#9090a0]">{formatCurrency(lastReceipt.subtotal)}</span>
                </div>
                {lastReceipt.discount > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-[#606070]">Discount</span>
                    <span className="text-[#9090a0]">-{formatCurrency(lastReceipt.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-[#606070]">VAT ({taxRate}%)</span>
                  <span className="text-[#9090a0]">{formatCurrency(lastReceipt.tax)}</span>
                </div>
                <div className="flex justify-between border-t border-[#2a2a3a] pt-1 text-sm font-bold">
                  <span className="text-[#f0f0f5]">Total</span>
                  <span className="text-[#d4a843]">{formatCurrency(lastReceipt.total)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#606070]">Paid ({lastReceipt.paymentMethod})</span>
                  <span className="text-[#10b981]">{formatCurrency(lastReceipt.amountPaid)}</span>
                </div>
                {lastReceipt.changeDue > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-[#606070]">Change</span>
                    <span className="text-[#f0f0f5]">{formatCurrency(lastReceipt.changeDue)}</span>
                  </div>
                )}
              </div>
              <div className="mt-3 border-t border-dashed border-[#2a2a3a] pt-3 text-center">
                <p className="text-[10px] text-[#606070]">Thank you for shopping with SSV Shop!</p>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  const printWindow = window.open("", "_blank", "width=400,height=600");
                  if (printWindow) {
                    printWindow.document.write(`
                      <html>
                      <head>
                        <title>Receipt ${lastReceipt.invoiceNumber}</title>
                        <style>
                          body { font-family: 'Courier New', monospace; font-size: 12px; padding: 20px; max-width: 300px; margin: 0 auto; }
                          .center { text-align: center; }
                          .bold { font-weight: bold; }
                          .divider { border-top: 1px dashed #000; margin: 8px 0; }
                          .row { display: flex; justify-content: space-between; }
                          .footer { text-align: center; margin-top: 12px; font-size: 10px; }
                        </style>
                      </head>
                      <body>
                        <div class="center bold" style="font-size: 16px;">SSV SHOP</div>
                        <div class="center" style="font-size: 10px; color: #666;">POS Receipt</div>
                        <div class="divider"></div>
                        <div style="font-size: 10px; color: #666;">
                          <div>Invoice: ${lastReceipt.invoiceNumber}</div>
                          <div>${new Date(lastReceipt.date).toLocaleString()}</div>
                        </div>
                        <div class="divider"></div>
                        ${lastReceipt.items.map((item: any) => `
                          <div class="row">
                            <span>${item.name} x${item.quantity}</span>
                            <span>₦${item.total.toLocaleString()}</span>
                          </div>
                        `).join("")}
                        <div class="divider"></div>
                        <div class="row"><span>Subtotal</span><span>₦${lastReceipt.subtotal.toLocaleString()}</span></div>
                        ${lastReceipt.discount > 0 ? `<div class="row"><span>Discount</span><span>-₦${lastReceipt.discount.toLocaleString()}</span></div>` : ""}
                        <div class="row"><span>VAT (${taxRate}%)</span><span>₦${lastReceipt.tax.toLocaleString()}</span></div>
                        <div class="divider"></div>
                        <div class="row bold" style="font-size: 14px;"><span>TOTAL</span><span>₦${lastReceipt.total.toLocaleString()}</span></div>
                        <div class="row"><span>Paid (${lastReceipt.paymentMethod})</span><span style="color: green;">₦${lastReceipt.amountPaid.toLocaleString()}</span></div>
                        ${lastReceipt.changeDue > 0 ? `<div class="row"><span>Change</span><span>₦${lastReceipt.changeDue.toLocaleString()}</span></div>` : ""}
                        <div class="divider"></div>
                        <div class="footer">Thank you for shopping with SSV Shop!</div>
                      </body>
                      </html>
                    `);
                    printWindow.document.close();
                    printWindow.print();
                  }
                }}
                className="btn btn-secondary flex-1"
              >
                <Receipt size={14} />
                Print Receipt
              </button>
              <button
                onClick={() => setShowReceipt(false)}
                className="btn btn-primary flex-1"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
