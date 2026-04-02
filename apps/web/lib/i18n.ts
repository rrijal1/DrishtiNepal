import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, Locale, LOCALE_COOKIE_NAME } from "./i18n-client";

export { translations } from "./i18n-client";

/**
 * Detect locale from Accept-Language header.
 * Returns "np" if the browser prefers Nepali (ne/ne-NP), otherwise falls back to default.
 */
function detectLocaleFromHeader(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  // Match "ne" or "ne-NP" anywhere in the Accept-Language header
  if (/\bne\b/i.test(acceptLanguage)) return "np";
  return DEFAULT_LOCALE;
}

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value as Locale;
  if (cookieLocale) return cookieLocale;

  // No cookie set yet — detect from browser language
  const headerStore = await headers();
  const acceptLanguage = headerStore.get("accept-language");
  return detectLocaleFromHeader(acceptLanguage);
}
