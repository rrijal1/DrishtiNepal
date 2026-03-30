import { cookies } from "next/headers";
import { DEFAULT_LOCALE, Locale, LOCALE_COOKIE_NAME } from "./i18n-client";

export { translations } from "./i18n-client";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const locale = cookieStore.get(LOCALE_COOKIE_NAME)?.value as Locale;
  return locale || DEFAULT_LOCALE;
}
