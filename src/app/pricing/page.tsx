"use client";

import { useState } from "react";
import {
  Send,
  Check,
  X,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Shield,
  Activity,
  GitBranch,
} from "lucide-react";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";

const roles = ["Owner", "Manager", "Cashier", "Accountant", "Inventory Clerk"];

const features = [
  { name: "Sales & Checkout", icon: ShoppingCart, owner: true, manager: true, cashier: true, accountant: false, clerk: false },
  { name: "Inventory Management", icon: Package, owner: true, manager: true, cashier: false, accountant: false, clerk: true },
  { name: "Customer Management", icon: Users, owner: true, manager: true, cashier: true, accountant: false, clerk: false },
  { name: "Financial Reports", icon: BarChart3, owner: true, manager: true, cashier: false, accountant: true, clerk: false },
  { name: "User & Role Management", icon: Shield, owner: true, manager: false, cashier: false, accountant: false, clerk: false },
  { name: "Analytics Dashboard", icon: Activity, owner: true, manager: true, cashier: false, accountant: true, clerk: false },
  { name: "Procurement & Orders", icon: GitBranch, owner: true, manager: true, cashier: false, accountant: false, clerk: true },
];

function hasAccess(feature: (typeof features)[number], role: string): boolean {
  switch (role) {
    case "Owner": return feature.owner;
    case "Manager": return feature.manager;
    case "Cashier": return feature.cashier;
    case "Accountant": return feature.accountant;
    case "Inventory Clerk": return feature.clerk;
    default: return false;
  }
}

export default function PricingPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    branches: "1",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <PublicHeader />

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d4a843]/20 bg-[#d4a843]/10 px-4 py-1.5 text-sm font-medium text-[#d4a843]">
              <Activity size={14} />
              Simple Pricing
            </div>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Request a{" "}
              <span className="bg-gradient-to-r from-[#d4a843] to-[#c49a38] bg-clip-text text-transparent">
                Custom Quote
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-[#9090a0]">
              SSV Shop is tailored to your business. Tell us about your needs
              and we&apos;ll put together a package that works for you.
            </p>
          </div>
        </div>
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-[#d4a843]/5 blur-[120px]" />
      </section>

      {/* ── Why Custom Pricing ─────────────────────────────── */}
      <section className="relative py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              { title: "Pay For What You Use", desc: "Only pay for the features and number of users your business actually needs." },
              { title: "Scale As You Grow", desc: "Add branches, users, and modules anytime — your plan grows with you." },
              { title: "Dedicated Support", desc: "Every plan includes onboarding, training, and ongoing priority support." },
            ].map((item) => (
              <div key={item.title} className="feature-card text-center">
                <h3 className="mb-2 text-base font-semibold text-[#f0f0f5]">
                  {item.title}
                </h3>
                <p className="text-sm text-[#9090a0]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature Comparison ─────────────────────────────── */}
      <section className="relative border-y border-[#2a2a3a] bg-[#111118]/30 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-4 text-center text-2xl font-bold sm:text-3xl">
            Feature Access by Role
          </h2>
          <p className="mx-auto mb-12 max-w-xl text-center text-[#9090a0]">
            Every role comes with a tailored set of permissions. See what each
            team member can access.
          </p>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-1/3">Feature</th>
                  {roles.map((r) => (
                    <th key={r} className="text-center">
                      {r}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {features.map((f) => {
                  const Icon = f.icon;
                  return (
                    <tr key={f.name}>
                      <td>
                        <div className="flex items-center gap-3">
                          <Icon size={16} className="text-[#d4a843]" />
                          <span className="font-medium text-[#f0f0f5]">
                            {f.name}
                          </span>
                        </div>
                      </td>
                      {roles.map((r) => (
                        <td key={r} className="text-center">
                          {hasAccess(f, r) ? (
                            <Check size={16} className="mx-auto text-[#10b981]" />
                          ) : (
                            <X size={16} className="mx-auto text-[#606070]" />
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Contact Form ───────────────────────────────────── */}
      <section id="quote" className="relative py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-4 text-center text-2xl font-bold sm:text-3xl">
            Get Your Custom Quote
          </h2>
          <p className="mx-auto mb-12 max-w-xl text-center text-[#9090a0]">
            Fill out the form below and our team will reach out within 24 hours
            with a tailored proposal.
          </p>

          {submitted ? (
            <div className="glass-card mx-auto max-w-md p-12 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#10b981]/15 text-[#10b981]">
                <Check size={28} />
              </div>
              <h3 className="text-xl font-semibold text-[#f0f0f5]">
                Request Submitted!
              </h3>
              <p className="mt-2 text-sm text-[#9090a0]">
                Thank you, {formData.name}. Our team will contact you at{" "}
                {formData.email} within 24 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="glass-card space-y-5 p-8">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#9090a0]">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    className="input"
                    placeholder="Adewale SSV"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#9090a0]">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    className="input"
                    placeholder="you@company.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#9090a0]">
                    Phone
                  </label>
                  <input
                    type="tel"
                    className="input"
                    placeholder="+234 800 000 0000"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#9090a0]">
                    Company Name
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="SSV Enterprises"
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({ ...formData, company: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#9090a0]">
                  Number of Branches
                </label>
                <select
                  className="input select"
                  value={formData.branches}
                  onChange={(e) =>
                    setFormData({ ...formData, branches: e.target.value })
                  }
                >
                  <option value="1">1 Branch</option>
                  <option value="2-5">2 – 5 Branches</option>
                  <option value="6-10">6 – 10 Branches</option>
                  <option value="10+">10+ Branches</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#9090a0]">
                  Tell Us About Your Needs
                </label>
                <textarea
                  rows={4}
                  className="input resize-none"
                  placeholder="What features are most important to you? Any special requirements?"
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                />
              </div>
              <button type="submit" className="btn btn-primary btn-lg w-full group">
                Submit Request
                <Send
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </button>
            </form>
          )}
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
