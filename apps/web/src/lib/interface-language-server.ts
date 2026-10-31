import "server-only";
import { cookies, headers } from "next/headers";
import {
  LANGUAGE_COOKIE,
  languagePreference,
  resolveLanguage,
} from "./interface-language";

export async function getInterfaceLanguage() {
  const [cookieStore, requestHeaders] = await Promise.all([
    cookies(),
    headers(),
  ]);
  const preference = languagePreference(
    cookieStore.get(LANGUAGE_COOKIE)?.value,
  );
  return {
    preference,
    locale: resolveLanguage(preference, requestHeaders.get("accept-language")),
  };
}
