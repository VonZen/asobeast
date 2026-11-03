"use client";

import { Suspense } from "react";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { useSuspenseQuery } from "@tanstack/react-query";
import { keywordFieldLocalizations } from "@asobeast/shared";
import { AppLocalizationsSection } from "@/components/localizations/AppLocalizationsSection";
import { useLocalization } from "@/components/app-detail/use-localization";
import { useMarket } from "@/components/app-detail/use-market";
import { KeywordFieldSuggestionCard } from "@/components/KeywordFieldSuggestionCard";
import { MetadataFieldCard } from "@/components/MetadataFieldCard";
import { editLocalizationHref } from "@/lib/app-localizations";
import { queryMarket } from "@/lib/market";
import { metadataAuditOptions } from "@/lib/queries";
import { CoverageTable } from "./CoverageTable";
import { MetadataAssistantPanel } from "./MetadataAssistantPanel";
import { ScreenshotCaptionsCard } from "./ScreenshotCaptionsCard";
import { ScreenshotCaptionsSkeleton } from "./skeletons";

export function MetadataAuditView({
  id,
  canDraft,
  hasLocalizations,
  keywordFields,
}: {
  id: string;
  canDraft: boolean;
  hasLocalizations: boolean;
  keywordFields: boolean;
}) {
  const language = useInterfaceLanguage();
  const { market, home } = useMarket(id);
  const localization = useLocalization(id).localization ?? undefined;
  const { data: result } = useSuspenseQuery(
    metadataAuditOptions(id, queryMarket(market, home), localization),
  );

  return (
    <>
      {result.store === "APP_STORE" ? (
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>
            {result.metadataSource === "app-store-connect"
              ? language === "zh-CN"
                ? "元数据来源：App Store Connect（当前可编辑版本优先）。"
                : "Metadata source: App Store Connect (editable version preferred)."
              : language === "zh-CN"
                ? "元数据来源：已保存的商店页面快照。"
                : "Metadata source: saved storefront snapshot."}
          </p>
          {result.metadataSourceWarning ? (
            <p role="status" className="text-warning">
              {language === "zh-CN"
                ? "App Store Connect 未能提供当前所选语言的元数据；已回退到商店快照。"
                : result.metadataSourceWarning}
            </p>
          ) : null}
        </div>
      ) : null}
      <section className="grid grid-cols-1 gap-4 @2xl/metadata:grid-cols-2">
        {result.fields.map((field) => (
          <MetadataFieldCard
            key={`${market}:${localization ?? ""}:${field.field}:${field.value ?? ""}`}
            field={field.field}
            value={field.value ?? ""}
            limit={field.limit}
            issues={field.issues}
          />
        ))}
      </section>

      {result.store === "APP_STORE" ? (
        <Suspense fallback={<ScreenshotCaptionsSkeleton />}>
          <ScreenshotCaptionsCard
            id={id}
            market={queryMarket(market, home)}
            localization={localization}
          />
        </Suspense>
      ) : null}

      {keywordFields ? (
        <AppLocalizationsSection
          id={id}
          canDraft={canDraft && market === home}
        />
      ) : null}

      {canDraft && market === home ? (
        <MetadataAssistantPanel
          appId={id}
          store={result.store}
          canLocalize={hasLocalizations}
        />
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">
          {language === "zh-CN" ? "关键词覆盖情况" : "Keyword coverage"}
        </h2>
        {result.coverage.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            {language === "zh-CN"
              ? "追踪关键词后，可以查看元数据对它们的覆盖情况。"
              : "Track keywords to see how your metadata covers them."}
          </div>
        ) : (
          <CoverageTable
            rows={result.coverage}
            screenshotText={result.screenshotText ?? null}
          />
        )}
      </section>

      {result.store === "APP_STORE" &&
      result.keywordFieldSuggestion !== null ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-medium">
            {language === "zh-CN" ? "建议" : "Suggestion"}
          </h2>
          <KeywordFieldSuggestionCard
            suggestion={result.keywordFieldSuggestion}
            editHref={editLocalizationHref(
              id,
              result.keywordFieldSuggestion.localization ??
                keywordFieldLocalizations(home)[0],
            )}
          />
        </section>
      ) : null}
    </>
  );
}
