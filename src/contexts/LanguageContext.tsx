"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { en, fr, type TranslationKey } from "@/lib/translations";
import { APP_NAME } from "@/lib/utils";

type Language = "en" | "fr";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = { en, fr };
const BRAND_PATTERN = /SSV Shop/g;

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function replaceBrand(text: string): string {
  return text.replace(BRAND_PATTERN, APP_NAME);
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("language") as Language | null;
    if (stored && (stored === "en" || stored === "fr")) {
      setLanguageState(stored);
    }
    setMounted(true);
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  }, []);

  const t = useCallback(
    (key: string): string => {
      const raw = translations[language][key as TranslationKey] ?? key;
      return typeof raw === "string" ? replaceBrand(raw) : raw;
    },
    [language]
  );

  if (!mounted) {
    return (
      <LanguageContext.Provider value={{ language: "en", setLanguage, t: (key) => replaceBrand(translations.en[key as TranslationKey] ?? key) }}>
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}
