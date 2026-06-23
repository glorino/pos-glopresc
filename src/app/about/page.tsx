"use client";

import Image from "next/image";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Target,
  Heart,
  Users,
  Building,
  Award,
  TrendingUp,
} from "lucide-react";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";
import { useTranslation } from "@/contexts/LanguageContext";

const valueKeys = [
  {
    icon: Target,
    titleKey: "ourMission",
    descKey: "missionDesc",
  },
  {
    icon: Heart,
    titleKey: "ourVision",
    descKey: "visionDesc",
  },
  {
    icon: Users,
    titleKey: "ourTeam",
    descKey: "teamDesc",
  },
];

const team = [
  { name: "Adewale SSV", role: "Founder & CEO", initials: "AS", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face" },
  { name: "Blessing Okoro", role: "Head of Product", initials: "BO", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face" },
  { name: "Chukwu Emeka", role: "Lead Engineer", initials: "CE", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face" },
  { name: "Fatima Bello", role: "Head of Design", initials: "FB", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face" },
];

const milestones = [
  { year: "2020", title: "Founded", desc: "SSV Shop was born from a need for better retail tools" },
  { year: "2021", title: "First 100 Users", desc: "Reached our first milestone of active businesses" },
  { year: "2022", title: "Multi-Branch", desc: "Launched multi-branch support for growing businesses" },
  { year: "2023", title: "500+ Users", desc: "Expanded to serve hundreds of retailers globally" },
];

const contactInfo = [
  { icon: MapPin, label: "Address", value: "Worldwide" },
  { icon: Phone, label: "Phone", value: "+234 800 SSVSHOP" },
  { icon: Mail, label: "Email", value: "support@ssvshop.com" },
  { icon: Clock, label: "Hours", value: "Mon – Fri, 8 AM – 6 PM" },
];

export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <PublicHeader />

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d4a843]/20 bg-[#d4a843]/10 px-4 py-1.5 text-sm font-medium text-[#d4a843] animate-fade-in-down">
                <Building size={14} />
                {t("aboutSsvShop")}
              </div>
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl animate-fade-in-up">
                {t("empoweringModernRetail")}{" "}
                <span className="bg-gradient-to-r from-[#d4a843] to-[#c49a38] bg-clip-text text-transparent">
                  {t("modernRetail")}
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-lg text-[#9090a0] animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                {t("aboutHeroDesc")}
              </p>
              <div className="mt-8 grid grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                {[
                  { icon: Users, value: "500+", label: "Active Users" },
                  { icon: Award, value: "4+", label: "Years Experience" },
                  { icon: TrendingUp, value: "99.9%", label: "Uptime" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <stat.icon size={20} className="mx-auto mb-2 text-[#d4a843]" />
                    <p className="text-xl font-bold text-[#f0f0f5]">{stat.value}</p>
                    <p className="text-xs text-[#9090a0]">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative hidden lg:block animate-fade-in-right">
              <div className="overflow-hidden rounded-2xl border border-[#2a2a3a] shadow-2xl shadow-[#d4a843]/10">
                <Image
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=500&fit=crop"
                  alt="SSV Shop Team"
                  width={800}
                  height={500}
                  className="h-[400px] w-full object-cover"
                  unoptimized
                />
              </div>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-[#d4a843]/5 blur-[120px]" />
      </section>

      {/* ── Story ──────────────────────────────────────────── */}
      <section className="relative py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="relative hidden lg:block animate-fade-in-left">
              <div className="overflow-hidden rounded-2xl border border-[#2a2a3a]">
                <Image
                  src="https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800&h=500&fit=crop"
                  alt="Our Story"
                  width={800}
                  height={500}
                  className="h-[350px] w-full object-cover"
                  unoptimized
                />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">{t("ourStory")}</h2>
              <div className="mt-6 space-y-4 text-[#9090a0] leading-relaxed">
                <p>{t("storyP1")}</p>
                <p>{t("storyP2")}</p>
                <p>{t("storyP3")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Timeline ───────────────────────────────────────── */}
      <section className="relative border-y border-[#2a2a3a] bg-[#111118]/30 py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-2xl font-bold sm:text-3xl">
            Our <span className="text-[#d4a843]">Journey</span>
          </h2>
          <div className="relative">
            <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-[#2a2a3a]" />
            {milestones.map((m, i) => (
              <div key={m.year} className={`relative mb-12 flex items-center ${i % 2 === 0 ? "flex-row" : "flex-row-reverse"}`}>
                <div className={`w-1/2 ${i % 2 === 0 ? "pr-12 text-right" : "pl-12"}`}>
                  <div className="inline-block rounded-xl border border-[#2a2a3a] bg-[#16161f] p-4">
                    <p className="text-sm font-bold text-[#d4a843]">{m.year}</p>
                    <p className="text-base font-semibold text-[#f0f0f5]">{m.title}</p>
                    <p className="mt-1 text-sm text-[#9090a0]">{m.desc}</p>
                  </div>
                </div>
                <div className="absolute left-1/2 z-10 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full border-2 border-[#d4a843] bg-[#0a0a0f]" />
                <div className="w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Values ─────────────────────────────────────────── */}
      <section className="relative py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-2xl font-bold sm:text-3xl">
            {t("whatWeStandFor")}
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
            {valueKeys.map((v) => {
              const Icon = v.icon;
              return (
                <div key={v.titleKey} className="feature-card text-center opacity-0 animate-fade-in-up">
                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4a843]/15 to-[#3b82f6]/10 text-[#d4a843]">
                    <Icon size={24} />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-[#f0f0f5]">
                    {t(v.titleKey as any)}
                  </h3>
                  <p className="text-sm leading-relaxed text-[#9090a0]">
                    {t(v.descKey as any)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Team ───────────────────────────────────────────── */}
      <section className="relative border-y border-[#2a2a3a] bg-[#111118]/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-2xl font-bold sm:text-3xl">
            {t("meetTheTeam")}
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
            {team.map((member) => (
              <div key={member.name} className="feature-card group text-center overflow-hidden opacity-0 animate-scale-in">
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={member.image}
                    alt={member.name}
                    width={200}
                    height={200}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111118] via-transparent to-transparent" />
                </div>
                <div className="px-6 pb-6">
                  <div className="mx-auto -mt-10 mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#d4a843]/20 to-[#3b82f6]/10 text-lg font-bold text-[#d4a843] ring-4 ring-[#111118]">
                    {member.initials}
                  </div>
                  <h3 className="text-base font-semibold text-[#f0f0f5]">
                    {member.name}
                  </h3>
                  <p className="mt-1 text-sm text-[#9090a0]">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact ────────────────────────────────────────── */}
      <section id="contact" className="relative py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">{t("getInTouch")}</h2>
              <p className="mt-4 text-[#9090a0]">
                {t("getInTouchDesc")}
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
            <div className="relative overflow-hidden rounded-2xl border border-[#2a2a3a] animate-fade-in-right">
              <Image
                src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=500&fit=crop"
                alt="Office"
                width={800}
                height={500}
                className="h-[350px] w-full object-cover"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f]/80 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6">
                <MapPin size={24} className="mb-2 text-[#d4a843]" />
                <p className="text-sm text-[#9090a0]">{t("mapComingSoon")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
