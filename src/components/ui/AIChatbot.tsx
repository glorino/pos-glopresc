"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { MessageCircle, X, Send, Bot, User, Minimize2, Maximize2, ShoppingCart, Package, BarChart3, Users, Settings, HelpCircle } from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  quickReplies?: string[];
}

const QUICK_ACTIONS = [
  { label: "Process a Sale", icon: ShoppingCart, query: "how to process a sale" },
  { label: "Add Product", icon: Package, query: "how to add a product" },
  { label: "View Reports", icon: BarChart3, query: "how to generate reports" },
  { label: "Manage Inventory", icon: Settings, query: "how to manage inventory" },
  { label: "Customer Help", icon: Users, query: "how to add customers" },
  { label: "Get Help", icon: HelpCircle, query: "help" },
];

const BOT_RESPONSES: { keywords: string[]; response: string }[] = [
  {
    keywords: ["process a sale", "make a sale", "sell", "pos", "checkout", "sell item", "new sale", "transact"],
    response: "To process a sale:\n\n1. Go to **POS Terminal** from the sidebar\n2. **Search** or **scan** products to add to cart\n3. Set **quantity** for each item\n4. Choose a **payment method** (Cash, Card, Transfer, USSD, Mobile)\n5. Enter the **amount received** (for cash)\n6. Click **'Complete Sale'** to finish\n\n💡 **Tip:** Press **F9** to quickly complete a sale, **F2** to search, **F5** to clear cart."
  },
  {
    keywords: ["add product", "new product", "create product", "product", "add item", "stock item"],
    response: "To add a new product:\n\n1. Go to **Products** in the sidebar\n2. Click **'Add Product'** button\n3. Fill in details:\n   - Name, SKU (auto-generated)\n   - Price & Cost Price\n   - Category & Supplier\n   - Stock quantity & Min level\n4. Save the product\n\n💡 Products appear in the POS terminal immediately after adding."
  },
  {
    keywords: ["report", "analytics", "sales report", "financial", "revenue", "profit"],
    response: "To generate reports:\n\n1. Go to **Reports** from the sidebar\n2. Choose report type:\n   - **Sales Report** — by product, category, cashier\n   - **Inventory Report** — stock levels, movement\n   - **Financial Report** — P&L, cash flow\n3. Select **date range**\n4. Click **Generate Report**\n5. Export as **PDF** or **print** directly\n\n💡 You can filter by branch, payment method, and more."
  },
  {
    keywords: ["inventory", "stock", "manage inventory", "stock management", "warehouse"],
    response: "To manage inventory:\n\n1. Go to **Inventory > Stock Management**\n2. View current stock levels\n3. **Stock Adjustment** — add/remove stock\n4. **Stock Transfer** — move between branches\n5. Set **minimum stock levels** for alerts\n6. Run **Stock Take** for physical counts\n\n💡 Low stock items trigger automatic alerts to procurement."
  },
  {
    keywords: ["refund", "return", "process return", "money back"],
    response: "To process a refund:\n\n1. Go to **Sales** from the sidebar\n2. Find the original transaction\n3. Click **'Process Return'**\n4. Select items being returned\n5. Choose **refund method**\n6. Confirm the refund\n\n💡 Stock is automatically adjusted when a return is processed."
  },
  {
    keywords: ["customer", "add customer", "client", "new customer", "manage customer"],
    response: "To manage customers:\n\n1. Go to **Customers** from the sidebar\n2. Click **'Add Customer'**\n3. Fill in: Name, Email, Phone, Address\n4. Save the customer\n\n💡 Customers earn **loyalty points** automatically on every purchase!"
  },
  {
    keywords: ["supplier", "procurement", "purchase order", "vendor", "ordering"],
    response: "To manage suppliers:\n\n1. Go to **Procurement** from the sidebar\n2. View all suppliers\n3. Click **'Add Supplier'** for new ones\n4. Create **Purchase Orders**\n5. Track **delivery status**\n6. Match **invoices** against orders\n\n💡 Set up auto-reordering based on stock thresholds."
  },
  {
    keywords: ["expense", "track expense", "add expense", "spending", "cost"],
    response: "To track expenses:\n\n1. Go to **Accounting > Expenses**\n2. View expenses by category\n3. Click **'Add Expense'**\n4. Fill in: Amount, Category, Description\n5. Attach **receipt photo**\n6. Submit for approval\n\n💡 Expenses need manager/owner approval before being recorded."
  },
  {
    keywords: ["approve expense", "expense approval"],
    response: "To approve expenses:\n\n1. Go to **Accounting > Expenses**\n2. Click the **'Pending'** tab\n3. Review expense details & receipts\n4. Click **'Approve'** or **'Reject'**\n5. Add notes if rejecting"
  },
  {
    keywords: ["audit", "audit log", "activity log", "track activity"],
    response: "To view audit logs:\n\n1. Go to **Auditor > Audit Logs**\n2. View all system activities\n3. Filter by user, action type, or date\n4. Click any entry for details\n5. **Export** logs for compliance\n\n💡 Every action in the system is tracked with timestamp and user."
  },
  {
    keywords: ["role", "permission", "access", "user role", "who can"],
    response: "SSV Shop has 11 roles:\n\n• **Owner** — Full system access\n• **Manager** — Operations & management\n• **Warehouse Manager** — Stock management\n• **Warehouse Rep** — Stock adjustments\n• **Procurement Manager** — Supplier & PO management\n• **Procurement Rep** — Stock requests\n• **Sales Manager** — Sales oversight\n• **Sales Rep** — POS terminal\n• **Accountant** — Financial management\n• **Auditor** — System audit\n• **Customer** — Self-service portal\n\n💡 Each role has specific permissions and dashboard views."
  },
  {
    keywords: ["close register", "close drawer", "close cash", "end of day", "cash register"],
    response: "To close the cash register:\n\n1. Go to **POS Terminal**\n2. Click **'Close Drawer'**\n3. Count the physical cash\n4. Enter the actual balance\n5. System calculates any **difference**\n6. Confirm to close\n\n💡 A summary report is generated automatically."
  },
  {
    keywords: ["stock take", "physical count", "inventory count"],
    response: "To run a stock take:\n\n1. Go to **Inventory > Stock Adjustment**\n2. Click **'New Stock Take'**\n3. Count physical stock for each product\n4. Enter counted quantities\n5. Submit the stock take\n6. Differences are recorded as adjustments"
  },
  {
    keywords: ["booking", "schedule", "appointment", "reservation"],
    response: "To schedule a booking:\n\n1. Go to **Bookings** from the sidebar\n2. Click **'New Booking'**\n3. Select the customer\n4. Choose service type & date/time\n5. Add description & notes\n6. Save the booking"
  },
  {
    keywords: ["branch", "multi-branch", "location", "store"],
    response: "SSV Shop supports **multi-branch** operations:\n\n• Manage multiple locations from one account\n• Centralized reporting across branches\n• Branch-specific settings (tax, receipt)\n• Stock transfers between branches\n• Per-branch user assignments\n\n💡 Go to **Owner > Branches** to manage your locations."
  },
  {
    keywords: ["shipping", "delivery", "deliver", "ship"],
    response: "SSV Shop supports shipping:\n\n• **Google Maps** distance-based calculation\n• Configurable **rate per km** in Settings\n• **Free shipping** threshold option\n• Real-time **delivery estimates**\n\n💡 Admin can configure shipping in **Settings > Shipping**."
  },
  {
    keywords: ["payment", "pay", "flutterwave", "card", "transfer", "mobile"],
    response: "Supported payment methods:\n\n• **Cash** — Physical cash payments\n• **Card** — Debit/Credit cards\n• **Bank Transfer** — Direct transfers\n• **USSD** — Mobile banking\n• **Mobile** — Mobile wallets\n• **Online** — Flutterwave integration\n\n💡 All payments are tracked and reconciled automatically."
  },
  {
    keywords: ["settings", "configure", "setup", "configuration"],
    response: "To configure your system:\n\n1. Go to **Settings** (Owner only)\n2. **Business Info** — Name, address, contact\n3. **Currency & Tax** — Set VAT rate\n4. **Receipt** — Customize header/footer\n5. **Shipping** — Set origin & rate per km\n6. **Notifications** — Email/SMS settings\n7. **Security** — Session & password policy"
  },
  {
    keywords: ["receipt", "print receipt", "thermal"],
    response: "Receipt features:\n\n• Auto-generated after every sale\n• **Print** directly from POS terminal\n• **Digital receipt** via SMS (if configured)\n• Customizable **header & footer**\n• Supports 58mm, 80mm, and A4 paper\n\n💡 Receipt settings are in **Settings > Receipt**."
  },
  {
    keywords: ["sms", "notification", "text message"],
    response: "SMS notifications:\n\n• **Auto-receipts** sent via SMS after sale\n• **Low stock alerts** to procurement\n• **Order confirmations** to customers\n• Powered by **Termii** SMS provider\n\n💡 Enable in **Settings > Notifications**."
  },
  {
    keywords: ["barcode", "scan", "scanner", "quagga"],
    response: "Barcode scanning:\n\n• Use the **Scan** button in POS terminal\n• Camera-based scanning with **Quagga2**\n• Works with standard **EAN/UPC** barcodes\n• Products matched by SKU or barcode\n\n💡 Press the **Scan** button or use a USB barcode scanner."
  },
  {
    keywords: ["hello", "hi", "hey", "good morning", "good afternoon", "good evening"],
    response: "Hello! 👋 I'm the **SSV Shop AI Assistant**.\n\nI can help you with:\n• Processing sales\n• Managing inventory\n• Generating reports\n• Customer management\n• System configuration\n\nWhat would you like to know?"
  },
  {
    keywords: ["help", "what can you do", "options", "menu"],
    response: "Here's what I can help with:\n\n🛒 **Sales** — Process sales, returns, receipts\n📦 **Inventory** — Stock management, transfers\n📊 **Reports** — Sales, financial, inventory reports\n👥 **Customers** — Add & manage customers\n🏭 **Suppliers** — Procurement & purchase orders\n💰 **Accounting** — Expenses, invoices\n⚙️ **Settings** — System configuration\n🔍 **Audit** — Activity logs\n\nJust ask a question or tap a quick action below!"
  },
  {
    keywords: ["thank", "thanks", "appreciate"],
    response: "You're welcome! 😊 Feel free to ask anything else. I'm here to help 24/7."
  },
  {
    keywords: ["bye", "goodbye", "see you"],
    response: "Goodbye! 👋 Have a great day. I'm always here if you need help."
  },
  {
    keywords: ["price", "cost", "how much", "pricing"],
    response: "Product prices are set when adding/editing products:\n\n1. Go to **Products**\n2. Click on a product or **Add Product**\n3. Set **Price** (selling price)\n4. Set **Cost Price** (for profit calculation)\n\n💡 The system automatically calculates profit margins and revenue."
  },
  {
    keywords: ["profit", "margin", "earnings", "revenue"],
    response: "To view profit information:\n\n1. Go to **Reports > Financial**\n2. View **Profit & Loss** statement\n3. See revenue vs expenses\n4. Check profit margins by product\n\n💡 Profit = Revenue - (Cost of Goods + Expenses)"
  },
  {
    keywords: ["user", "add user", "staff", "employee", "team"],
    response: "To manage users (Owner only):\n\n1. Go to **Users** from the sidebar\n2. Click **'Add User'**\n3. Fill in: Name, Email, Role\n4. Set initial password\n5. Assign to a branch (optional)\n\n💡 Each user gets a personalized dashboard based on their role."
  },
];

function getBotResponse(input: string): { text: string; quickReplies?: string[] } {
  const lower = input.toLowerCase().trim();
  
  for (const entry of BOT_RESPONSES) {
    for (const keyword of entry.keywords) {
      if (lower.includes(keyword) || keyword.includes(lower)) {
        return { text: entry.response, quickReplies: ["Help", "What else?"] };
      }
    }
  }

  // Fuzzy matching
  if (lower.match(/\b(sale|sell|pos|checkout|cash|card|payment)\b/)) {
    return { text: BOT_RESPONSES[0].response, quickReplies: ["Add Product", "View Reports"] };
  }
  if (lower.match(/\b(product|item|add|stock|inventory)\b/)) {
    return { text: BOT_RESPONSES[1].response, quickReplies: ["Process Sale", "Manage Stock"] };
  }
  if (lower.match(/\b(report|analytic|revenue|profit|chart)\b/)) {
    return { text: BOT_RESPONSES[2].response, quickReplies: ["Sales Report", "Financial Report"] };
  }
  if (lower.match(/\b(inventory|stock|warehouse|quantity)\b/)) {
    return { text: BOT_RESPONSES[3].response, quickReplies: ["Stock Take", "Stock Transfer"] };
  }
  if (lower.match(/\b(refund|return|money back)\b/)) {
    return { text: BOT_RESPONSES[4].response, quickReplies: ["View Sales", "Help"] };
  }
  if (lower.match(/\b(customer|client|buyer)\b/)) {
    return { text: BOT_RESPONSES[5].response, quickReplies: ["Add Customer", "View Customers"] };
  }
  if (lower.match(/\b(supplier|vendor|procurement|purchase)\b/)) {
    return { text: BOT_RESPONSES[6].response, quickReplies: ["Add Supplier", "Create PO"] };
  }
  if (lower.match(/\b(expense|cost|spend|budget)\b/)) {
    return { text: BOT_RESPONSES[7].response, quickReplies: ["Track Expenses", "Approve Expenses"] };
  }

  return { 
    text: "I'm not sure I understand that. Could you rephrase? Here are some things I can help with:\n\n• Processing sales\n• Managing products & inventory\n• Generating reports\n• Customer management\n• System settings\n\nTry asking about any of these topics!",
    quickReplies: ["Help", "Process a Sale", "Manage Inventory"]
  };
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: generateId(),
      text: "Hello! 👋 I'm the **SSV Shop AI Assistant**.\n\nI can help you with sales, inventory, reports, and more. What would you like to know?",
      sender: "bot",
      timestamp: new Date(),
      quickReplies: ["Process a Sale", "Add Product", "View Reports", "Help"],
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

  function handleQuickReply(query: string) {
    const userMsg: Message = {
      id: generateId(),
      text: query,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      const result = getBotResponse(query);
      const botMsg: Message = {
        id: generateId(),
        text: result.text,
        sender: "bot",
        timestamp: new Date(),
        quickReplies: result.quickReplies,
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 500 + Math.random() * 500);
  }

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
      const result = getBotResponse(userMsg.text);
      const botMsg: Message = {
        id: generateId(),
        text: result.text,
        sender: "bot",
        timestamp: new Date(),
        quickReplies: result.quickReplies,
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 600 + Math.random() * 600);
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="group fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#d4a843] to-[#c49a38] text-black shadow-lg shadow-[#d4a843]/20 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-[#d4a843]/40 animate-pulse-glow"
      >
        <MessageCircle size={24} className="transition-transform group-hover:rotate-12" />
      </button>
    );
  }

  return (
    <div
      className={`fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#111118]/95 shadow-2xl backdrop-blur-xl transition-all duration-300 ${
        isMinimized
          ? "bottom-6 right-6 h-14 w-72"
          : "bottom-6 right-6 h-[560px] w-[380px] max-md:inset-0 max-md:h-full max-md:w-full max-md:rounded-none"
      }`}
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-white/10 bg-gradient-to-r from-[#d4a843]/10 to-[#3b82f6]/10 px-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#d4a843] to-[#c49a38]">
            <Bot size={16} className="text-black" />
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#111118] bg-[#10b981]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#f0f0f5]">SSV Shop Assistant</h3>
            <p className="text-[10px] text-[#10b981]">● Online — Ready to help</p>
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
            {/* Quick Actions Grid (show on first message only) */}
            {messages.length === 1 && (
              <div className="grid grid-cols-2 gap-2 mb-2">
                {QUICK_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.label}
                      onClick={() => handleQuickReply(action.query)}
                      className="flex items-center gap-2 rounded-xl border border-[#2a2a3a] bg-[#1c1c28]/50 p-2.5 text-left text-xs text-[#9090a0] transition-all hover:border-[#d4a843]/30 hover:bg-[#1c1c28] hover:text-[#f0f0f5]"
                    >
                      <Icon size={14} className="shrink-0 text-[#d4a843]" />
                      {action.label}
                    </button>
                  );
                })}
              </div>
            )}

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
                  <div>
                    <div
                      className={`whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        msg.sender === "user"
                          ? "rounded-br-md bg-gradient-to-br from-[#d4a843] to-[#c49a38] text-black"
                          : "rounded-bl-md bg-[#1c1c28] text-[#e0e0e5] border border-white/5"
                      }`}
                    >
                      {msg.text.split("**").map((part, i) => 
                        i % 2 === 1 ? <strong key={i} className="text-[#f0f0f5]">{part}</strong> : part
                      )}
                    </div>
                    {/* Quick Reply Buttons */}
                    {msg.sender === "bot" && msg.quickReplies && msg.quickReplies.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {msg.quickReplies.map((reply) => (
                          <button
                            key={reply}
                            onClick={() => handleQuickReply(reply)}
                            className="rounded-full border border-[#d4a843]/30 bg-[#d4a843]/5 px-3 py-1 text-[11px] font-medium text-[#d4a843] transition-all hover:bg-[#d4a843]/15"
                          >
                            {reply}
                          </button>
                        ))}
                      </div>
                    )}
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
