"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/features", label: "Features" },
  { href: "/about", label: "About" },
  { href: "/shop", label: "Shop" },
];

export default function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-[#2a2a3a] bg-[#0a0a0f]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/favicon.svg" alt="SSV Shop" width={36} height={36} className="h-9 w-9" />
          <span className="text-xl font-black tracking-tight text-[#f0f0f5]">SSV <span className="text-[#d4a843]">Shop</span></span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-[#f0f0f5] ${
                pathname === link.href
                  ? "text-[#d4a843]"
                  : "text-[#9090a0]"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          <Link
            href="/login"
            className="btn btn-secondary !py-2 !px-4 text-sm"
          >
            Login
          </Link>
          <Link
            href="/dashboard/owner"
            className="btn btn-primary !py-2 !px-4 text-sm"
          >
            Go to Dashboard
          </Link>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="relative z-50 rounded-lg p-2 text-[#9090a0] hover:bg-white/5 md:hidden"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-16 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative mx-4 mt-2 overflow-hidden rounded-2xl border border-[#2a2a3a] bg-[#111118] p-4 shadow-2xl">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    pathname === link.href
                      ? "bg-[#d4a843]/10 text-[#d4a843]"
                      : "text-[#9090a0] hover:bg-white/5 hover:text-[#f0f0f5]"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <hr className="my-3 border-[#2a2a3a]" />
            <div className="flex flex-col gap-2">
              <div className="flex justify-center">
                <LanguageSwitcher />
              </div>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-secondary w-full text-sm"
              >
                Login
              </Link>
              <Link
                href="/dashboard/owner"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-primary w-full text-sm"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
