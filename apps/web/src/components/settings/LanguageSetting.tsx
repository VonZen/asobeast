"use client";

import { LocalizedText } from "@/components/layout/LocalizedText";

import {
  LANGUAGE_COOKIE,
  type LanguagePreference,
} from "@/lib/interface-language";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function LanguageSetting({
  preference,
}: {
  preference: LanguagePreference;
}) {
  const locale = useInterfaceLanguage();
  const chinese = locale === "zh-CN";
  const selectedLabel =
    preference === "system"
      ? chinese
        ? "跟随浏览器"
        : "Follow browser"
      : preference === "zh-CN"
        ? "简体中文"
        : "English";

  function changeLanguage(value: string) {
    if (value !== "en" && value !== "zh-CN" && value !== "system") return;
    document.cookie = `${LANGUAGE_COOKIE}=${value}; Path=/; Max-Age=31536000; SameSite=Lax`;
    window.location.reload();
  }

  return (
    <section
      className="flex scroll-mt-20 flex-col gap-3"
      aria-labelledby="language-heading"
    >
      <div className="flex flex-col gap-0.5">
        <h2 id="language-heading" className="text-title tracking-tight">
          {chinese ? "界面语言" : "Interface language"}
        </h2>
        <p className="text-body text-muted-foreground">
          {chinese
            ? "选择此浏览器中使用的界面语言。"
            : "Choose the interface language for this browser."}
        </p>
      </div>
      <Select value={preference} onValueChange={changeLanguage}>
        <SelectTrigger aria-label={chinese ? "界面语言" : "Interface language"}>
          <SelectValue>{selectedLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="system">
            {chinese ? "跟随浏览器" : "Follow browser"}
          </SelectItem>
          <SelectItem value="en">
            <LocalizedText en="English" />
          </SelectItem>
          <SelectItem value="zh-CN">简体中文</SelectItem>
        </SelectContent>
      </Select>
    </section>
  );
}
