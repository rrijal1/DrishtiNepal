"use client";

import { Locale, LOCALE_COOKIE_NAME } from "@/lib/i18n-client";
import { useRouter } from "next/navigation";

export function LanguageToggle({ currentLocale }: { currentLocale: Locale }) {
  const router = useRouter();

  const setLocale = (locale: Locale) => {
    if (locale === currentLocale) return;
    document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
    router.refresh();
  };

  return (
    <div
      className="relative flex items-center rounded-full p-0.5"
      style={{
        background: "rgba(30, 58, 95, 0.08)",
        border: "1px solid rgba(30, 58, 95, 0.15)",
      }}
      role="group"
      aria-label="Language selector"
    >
      {/* Sliding pill indicator */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "2px",
          bottom: "2px",
          width: "calc(50% - 2px)",
          borderRadius: "9999px",
          background: "#1e3a5f",
          boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
          transition: "transform 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
          transform:
            currentLocale === "en"
              ? "translateX(0)"
              : "translateX(calc(100% + 4px))",
          left: "2px",
          pointerEvents: "none",
        }}
      />

      <button
        onClick={() => setLocale("en")}
        aria-pressed={currentLocale === "en"}
        style={{
          position: "relative",
          zIndex: 1,
          padding: "4px 12px",
          borderRadius: "9999px",
          fontSize: "12px",
          fontWeight: 600,
          letterSpacing: "0.04em",
          border: "none",
          background: "transparent",
          cursor: currentLocale === "en" ? "default" : "pointer",
          color: currentLocale === "en" ? "#fff" : "#1e3a5f",
          transition: "color 0.22s",
          lineHeight: "1.4",
          userSelect: "none",
        }}
      >
        EN
      </button>

      <button
        onClick={() => setLocale("np")}
        aria-pressed={currentLocale === "np"}
        style={{
          position: "relative",
          zIndex: 1,
          padding: "4px 12px",
          borderRadius: "9999px",
          fontSize: "12px",
          fontWeight: 600,
          letterSpacing: "0.04em",
          border: "none",
          background: "transparent",
          cursor: currentLocale === "np" ? "default" : "pointer",
          color: currentLocale === "np" ? "#fff" : "#1e3a5f",
          transition: "color 0.22s",
          lineHeight: "1.4",
          fontFamily: "'Noto Sans Devanagari', sans-serif",
          userSelect: "none",
        }}
      >
        नेपाली
      </button>
    </div>
  );
}
