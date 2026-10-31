"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import {
  STORE_FIELD_LIMITS,
  type AppLocalizationsResult,
} from "@asobeast/shared";
import { ErrorState } from "@/components/layout/ErrorState";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LOCALIZATIONS_SECTION_ID,
  localizationMatrix,
  suggestedHint,
} from "@/lib/app-localizations";
import {
  APPLE_LOCALIZATIONS_URL,
  LOCALIZED_FIELDS_NOTE,
} from "@/lib/localizations";
import {
  appLocalizationsOptions,
  marketSuggestionsOptions,
} from "@/lib/queries";
import { AddLocalizationDialog } from "./AddLocalizationDialog";
import { FindLocalizationsButton } from "./FindLocalizationsButton";
import { LocalizationList } from "./LocalizationList";
import { LocalizationMatrix } from "./LocalizationMatrix";
import { UnlistedLocalizations } from "./UnlistedLocalizations";

const HEADING_ID = "app-localizations-heading";

function useScrollIntoViewOnHash(ready: boolean) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (ready && window.location.hash === `#${LOCALIZATIONS_SECTION_ID}`) {
      ref.current?.scrollIntoView({ block: "start" });
    }
  }, [ready]);
  return ref;
}

function LocalizationsPanel({
  id,
  result,
  canDraft,
}: {
  id: string;
  result: AppLocalizationsResult;
  canDraft: boolean;
}) {
  const zh = useInterfaceLanguage() === "zh-CN";
  const suggestions = useQuery({
    ...marketSuggestionsOptions(id),
    retry: false,
  });
  const grid = localizationMatrix(result, suggestions.data ?? null);

  return (
    <Card className="min-w-0">
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-body text-muted-foreground">
            {zh
              ? "关键词字段属于某一个本地化语言。支持该语言的商店市场搜索会读取此字段；关键词只能在同一个本地化版本内组合。"
              : "A keyword field belongs to a language. Search in every storefront on its list reads it, and words combine only within one localization."}{" "}
            <a
              href={APPLE_LOCALIZATIONS_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-medium text-foreground underline underline-offset-4"
            >
              {zh ? "Apple 本地化支持表" : "Apple’s localization table"}
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
          </p>
          <p className="text-body text-foreground">
            {zh
              ? `每个本地化版本分别拥有最多 ${STORE_FIELD_LIMITS.APP_STORE.title?.limit} 个字符的标题、${STORE_FIELD_LIMITS.APP_STORE.subtitle?.limit} 个字符的副标题，以及 ${STORE_FIELD_LIMITS.APP_STORE.keywordField?.limit} 个字符的关键词字段。`
              : LOCALIZED_FIELDS_NOTE}
          </p>
        </div>
        {grid ? (
          <LocalizationMatrix
            grid={grid}
            hint={suggestedHint(id, grid.suggested)}
          />
        ) : null}
        <LocalizationList id={id} result={result} canDraft={canDraft} />
        <UnlistedLocalizations id={id} result={result} />
      </CardContent>
    </Card>
  );
}

export function AppLocalizationsSection({
  id,
  canDraft,
}: {
  id: string;
  canDraft: boolean;
}) {
  const zh = useInterfaceLanguage() === "zh-CN";
  const { data, error, isError, refetch } = useQuery({
    ...appLocalizationsOptions(id),
    retry: false,
  });
  const sectionRef = useScrollIntoViewOnHash(data !== undefined);

  return (
    <section
      ref={sectionRef}
      id={LOCALIZATIONS_SECTION_ID}
      aria-labelledby={HEADING_ID}
      className="flex scroll-mt-20 flex-col gap-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={HEADING_ID} className="text-lg font-medium">
          {zh ? "App Store 本地化版本" : "App Store localizations"}
        </h2>
        {data ? (
          <div className="flex flex-wrap items-center gap-2">
            <FindLocalizationsButton appId={id} />
            <AddLocalizationDialog id={id} result={data} />
          </div>
        ) : null}
      </div>
      {data ? (
        <LocalizationsPanel id={id} result={data} canDraft={canDraft} />
      ) : isError ? (
        <ErrorState
          error={error}
          retry={() => void refetch()}
          title={
            zh ? "无法加载本地化版本。" : "Localizations could not be loaded."
          }
        />
      ) : (
        <Skeleton className="h-64 w-full rounded-xl" />
      )}
    </section>
  );
}
