"use client";

import type { ReactNode } from "react";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { Copy, Unlink } from "lucide-react";
import type { SplitPhrase, WastedWord } from "@asobeast/shared";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatCountry, formatList, formatNumber } from "@/lib/format";
import { localizationName } from "@/lib/localizations";
import {
  limitedLines,
  moreLine,
  splitPhraseLine,
  wastedWordLine,
} from "@/lib/wasted-words";

function WasteNote({
  icon,
  title,
  intro,
  lines,
}: {
  icon: ReactNode;
  title: string;
  intro: string;
  lines: readonly string[];
}) {
  const zh = useInterfaceLanguage() === "zh-CN";
  const { shown, hidden } = limitedLines(lines);
  return (
    <Alert role="note" variant="warning">
      {icon}
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <p>{intro}</p>
        <ul className="flex flex-col gap-1">
          {shown.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        {hidden > 0 ? (
          <p>{zh ? `另有 ${formatNumber(hidden)} 项` : moreLine(hidden)}</p>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}

export function MarketWastedWords({
  country,
  wastedWords,
  splitPhrases,
}: {
  country: string;
  wastedWords: readonly WastedWord[];
  splitPhrases: readonly SplitPhrase[];
}) {
  const zh = useInterfaceLanguage() === "zh-CN";
  const namesOf = (localizations: readonly string[]) =>
    formatList(localizations.map(localizationName));
  if (wastedWords.length === 0 && splitPhrases.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      {wastedWords.length > 0 ? (
        <WasteNote
          icon={<Copy aria-hidden />}
          title={zh ? "重复读取的关键词" : "Words read twice"}
          intro={
            zh
              ? `${formatCountry(country)} 市场会同时读取这些本地化版本，重复的词会占用字符数，却不会增加新的关键词。`
              : `${formatCountry(country)} search reads these localizations together, so each repeat spends characters without adding a word.`
          }
          lines={
            zh
              ? wastedWords.map(
                  ({ word, localizations }) =>
                    `“${word}”同时存在于${namesOf(localizations)}。`,
                )
              : wastedWords.map(wastedWordLine)
          }
        />
      ) : null}
      {splitPhrases.length > 0 ? (
        <WasteNote
          icon={<Unlink aria-hidden />}
          title={
            zh ? "跨本地化版本拆分的词组" : "Phrases split across localizations"
          }
          intro={
            zh
              ? "关键词只能在同一个本地化版本内组合，因此这些词组无法按输入的完整形式参与搜索匹配。"
              : "Words combine only within one localization, so search cannot match these phrases as typed."
          }
          lines={
            zh
              ? splitPhrases.map(
                  ({ phrase, parts }) =>
                    `“${phrase}”：${parts.map(({ word, localizations }) => `“${word}”位于${namesOf(localizations)}`).join("，")}。`,
                )
              : splitPhrases.map(splitPhraseLine)
          }
        />
      ) : null}
    </div>
  );
}
