"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { Plus, X } from "lucide-react";
import { useQueryState } from "nuqs";
import type { Store } from "@asobeast/shared";
import { Button } from "@/components/ui/button";
import { localizedCountry } from "@/lib/format";
import { keywordCountriesOptions, keywordsOptions } from "@/lib/queries";
import { countryParser } from "@/lib/search-params";
import { cn } from "@/lib/utils";
import { AddKeywordsDialog } from "./AddKeywordsDialog";

export function KeywordsToolbar({
  id,
  store,
  market,
  homeCountry,
}: {
  id: string;
  store: Store;
  market: string;
  homeCountry: string;
}) {
  const language = useInterfaceLanguage();
  const [, setCountry] = useQueryState("country", countryParser);
  const { data: markets } = useSuspenseQuery(keywordCountriesOptions(id));
  const { data: keywords } = useSuspenseQuery(keywordsOptions(id, market));

  const total = markets.reduce((sum, entry) => sum + entry.keywordCount, 0);
  const active = keywords.filter((keyword) => keyword.active).length;
  const partial = keywords.length !== total;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div
        role="group"
        aria-label={language === "zh-CN" ? "关键词市场" : "Keyword markets"}
        className="flex flex-wrap items-center gap-2"
      >
        {markets.map((entry) => {
          const selected = entry.country === market;
          return (
            <button
              key={entry.country}
              type="button"
              aria-pressed={selected}
              title={localizedCountry(entry.country, language)}
              onClick={() => void setCountry(entry.country)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-body transition-colors",
                selected
                  ? "border-foreground bg-foreground text-background"
                  : "hover:bg-muted",
              )}
            >
              <span className="font-medium">{entry.country.toUpperCase()}</span>
              <span className="numeric font-mono text-caption opacity-70">
                {entry.keywordCount}
              </span>
            </button>
          );
        })}
        <AddKeywordsDialog appId={id} store={store} country={market}>
          <Button
            variant="outline"
            size="sm"
            aria-label={language === "zh-CN" ? "添加市场" : "Add a market"}
          >
            <Plus />
          </Button>
        </AddKeywordsDialog>
      </div>

      {market !== homeCountry ? (
        <button
          type="button"
          onClick={() => void setCountry(null)}
          className="inline-flex items-center gap-1.5 rounded-full border border-dashed px-2.5 py-1 text-caption hover:bg-muted"
        >
          {language === "zh-CN" ? "市场" : "Market"}: {market.toUpperCase()}
          <X className="size-3 opacity-60" aria-hidden />
          <span className="sr-only">
            {language === "zh-CN" ? "清除市场筛选" : "Clear the market filter"}
          </span>
        </button>
      ) : null}

      <p className="text-body text-muted-foreground" aria-live="polite">
        {language === "zh-CN" ? "正在追踪 " : "Tracking "}
        <span className="numeric font-mono font-medium text-foreground">
          {keywords.length}
        </span>
        {partial ? (
          <>
            {language === "zh-CN" ? " / " : " of "}
            <span className="numeric font-mono font-medium text-foreground">
              {total}
            </span>
          </>
        ) : null}{" "}
        {language === "zh-CN"
          ? "个关键词"
          : `keyword${keywords.length === 1 ? "" : "s"}`}{" "}
        ·{" "}
        <span className="numeric font-mono font-medium text-foreground">
          {active}
        </span>{" "}
        {language === "zh-CN" ? "个启用中" : "active"}
      </p>
    </div>
  );
}
