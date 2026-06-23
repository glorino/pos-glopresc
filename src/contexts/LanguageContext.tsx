"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { en, fr, type TranslationKey } from "@/lib/translations";

type Language = "en" | "fr";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const translations = { en, fr };

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

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
    (key: TranslationKey): string => {
      return translations[language][key] ?? key;
    },
    [language]
  );

  if (!mounted) {
    return (
      <LanguageContext.Provider value={{ language: "en", setLanguage, t: (key) => translations.en[key] ?? key }}>
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
