"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Shield,
  Activity,
  ChevronRight,
  Play,
  ArrowRight,
  Menu,
  X,
} from "lucide-react";

const features = [
  {
    icon: ShoppingCart,
    title: "Sales Management",
    description:
      "Process transactions quickly with an intuitive interface. Support for cash, card, transfer, USSD, and mobile payments.",
  },
  {
    icon: Package,
    title: "Inventory Control",
    description:
      "Track stock levels in real-time. Set minimum thresholds, manage suppliers, and automate purchase orders.",
  },
  {
    icon: Users,
    title: "Customer Management",
    description:
      "Build lasting relationships with customer profiles, loyalty points, purchase history, and targeted communications.",
  },
  {
    icon: BarChart3,
    title: "Financial Reporting",
    description:
      "Generate comprehensive reports on sales, expenses, profits, and cash flow. Export to PDF or Excel.",
  },
  {
    icon: Shield,
    title: "Multi-Role Access",
    description:
      "Granular role-based access control for owners, managers, cashiers, accountants, and more.",
  },
  {
    icon: Activity,
    title: "Real-time Analytics",
    description:
      "Live dashboards with key metrics. Track performance, identify trends, and make data-driven decisions.",
  },
];

const stats = [
  { value: "10K+", label: "Transactions" },
  { value: "500+", label: "Businesses" },
  { value: "99.9%", label: "Uptime" },
  { value: "24/7", label: "Support" },
];

const plans = [
  {
    name: "Starter",
    price: "₦15,000",
    period: "/mo",
    description: "Perfect for small shops and solo entrepreneurs.",
    features: [
      "1 register",
      "Up to 500 products",
      "Basic reporting",
      "Email support",
      "Inventory tracking",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Professional",
    price: "₦35,000",
    period: "/mo",
    description: "For growing businesses that need more power and flexibility.",
    features: [
      "Up to 5 registers",
      "Unlimited products",
      "Advanced analytics",
      "Priority support",
      "Multi-role access",
      "Customer management",
      "Expense tracking",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Tailored solutions for large operations and franchises.",
    features: [
      "Unlimited registers",
      "Unlimited everything",
      "Dedicated account manager",
      "Custom integrations",
      "API access",
      "On-site training",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* ── Navbar ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-[#2a2a3a] bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#d4a843] to-[#c49a38]">
              <span className="text-sm font-bold text-black">G</span>
            </div>
            <span className="text-lg font-bold text-[#f0f0f5]">Glopresc</span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-sm font-medium text-[#9090a0] transition-colors hover:text-[#f0f0f5]"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="text-sm font-medium text-[#9090a0] transition-colors hover:text-[#f0f0f5]"
            >
              Pricing
            </a>
            <a
              href="#about"
              className="text-sm font-medium text-[#9090a0] transition-colors hover:text-[#f0f0f5]"
            >
              About
            </a>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/login"
              className="btn btn-secondary !py-2 !px-4 text-sm"
            >
              Login
            </Link>
            <Link href="/login" className="btn btn-primary !py-2 !px-4 text-sm">
              Get Started
            </Link>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-[#9090a0] hover:bg-white/5 md:hidden"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-[#2a2a3a] px-4 pb-4 pt-2 md:hidden">
            <div className="flex flex-col gap-3">
              <a href="#features" className="text-sm text-[#9090a0] hover:text-[#f0f0f5]">
                Features
              </a>
              <a href="#pricing" className="text-sm text-[#9090a0] hover:text-[#f0f0f5]">
                Pricing
              </a>
              <a href="#about" className="text-sm text-[#9090a0] hover:text-[#f0f0f5]">
                About
              </a>
              <hr className="border-[#2a2a3a]" />
              <Link href="/login" className="btn btn-secondary text-sm">
                Login
              </Link>
              <Link href="/login" className="btn btn-primary text-sm">
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d4a843]/20 bg-[#d4a843]/10 px-4 py-1.5 text-sm font-medium text-[#d4a843]">
              <Activity size={14} />
              Built for Nigerian Businesses
            </div>
            <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Modern POS System for{" "}
              <span className="bg-gradient-to-r from-[#d4a843] to-[#c49a38] bg-clip-text text-transparent">
                Growing Businesses
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#9090a0]">
              Glopresc gives you everything you need to run your retail or
              service business — from sales and inventory to customer management
              and financial reporting. All in one powerful, easy-to-use platform.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/login"
                className="btn btn-primary btn-lg group"
              >
                Get Started
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
              <button className="btn btn-secondary btn-lg group">
                <Play size={16} />
                Watch Demo
              </button>
            </div>
          </div>
        </div>

        {/* Glow effect */}
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-[#d4a843]/5 blur-[120px]" />
      </section>

      {/* ── Features ───────────────────────────────────────── */}
      <section id="features" className="relative py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Everything You Need to{" "}
              <span className="text-[#d4a843]">Run Your Business</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[#9090a0]">
              A complete toolkit designed to streamline operations, boost
              efficiency, and help you make smarter decisions.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="feature-card group cursor-default"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4a843]/15 to-[#3b82f6]/10 text-[#d4a843] transition-colors group-hover:from-[#d4a843]/25 group-hover:to-[#3b82f6]/15">
                    <Icon size={22} />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-[#f0f0f5]">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[#9090a0]">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────── */}
      <section className="border-y border-[#2a2a3a] bg-[#111118]/50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-[#d4a843] sm:text-4xl">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-[#9090a0]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────── */}
      <section id="pricing" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Simple, Transparent{" "}
              <span className="text-[#d4a843]">Pricing</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[#9090a0]">
              No hidden fees. No surprises. Pick the plan that fits your
              business and scale as you grow.
            </p>
          </div>
          <div className="grid gap-8 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`feature-card relative flex flex-col ${
                  plan.highlighted
                    ? "border-[#d4a843]/30 shadow-[0_0_40px_rgba(212,168,67,0.08)]"
                    : ""
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#d4a843] to-[#c49a38] px-4 py-1 text-xs font-semibold text-black">
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-[#f0f0f5]">
                    {plan.name}
                  </h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-[#f0f0f5]">
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-sm text-[#9090a0]">
                        {plan.period}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-[#9090a0]">
                    {plan.description}
                  </p>
                </div>
                <ul className="mb-8 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2 text-sm text-[#9090a0]"
                    >
                      <ChevronRight size={14} className="text-[#d4a843]" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className={`btn w-full text-center ${
                    plan.highlighted ? "btn-primary" : "btn-secondary"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer id="about" className="border-t border-[#2a2a3a] bg-[#0c0c14]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#d4a843] to-[#c49a38]">
                  <span className="text-sm font-bold text-black">G</span>
                </div>
                <span className="text-lg font-bold text-[#f0f0f5]">
                  Glopresc
                </span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-[#9090a0]">
                The modern POS platform designed for Nigerian businesses.
                Streamline your operations and grow with confidence.
              </p>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#606070]">
                Product
              </h4>
              <ul className="space-y-2 text-sm text-[#9090a0]">
                <li>
                  <a href="#features" className="hover:text-[#f0f0f5]">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-[#f0f0f5]">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#f0f0f5]">
                    Integrations
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#f0f0f5]">
                    Changelog
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#606070]">
                Company
              </h4>
              <ul className="space-y-2 text-sm text-[#9090a0]">
                <li>
                  <a href="#about" className="hover:text-[#f0f0f5]">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#f0f0f5]">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#f0f0f5]">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#f0f0f5]">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#606070]">
                Contact
              </h4>
              <ul className="space-y-2 text-sm text-[#9090a0]">
                <li>support@glopresc.com</li>
                <li>+234 800 GLOPRES</li>
                <li>Lagos, Nigeria</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-[#2a2a3a] pt-8 text-center text-xs text-[#606070]">
            &copy; {new Date().getFullYear()} Glopresc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
