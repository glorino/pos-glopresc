"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Building2,
  Coins,
  FileText,
  Bell,
  Shield,
  Save,
  Upload,
  Truck,
} from "lucide-react";
import { useTranslation } from "@/contexts/LanguageContext";

interface Settings {
  [group: string]: Record<string, string>;
}

const defaultSettings: Settings = {
  business: {
    name: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    logo: "",
  },
  currency: {
    code: "NGN",
    symbol: "₦",
    taxRate: "7.5",
    taxInclusive: "false",
  },
  receipt: {
    header: "SSV Shop",
    footer: "Thank you for your purchase!",
    paperSize: "80mm",
  },
  notifications: {
    emailNotifications: "true",
    smsNotifications: "false",
  },
  security: {
    sessionTimeout: "30",
    passwordPolicy: "medium",
    twoFactorAuth: "false",
  },
  shipping: {
    originAddress: "",
    ratePerKm: "100",
    minFee: "500",
    freeShippingThreshold: "0",
  },
};

export default function BusinessSettingsPage() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setSettings((prev) => ({
              ...prev,
              ...Object.fromEntries(
                Object.entries(data.settings).map(([group, values]) => [
                  group,
                  { ...prev[group], ...(values as Record<string, string>) },
                ])
              ),
            }));
          }
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  async function saveGroup(group: string) {
    setSaving(group);
    setSuccess("");
    try {
      const settingsToSave = settings[group];
      const entries: Record<string, string> = {};
      for (const [key, value] of Object.entries(settingsToSave)) {
        entries[`${group}.${key}`] = value;
      }
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: entries }),
      });
      if (res.ok) {
        setSuccess(t("settingsSaved"));
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setSaving("");
    }
  }

  function updateSetting(group: string, key: string, value: string) {
    setSettings((prev) => ({
      ...prev,
      [group]: { ...prev[group], [key]: value },
    }));
  }

  if (loading) {
    return (
      <DashboardLayout title={t("businessSettings")}>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4a843] border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  const sections = [
    {
      key: "business",
      title: t("businessInformation"),
      icon: Building2,
      fields: [
        { key: "name", label: t("businessName"), type: "text" },
        { key: "address", label: t("addressLabel"), type: "text" },
        { key: "phone", label: t("phoneLabel"), type: "tel" },
        { key: "email", label: t("emailLabel"), type: "email" },
        { key: "website", label: t("websiteLabel"), type: "url" },
      ],
    },
    {
      key: "currency",
      title: t("currencyTax"),
      icon: Coins,
      fields: [
        { key: "code", label: t("currencyLabel"), type: "select", options: ["NGN"] },
        { key: "symbol", label: t("symbolLabel"), type: "text" },
        { key: "taxRate", label: t("taxRatePercent"), type: "number" },
      ],
      toggles: [{ key: "taxInclusive", label: t("taxInclusive") }],
    },
    {
      key: "receipt",
      title: t("receiptSettings"),
      icon: FileText,
      fields: [
        { key: "header", label: t("receiptHeader"), type: "text" },
        { key: "footer", label: t("receiptFooter"), type: "text" },
        {
          key: "paperSize",
          label: t("paperSize"),
          type: "select",
          options: ["58mm", "80mm", "A4"],
        },
      ],
    },
    {
      key: "notifications",
      title: t("notificationSettings"),
      icon: Bell,
      toggles: [
        { key: "emailNotifications", label: t("emailNotifications") },
        { key: "smsNotifications", label: t("smsNotifications") },
      ],
    },
    {
      key: "security",
      title: t("securityLabel"),
      icon: Shield,
      fields: [
        {
          key: "sessionTimeout",
          label: t("sessionTimeout"),
          type: "number",
        },
        {
          key: "passwordPolicy",
          label: t("passwordPolicy"),
          type: "select",
          options: ["low", "medium", "high"],
        },
      ],
      toggles: [{ key: "twoFactorAuth", label: t("twoFactorAuth") }],
    },
    {
      key: "shipping",
      title: t("shippingSettings"),
      icon: Truck,
      fields: [
        { key: "originAddress", label: t("businessAddressShipping"), type: "text" },
        { key: "ratePerKm", label: `${t("shippingFeePerKm")} (₦)`, type: "number" },
        { key: "minFee", label: `${t("minimumShippingFee")} (₦)`, type: "number" },
        { key: "freeShippingThreshold", label: t("freeShippingAbove"), type: "number" },
      ],
    },
  ];

  return (
    <DashboardLayout title={t("businessSettings")}>
      <div className="space-y-6">
        {success && (
          <div className="rounded-lg border border-[#10b981]/20 bg-[#10b981]/10 p-3 text-sm text-[#10b981]">
            {success}
          </div>
        )}

        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.key} className="glass-card p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4a843]/20 to-[#d4a843]/5">
                  <Icon size={20} className="text-[#d4a843]" />
                </div>
                <h3 className="text-lg font-semibold text-[#f0f0f5]">{section.title}</h3>
              </div>

              <div className="space-y-4">
                {section.fields?.map((field) => (
                  <div key={field.key}>
                    <label className="mb-1 block text-sm text-[#9090a0]">{field.label}</label>
                    {field.type === "select" ? (
                      <select
                        value={settings[section.key]?.[field.key] || ""}
                        onChange={(e) =>
                          updateSetting(section.key, field.key, e.target.value)
                        }
                        className="input select"
                      >
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        value={settings[section.key]?.[field.key] || ""}
                        onChange={(e) =>
                          updateSetting(section.key, field.key, e.target.value)
                        }
                        className="input"
                      />
                    )}
                  </div>
                ))}

                {section.toggles?.map((toggle) => (
                  <div key={toggle.key} className="flex items-center justify-between rounded-xl border border-[#2a2a3a] bg-[#1c1c28] p-4">
                    <span className="text-sm font-medium text-[#f0f0f5]">{toggle.label}</span>
                    <button
                      onClick={() =>
                        updateSetting(
                          section.key,
                          toggle.key,
                          settings[section.key]?.[toggle.key] === "true"
                            ? "false"
                            : "true"
                        )
                      }
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        settings[section.key]?.[toggle.key] === "true"
                          ? "bg-[#d4a843]"
                          : "bg-[#2a2a3a]"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                          settings[section.key]?.[toggle.key] === "true"
                            ? "translate-x-5"
                            : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                ))}

                {section.key === "business" && (
                  <div>
                    <label className="mb-1 block text-sm text-[#9090a0]">{t("logoLabel")}</label>
                    <div className="flex items-center gap-3">
                      <button className="btn btn-secondary btn-sm">
                        <Upload size={14} />
                        {t("uploadLogo")}
                      </button>
                      <span className="text-xs text-[#606070]">{t("pngJpgUpTo2MB")}</span>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => saveGroup(section.key)}
                    disabled={saving === section.key}
                    className="btn btn-primary"
                  >
                    <Save size={14} />
                    {saving === section.key ? t("savingLabel") : t("saveChanges")}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
