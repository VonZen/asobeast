import { describe, expect, it } from "vitest";
import { languagePreference, resolveLanguage } from "./interface-language";
import { interfaceCopy } from "./interface-copy";
import { formatDate, formatDateTime, formatRelativeTime, localizedCountry } from "./format";

describe("interface language", () => {
  it("honors an explicit browser preference over the request language", () => {
    expect(resolveLanguage("en", "zh-CN,zh;q=0.9")).toBe("en");
    expect(resolveLanguage("zh-CN", "en-US,en;q=0.9")).toBe("zh-CN");
  });

  it("selects the highest priority supported browser language", () => {
    expect(resolveLanguage("system", "fr,zh-CN;q=0.9,en;q=0.5")).toBe("zh-CN");
    expect(resolveLanguage("system", "zh-CN;q=0.5,en-US;q=0.9")).toBe("en");
    expect(resolveLanguage("system", "zh-TW,en;q=0.5")).toBe("en");
    expect(resolveLanguage("system", "zh-CN;q=0,en;q=0.9")).toBe("en");
  });

  it("ignores invalid preferences and falls back for missing translations", () => {
    expect(languagePreference("unexpected")).toBe("system");
    expect(interfaceCopy("zh-CN", "ASO")).toBe("ASO");
    expect(interfaceCopy("en", "Settings")).toBe("Settings");
    expect(interfaceCopy("zh-CN", "Settings")).toBe("设置");
  });

  it("formats dates and relative times for Chinese without changing UTC", () => {
    const instant = "2026-10-30T13:05:00Z";
    expect(formatDate(instant, "zh-CN")).toBe("2026年10月30日");
    expect(formatDateTime(instant, "zh-CN")).toBe("2026年10月30日 13:05 UTC");
    expect(
      formatRelativeTime(instant, Date.parse("2026-10-31T13:05:00Z"), "zh-CN"),
    ).toBe("昨天");
    expect(formatDate(instant)).toBe("Oct 30, 2026");
  });

  it("localizes known countries while preserving unknown codes", () => {
    expect(localizedCountry("us", "zh-CN")).toBe("美国");
    expect(localizedCountry("us", "en")).toBe("United States");
    expect(localizedCountry("ZZ", "zh-CN")).toBe("ZZ");
  });
});
