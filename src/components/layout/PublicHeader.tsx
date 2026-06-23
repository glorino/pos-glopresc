"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/features", label: "Features" },
  { href: "/about", label: "About" },
  { href: "/pricing", label: "Pricing" },
  { href: "/shop", label: "Shop" },
];

export default function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-[#2a2a3a] bg-[#0a0a0f]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#d4a843] to-[#c49a38]">
            <span className="text-sm font-bold text-black">G</span>
          </div>
          <span className="text-lg font-bold text-[#f0f0f5]">SSV Shop</span>
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
          className="rounded-lg p-2 text-[#9090a0] hover:bg-white/5 md:hidden"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-[#2a2a3a] px-4 pb-4 pt-2 md:hidden">
          <div className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`text-sm hover:text-[#f0f0f5] ${
                  pathname === link.href
                    ? "text-[#d4a843]"
                    : "text-[#9090a0]"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <hr className="border-[#2a2a3a]" />
            <div className="flex items-center justify-center">
              <LanguageSwitcher />
            </div>
            <Link href="/login" className="btn btn-secondary text-sm">
              Login
            </Link>
            <Link href="/dashboard/owner" className="btn btn-primary text-sm">
              Go to Dashboard
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
