import type { Metadata } from "next";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Target,
  Heart,
  Users,
  Building,
} from "lucide-react";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";

export const metadata: Metadata = {
  title: "About — SSV Shop POS",
  description:
    "Learn about SSV Shop — our mission to empower Nigerian businesses with modern point-of-sale technology.",
};

const values = [
  {
    icon: Target,
    title: "Our Mission",
    description:
      "To provide affordable, reliable, and easy-to-use point-of-sale technology that empowers Nigerian businesses to compete and grow in the modern economy.",
  },
  {
    icon: Heart,
    title: "Our Vision",
    description:
      "To become the leading POS platform in West Africa, powering millions of daily transactions and helping small businesses thrive.",
  },
  {
    icon: Users,
    title: "Our Team",
    description:
      "A passionate team of developers, designers, and business experts dedicated to building tools that make running a retail business effortless.",
  },
];

const team = [
  { name: "Adewale SSV", role: "Founder & CEO", initials: "AS" },
  { name: "Blessing Okoro", role: "Head of Product", initials: "BO" },
  { name: "Chukwu Emeka", role: "Lead Engineer", initials: "CE" },
  { name: "Fatima Bello", role: "Head of Design", initials: "FB" },
];

const contactInfo = [
  { icon: MapPin, label: "Address", value: "12 Victoria Island, Lagos, Nigeria" },
  { icon: Phone, label: "Phone", value: "+234 800 SSVSHOP" },
  { icon: Mail, label: "Email", value: "support@ssvshop.com" },
  { icon: Clock, label: "Hours", value: "Mon – Fri, 8 AM – 6 PM WAT" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <PublicHeader />

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d4a843]/20 bg-[#d4a843]/10 px-4 py-1.5 text-sm font-medium text-[#d4a843]">
              <Building size={14} />
              About SSV Shop
            </div>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Empowering{" "}
              <span className="bg-gradient-to-r from-[#d4a843] to-[#c49a38] bg-clip-text text-transparent">
                Nigerian Businesses
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-[#9090a0]">
              We believe every business — from a corner shop in Surulere to a
              chain in Victoria Island — deserves access to modern, affordable
              point-of-sale technology.
            </p>
          </div>
        </div>
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-[#d4a843]/5 blur-[120px]" />
      </section>

      {/* ── Story ──────────────────────────────────────────── */}
      <section className="relative py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold sm:text-3xl">Our Story</h2>
          <div className="mt-6 space-y-4 text-[#9090a0] leading-relaxed">
            <p>
              SSV Shop was born from a simple observation: Nigerian businesses
              deserve better tools. Too many shops still rely on paper ledgers
              or outdated software that doesn&apos;t understand local payment
              methods, currencies, or business practices.
            </p>
            <p>
              Founded in Lagos in 2024, we set out to build a point-of-sale
              system designed from the ground up for the Nigerian market. We
              support Naira transactions, local payment providers like OPay and
              PalmPay, and multi-branch operations — all wrapped in a modern,
              easy-to-use interface.
            </p>
            <p>
              Today, SSV Shop powers thousands of daily transactions across
              Nigeria. From single-store retailers to multi-location chains, our
              platform scales to meet the needs of businesses at every stage of
              growth.
            </p>
          </div>
        </div>
      </section>

      {/* ── Values ─────────────────────────────────────────── */}
      <section className="relative border-y border-[#2a2a3a] bg-[#111118]/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-2xl font-bold sm:text-3xl">
            What We Stand For
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((v) => {
              const Icon = v.icon;
              return (
                <div key={v.title} className="feature-card text-center">
                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4a843]/15 to-[#3b82f6]/10 text-[#d4a843]">
                    <Icon size={24} />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-[#f0f0f5]">
                    {v.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[#9090a0]">
                    {v.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Team ───────────────────────────────────────────── */}
      <section className="relative py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-2xl font-bold sm:text-3xl">
            Meet the Team
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((member) => (
              <div key={member.name} className="feature-card text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#d4a843]/20 to-[#3b82f6]/10 text-lg font-bold text-[#d4a843]">
                  {member.initials}
                </div>
                <h3 className="text-base font-semibold text-[#f0f0f5]">
                  {member.name}
                </h3>
                <p className="mt-1 text-sm text-[#9090a0]">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact ────────────────────────────────────────── */}
      <section
        id="contact"
        className="relative border-t border-[#2a2a3a] bg-[#111118]/30 py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">Get in Touch</h2>
              <p className="mt-4 text-[#9090a0]">
                Have a question or want to learn more? We&apos;d love to hear
                from you.
              </p>
              <div className="mt-8 space-y-5">
                {contactInfo.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#d4a843]/10 text-[#d4a843]">
                        <Icon size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#f0f0f5]">
                          {item.label}
                        </p>
                        <p className="text-sm text-[#9090a0]">{item.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="glass-card flex h-64 w-full items-center justify-center rounded-2xl border border-[#2a2a3a] bg-[#16161f]/50">
                <p className="text-sm text-[#606070]">
                  Map integration coming soon
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
