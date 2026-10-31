export const LANGUAGE_COOKIE = "asobeast_language";

export type InterfaceLanguage = "en" | "zh-CN";
export type LanguagePreference = InterfaceLanguage | "system";

export function languagePreference(value?: string): LanguagePreference {
  return value === "en" || value === "zh-CN" ? value : "system";
}

export function resolveLanguage(
  preference: LanguagePreference,
  acceptLanguage: string | null,
): InterfaceLanguage {
  if (preference !== "system") return preference;
  const languages = (acceptLanguage ?? "")
    .split(",")
    .map((part, index) => {
      const [tag, ...parameters] = part.trim().toLowerCase().split(";");
      const quality = parameters.find((item) => item.trim().startsWith("q="));
      const weight = quality ? Number(quality.trim().slice(2)) : 1;
      return { tag, weight: Number.isFinite(weight) ? weight : 0, index };
    })
    .filter(({ weight }) => weight > 0 && weight <= 1)
    .sort((a, b) => b.weight - a.weight || a.index - b.index);
  for (const { tag } of languages) {
    if (tag === "en" || tag.startsWith("en-")) return "en";
    if (
      tag === "zh" ||
      ["zh-cn", "zh-sg", "zh-hans"].some(
        (item) => tag === item || tag.startsWith(`${item}-`),
      )
    )
      return "zh-CN";
  }
  return "en";
}
