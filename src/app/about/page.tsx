"use client";

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
  { name: "Adewale SSV", role: "Founder & CEO", initials: "AS" },
  { name: "Blessing Okoro", role: "Head of Product", initials: "BO" },
  { name: "Chukwu Emeka", role: "Lead Engineer", initials: "CE" },
  { name: "Fatima Bello", role: "Head of Design", initials: "FB" },
];

const contactInfo = [
  { icon: MapPin, label: "Address", value: "Worldwide" },
  { icon: Phone, label: "Phone", value: "+234 800 SSVSHOP" },
  { icon: Mail, label: "Email", value: "support@ssvshop.com" },
  { icon: Clock, label: "Hours", value: "Mon – Fri, 8 AM – 6 PM WAT" },
];

export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <PublicHeader />

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="text-center">
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
            <p className="mx-auto mt-6 max-w-2xl text-lg text-[#9090a0] animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              {t("aboutHeroDesc")}
            </p>
          </div>
        </div>
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-[#d4a843]/5 blur-[120px]" />
      </section>

      {/* ── Story ──────────────────────────────────────────── */}
      <section className="relative py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold sm:text-3xl">{t("ourStory")}</h2>
          <div className="mt-6 space-y-4 text-[#9090a0] leading-relaxed animate-fade-in-left">
            <p>{t("storyP1")}</p>
            <p>{t("storyP2")}</p>
            <p>{t("storyP3")}</p>
          </div>
        </div>
      </section>

      {/* ── Values ─────────────────────────────────────────── */}
      <section className="relative border-y border-[#2a2a3a] bg-[#111118]/30 py-20">
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
      <section className="relative py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-2xl font-bold sm:text-3xl">
            {t("meetTheTeam")}
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
            {team.map((member) => (
              <div key={member.name} className="feature-card text-center overflow-hidden opacity-0 animate-scale-in">
                <div className="h-20 w-full rounded-t-xl bg-gradient-to-r from-[#d4a843]/10 via-[#3b82f6]/10 to-[#8b5cf6]/10" />
                <div className="mx-auto -mt-8 mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#d4a843]/20 to-[#3b82f6]/10 text-lg font-bold text-[#d4a843] ring-4 ring-[#111118]">
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
            <div className="flex items-center justify-center animate-fade-in-right">
              <div className="glass-card flex h-64 w-full items-center justify-center rounded-2xl border border-[#2a2a3a] bg-[#16161f]/50 overflow-hidden relative">
                <svg viewBox="0 0 400 200" className="absolute inset-0 h-full w-full opacity-10">
                  <circle cx="100" cy="80" r="30" fill="#d4a843" />
                  <circle cx="250" cy="120" r="20" fill="#3b82f6" />
                  <circle cx="320" cy="60" r="15" fill="#8b5cf6" />
                  <line x1="100" y1="80" x2="250" y2="120" stroke="#d4a843" strokeWidth="1" strokeDasharray="4" />
                  <line x1="250" y1="120" x2="320" y2="60" stroke="#3b82f6" strokeWidth="1" strokeDasharray="4" />
                  <circle cx="100" cy="80" r="5" fill="#d4a843" />
                  <circle cx="250" cy="120" r="5" fill="#3b82f6" />
                  <circle cx="320" cy="60" r="5" fill="#8b5cf6" />
                </svg>
                <div className="relative z-10 text-center">
                  <MapPin size={32} className="mx-auto mb-2 text-[#d4a843]" />
                  <p className="text-sm text-[#9090a0]">{t("mapComingSoon")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
