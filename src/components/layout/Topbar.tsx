"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
  Check,
  Info,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { useTranslation } from "@/contexts/LanguageContext";

interface TopbarProps {
  title: string;
  user: {
    name: string;
    role: string;
    email: string;
  };
  onMenuToggle?: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

const NOTIF_ICONS: Record<string, typeof Bell> = {
  INFO: Info,
  SUCCESS: CheckCircle,
  WARNING: AlertTriangle,
  ERROR: AlertTriangle,
  STOCK_ALERT: AlertTriangle,
};

export default function Topbar({ title, user, onMenuToggle }: TopbarProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setNotifLoading(true);
      const res = await fetch("/api/notifications?limit=10");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // silent
    } finally {
      setNotifLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function markAsRead(id: string) {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silent
    }
  }

  async function markAllRead() {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // silent
    }
  }

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
          onClick={onMenuToggle}
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
            placeholder={t("searchPlaceholder")}
            className="input !py-2 !pl-9 !pr-4 !text-sm w-56 focus:w-64 transition-all"
          />
        </div>

        {/* Notification Bell */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => {
              setNotifOpen(!notifOpen);
              if (!notifOpen) fetchNotifications();
            }}
            className="relative rounded-lg p-2 text-[#9090a0] hover:bg-white/5 transition-colors"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#f43f5e] text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-80 max-h-[70vh] overflow-hidden rounded-xl border border-[#2a2a3a] bg-[#16161f] shadow-xl sm:w-96">
              <div className="flex items-center justify-between border-b border-[#2a2a3a] px-4 py-3">
                <h3 className="text-sm font-semibold text-[#f0f0f5]">{t("notifications")}</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-xs text-[#d4a843] hover:text-[#c49a38] transition-colors"
                  >
                    <Check size={12} />
                    {t("markAllRead")}
                  </button>
                )}
              </div>

              <div className="overflow-y-auto max-h-[calc(70vh-52px)]">
                {notifLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#d4a843] border-t-transparent" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-[#606070]">
                    <Bell size={32} className="mb-2 opacity-30" />
                    <p className="text-sm">{t("noNotifications")}</p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const IconComp = NOTIF_ICONS[notif.type] || Info;
                    return (
                      <button
                        key={notif.id}
                        onClick={() => {
                          markAsRead(notif.id);
                          if (notif.link) {
                            router.push(notif.link);
                            setNotifOpen(false);
                          }
                        }}
                        className={`flex w-full items-start gap-3 border-b border-[#2a2a3a]/50 px-4 py-3 text-left transition-colors hover:bg-white/5 ${
                          !notif.isRead ? "bg-[#d4a843]/5" : ""
                        }`}
                      >
                        <div
                          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                            notif.type === "SUCCESS"
                              ? "bg-[#10b981]/10 text-[#10b981]"
                              : notif.type === "ERROR" || notif.type === "WARNING"
                              ? "bg-[#f43f5e]/10 text-[#f43f5e]"
                              : "bg-[#d4a843]/10 text-[#d4a843]"
                          }`}
                        >
                          <IconComp size={14} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-medium truncate ${!notif.isRead ? "text-[#f0f0f5]" : "text-[#9090a0]"}`}>
                              {notif.title}
                            </p>
                            {!notif.isRead && (
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#d4a843]" />
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-[#606070] truncate">{notif.message}</p>
                          <p className="mt-1 text-[10px] text-[#4a4a5a]">
                            {new Date(notif.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

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
