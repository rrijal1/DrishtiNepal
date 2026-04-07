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
      className="flex items-center gap-0.5 rounded-lg border border-neutral-200 bg-white p-0.5"
      role="group"
      aria-label="Language selector"
    >
      <button
        onClick={() => setLocale("en")}
        aria-pressed={currentLocale === "en"}
        className={`rounded-md px-3 py-1 text-xs font-semibold tracking-wide transition ${
          currentLocale === "en"
            ? "bg-blue-800 text-white"
            : "text-neutral-500 hover:text-neutral-800"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLocale("np")}
        aria-pressed={currentLocale === "np"}
        className={`rounded-md px-3 py-1 text-xs font-semibold tracking-wide transition ${
          currentLocale === "np"
            ? "bg-blue-800 text-white"
            : "text-neutral-500 hover:text-neutral-800"
        }`}
        style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
      >
        नेपाली
      </button>
    </div>
  );
}
