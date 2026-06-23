"use client";

import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Search,
  Bell,
  ChevronDown,
  Menu,
  LogOut,
  User,
  Settings,
} from "lucide-react";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

interface TopbarProps {
  title: string;
  user: {
    name: string;
    role: string;
    email: string;
  };
}

export default function Topbar({ title, user }: TopbarProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const roleBadge = user.role.replace("_", " ");

  return (
    <header className="topbar flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => {
            const sidebar = document.getElementById("sidebar");
            sidebar?.classList.toggle("open");
          }}
          className="rounded-lg p-2 text-[#9090a0] hover:bg-white/5 lg:hidden"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-semibold text-[#f0f0f5]">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden sm:block">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606070]"
          />
          <input
            type="text"
            placeholder="Search..."
            className="input !py-2 !pl-9 !pr-4 !text-sm w-56 focus:w-64 transition-all"
          />
        </div>

        <button className="relative rounded-lg p-2 text-[#9090a0] hover:bg-white/5">
          <Bell size={18} />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#f43f5e] text-[10px] font-bold text-white">
            3
          </span>
        </button>

        <LanguageSwitcher />

        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/5"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#d4a843] to-[#c49a38] text-xs font-bold text-black">
              {initials}
            </div>
            <div className="hidden text-left md:block">
              <p className="text-sm font-medium text-[#f0f0f5]">{user.name}</p>
              <p className="text-xs text-[#606070] capitalize">{roleBadge}</p>
            </div>
            <ChevronDown
              size={14}
              className={`hidden text-[#606070] transition-transform md:block ${
                dropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-[#2a2a3a] bg-[#16161f] p-1.5 shadow-xl">
              <div className="mb-1 border-b border-[#2a2a3a] px-3 py-2">
                <p className="text-sm font-medium text-[#f0f0f5]">
                  {user.name}
                </p>
                <p className="text-xs text-[#606070]">{user.email}</p>
              </div>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  router.push("/dashboard/owner/settings");
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#9090a0] hover:bg-white/5 hover:text-[#f0f0f5]"
              >
                <User size={14} />
                Profile
              </button>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  router.push("/dashboard/owner/settings");
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#9090a0] hover:bg-white/5 hover:text-[#f0f0f5]"
              >
                <Settings size={14} />
                Settings
              </button>
              <hr className="my-1 border-[#2a2a3a]" />
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#f43f5e] hover:bg-[rgba(244,63,94,0.1)]"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
