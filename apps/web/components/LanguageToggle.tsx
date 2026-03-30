"use client";

import { useRouter } from "next/navigation";
import { Locale, LOCALE_COOKIE_NAME } from "@/lib/i18n-client";

export function LanguageToggle({ currentLocale }: { currentLocale: Locale }) {
  const router = useRouter();

  const toggleLanguage = () => {
    const newLocale: Locale = currentLocale === "en" ? "np" : "en";
    
    // Set cookie
    document.cookie = `${LOCALE_COOKIE_NAME}=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    
    // Refresh the page to apply changes
    router.refresh();
  };

  return (
    <button
      onClick={toggleLanguage}
      className="rounded-md border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-600 transition hover:bg-neutral-100"
    >
      {currentLocale === "en" ? "नेपाली" : "English"}
    </button>
  );
}
