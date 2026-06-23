"use client";

import { useState, useRef, useEffect } from "react";
import { Globe } from "lucide-react";
import { useTranslation } from "@/contexts/LanguageContext";

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[#9090a0] hover:bg-white/5 transition-colors"
        title={t("language")}
      >
        <Globe size={18} />
        <span className="text-xs font-semibold uppercase">{language}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-36 rounded-xl border border-[#2a2a3a] bg-[#16161f] p-1.5 shadow-xl">
          <button
            onClick={() => { setLanguage("en"); setOpen(false); }}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
              language === "en"
                ? "bg-[#d4a843]/15 text-[#d4a843]"
                : "text-[#9090a0] hover:bg-white/5 hover:text-[#f0f0f5]"
            }`}
          >
            <span className="text-base">🇬🇧</span>
            {t("english")}
          </button>
          <button
            onClick={() => { setLanguage("fr"); setOpen(false); }}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
              language === "fr"
                ? "bg-[#d4a843]/15 text-[#d4a843]"
                : "text-[#9090a0] hover:bg-white/5 hover:text-[#f0f0f5]"
            }`}
          >
            <span className="text-base">🇫🇷</span>
            {t("french")}
          </button>
        </div>
      )}
    </div>
  );
}
