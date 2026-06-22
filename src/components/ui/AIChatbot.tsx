"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { MessageCircle, X, Send, Bot, User, Minimize2, Maximize2 } from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

const BOT_RESPONSES: Record<string, string> = {
  "how do i process a sale?":
    "To process a sale:\n\n1. Go to POS Terminal from the sidebar\n2. Scan or search for products to add to cart\n3. Select the quantity for each item\n4. Choose a payment method (Cash, Card, Transfer, USSD, Mobile)\n5. Enter the amount received\n6. Click 'Complete Sale' to finalize\n\nThe receipt will be generated automatically.",
  "how do i add a new product?":
    "To add a new product:\n\n1. Navigate to Products in the sidebar\n2. Click 'Add Product' button\n3. Fill in the product details (name, price, cost price, SKU)\n4. Select a category and supplier\n5. Set stock quantity and minimum stock level\n6. Save the product\n\nThe SKU is auto-generated but can be customized.",
  "how do i generate a report?":
    "To generate a report:\n\n1. Go to Reports from the sidebar\n2. Select the type of report (Sales, Inventory, Financial)\n3. Choose your date range\n4. Click 'Generate Report'\n5. You can export as PDF or print directly",
  "how do i manage inventory?":
    "To manage inventory:\n\n1. Go to Inventory > Stock Management\n2. View current stock levels for all products\n3. Use Stock Adjustment to add/remove stock\n4. Set minimum stock levels for low-stock alerts\n5. Run Stock Take for physical inventory counts",
  "how do i handle a refund?":
    "To process a refund:\n\n1. Go to Sales from the sidebar\n2. Find the original transaction\n3. Click 'Process Return' on the sale\n4. Select items being returned\n5. Choose refund method\n6. Confirm the refund\n\nThe stock will be automatically adjusted.",
  "how do i add a customer?":
    "To add a new customer:\n\n1. Navigate to Customers from the sidebar\n2. Click 'Add Customer'\n3. Fill in customer details (name, email, phone, address)\n4. Save the customer\n\nCustomers earn loyalty points on purchases automatically.",
  "how do i manage suppliers?":
    "To manage suppliers:\n\n1. Go to Procurement > Suppliers\n2. View all suppliers in the table\n3. Click 'Add Supplier' to create new\n4. Edit or deactivate existing suppliers\n5. Link suppliers to products for easy ordering",
  "how do i approve expenses?":
    "To approve expenses:\n\n1. Go to Accounting > Expenses\n2. Click the 'Pending' tab\n3. Review expense details and receipts\n4. Click 'Approve' or 'Reject' for each expense\n5. Add notes if rejecting",
  "how do i schedule a booking?":
    "To schedule a booking:\n\n1. Go to Bookings from the sidebar\n2. Click 'New Booking'\n3. Select the customer\n4. Choose service type and date/time\n5. Add description and notes\n6. Save the booking",
  "how do i track expenses?":
    "To track expenses:\n\n1. Go to Accounting > Expenses\n2. View all expenses by category\n3. Filter by date range or status\n4. Click 'Add Expense' to record new\n5. Attach receipts for documentation",
  "how do i view audit logs?":
    "To view audit logs:\n\n1. Go to Auditor > Audit Logs\n2. View all system activities\n3. Filter by user, action type, or date\n4. Click on any entry for full details\n5. Export logs for compliance reporting",
  "what roles are available?":
    "Available roles in SSV Shop POS:\n\n1. Owner - Full system access\n2. Manager - Operations & management\n3. Warehouse Manager - Warehouse stock management\n4. Warehouse Rep - Warehouse stock adjustments\n5. Procurement Manager - Supplier & purchase order management\n6. Procurement Rep - Supplier & stock request handling\n7. Sales Manager - Sales oversight\n8. Sales Rep - POS terminal operations\n9. Accountant - Financial management\n10. Auditor - System audit & compliance\n11. Customer - Self-service portal",
  "how do i close the register?":
    "To close the cash register:\n\n1. Go to POS Terminal\n2. Click 'Close Drawer' in the top bar\n3. Count the physical cash in the drawer\n4. Enter the actual balance\n5. The system calculates any difference\n6. Confirm to close\n\nA summary report is generated automatically.",
  "how do i run a stock take?":
    "To run a stock take:\n\n1. Go to Inventory > Stock Adjustment\n2. Click 'New Stock Take'\n3. Count physical stock for each product\n4. Enter counted quantities\n5. Submit the stock take\n6. Differences are recorded as adjustments",
};

const DEFAULT_RESPONSE =
  "I can help with POS operations, inventory, sales, reporting, and general questions. What would you like to know?";

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function getBotResponse(input: string): string {
  const lower = input.toLowerCase().trim();
  for (const [key, value] of Object.entries(BOT_RESPONSES)) {
    if (lower.includes(key) || key.includes(lower)) {
      return value;
    }
  }
  if (lower.includes("sale") || lower.includes("pos") || lower.includes("checkout")) {
    return BOT_RESPONSES["how do i process a sale?"];
  }
  if (lower.includes("product") || lower.includes("item") || lower.includes("add")) {
    return BOT_RESPONSES["how do i add a new product?"];
  }
  if (lower.includes("report") || lower.includes("analytics")) {
    return BOT_RESPONSES["how do i generate a report?"];
  }
  if (lower.includes("inventory") || lower.includes("stock")) {
    return BOT_RESPONSES["how do i manage inventory?"];
  }
  if (lower.includes("refund") || lower.includes("return")) {
    return BOT_RESPONSES["how do i handle a refund?"];
  }
  if (lower.includes("customer")) {
    return BOT_RESPONSES["how do i add a customer?"];
  }
  if (lower.includes("supplier") || lower.includes("procurement")) {
    return BOT_RESPONSES["how do i manage suppliers?"];
  }
  if (lower.includes("expense") || lower.includes("approve")) {
    return BOT_RESPONSES["how do i approve expenses?"];
  }
  if (lower.includes("booking") || lower.includes("schedule")) {
    return BOT_RESPONSES["how do i schedule a booking?"];
  }
  if (lower.includes("audit") || lower.includes("log")) {
    return BOT_RESPONSES["how do i view audit logs?"];
  }
  if (lower.includes("role") || lower.includes("permission")) {
    return BOT_RESPONSES["what roles are available?"];
  }
  if (lower.includes("close") || lower.includes("register") || lower.includes("drawer")) {
    return BOT_RESPONSES["how do i close the register?"];
  }
  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
    return "Hello! I'm the SSV Shop AI Assistant. I can help you with POS operations, inventory management, sales, reporting, and more. What would you like to know?";
  }
  if (lower.includes("help")) {
    return "Here are some things I can help with:\n\n• Processing sales\n• Adding products\n• Managing inventory\n• Generating reports\n• Handling refunds\n• Managing customers & suppliers\n• Expense tracking\n• Audit logs\n\nJust ask a question!";
  }
  if (lower.includes("thank")) {
    return "You're welcome! Feel free to ask if you have any other questions.";
  }
  return DEFAULT_RESPONSE;
}

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: generateId(),
      text: "Hello! I'm the SSV Shop AI Assistant. How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = {
      id: generateId(),
      text: input.trim(),
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const botMsg: Message = {
        id: generateId(),
        text: getBotResponse(userMsg.text),
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 800 + Math.random() * 700);
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#d4a843] to-[#c49a38] text-black shadow-lg shadow-[#d4a843]/20 transition-all hover:scale-110 hover:shadow-xl hover:shadow-[#d4a843]/30"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <div
      className={`fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#111118]/95 shadow-2xl backdrop-blur-xl transition-all duration-300 ${
        isMinimized
          ? "bottom-6 right-6 h-14 w-72"
          : "bottom-6 right-6 h-[520px] w-[380px] max-md:inset-0 max-md:h-full max-md:w-full max-md:rounded-none"
      }`}
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-white/10 bg-gradient-to-r from-[#d4a843]/10 to-[#3b82f6]/10 px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#d4a843] to-[#c49a38]">
            <Bot size={16} className="text-black" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#f0f0f5]">SSV Shop AI Assistant</h3>
            <p className="text-[10px] text-[#10b981]">● Online</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9090a0] transition-colors hover:bg-white/5 hover:text-[#f0f0f5]"
          >
            {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9090a0] transition-colors hover:bg-white/5 hover:text-[#f0f0f5]"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex max-w-[85%] items-start gap-2 ${
                    msg.sender === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                      msg.sender === "user"
                        ? "bg-[#d4a843]/20"
                        : "bg-[#3b82f6]/20"
                    }`}
                  >
                    {msg.sender === "user" ? (
                      <User size={13} className="text-[#d4a843]" />
                    ) : (
                      <Bot size={13} className="text-[#3b82f6]" />
                    )}
                  </div>
                  <div
                    className={`whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.sender === "user"
                        ? "rounded-br-md bg-gradient-to-br from-[#d4a843] to-[#c49a38] text-black"
                        : "rounded-bl-md bg-[#1c1c28] text-[#e0e0e5] border border-white/5"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-start gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#3b82f6]/20">
                    <Bot size={13} className="text-[#3b82f6]" />
                  </div>
                  <div className="rounded-2xl rounded-bl-md bg-[#1c1c28] border border-white/5 px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#d4a843]" style={{ animationDelay: "0ms" }} />
                      <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#d4a843]" style={{ animationDelay: "150ms" }} />
                      <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#d4a843]" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-white/10 bg-[#0a0a0f]/80 p-3"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-1 rounded-xl bg-[#1c1c28] px-4 py-2.5 text-sm text-[#f0f0f5] placeholder-[#606070] outline-none border border-white/5 focus:border-[#d4a843]/50 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4a843] to-[#c49a38] text-black transition-all hover:shadow-lg hover:shadow-[#d4a843]/20 disabled:opacity-40 disabled:hover:shadow-none"
            >
              <Send size={16} />
            </button>
          </form>
        </>
      )}
    </div>
  );
}
