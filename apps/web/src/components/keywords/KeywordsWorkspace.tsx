"use client";

import { Suspense } from "react";
import { Info, Plus, Upload } from "lucide-react";
import { useQueryState } from "nuqs";
import type { Store } from "@asobeast/shared";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { countryParser } from "@/lib/search-params";
import { AddKeywordsDialog } from "./AddKeywordsDialog";
import { ImportKeywordsDialog } from "./ImportKeywordsDialog";
import { KeywordsToolbar } from "./KeywordsToolbar";
import { MarketSearchReadsCard } from "./MarketSearchReadsCard";
import { KeywordsTable } from "./KeywordsTable";
import { KeywordsTableSkeleton } from "./skeletons";
import { KeywordCombinations } from "./KeywordCombinations";
import { SuggestionsPanel } from "./SuggestionsPanel";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";

export function KeywordsWorkspace({
  id,
  homeCountry,
  store,
  keywordFields,
}: {
  id: string;
  homeCountry: string;
  store: Store;
  keywordFields: boolean;
}) {
  const chinese = useInterfaceLanguage() === "zh-CN";
  const [country] = useQueryState("country", countryParser);
  const market = country || homeCountry;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-balance">
            {chinese ? "跟踪的关键词" : "Tracked keywords"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {chinese
              ? "按市场跟踪你希望此 App 获得排名的关键词。"
              : "The phrases you want this app to rank for, tracked per market."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ImportKeywordsDialog appId={id} store={store} country={market}>
            <Button variant="outline">
              <Upload />
              {chinese ? "导入 CSV" : "Import CSV"}
            </Button>
          </ImportKeywordsDialog>
          <AddKeywordsDialog appId={id} store={store} country={market}>
            <Button>
              <Plus />
              {chinese ? "添加关键词" : "Add keywords"}
            </Button>
          </AddKeywordsDialog>
        </div>
      </div>
      <Suspense fallback={null}>
        <KeywordsToolbar
          id={id}
          store={store}
          market={market}
          homeCountry={homeCountry}
        />
      </Suspense>
      <Alert role="note">
        <Info />
        <AlertDescription>
          {chinese
            ? "Apple App Store 和 Google Play 的热度及搜索量评分使用不同的公开信号，不能直接比较。"
            : "Apple App Store and Google Play popularity and volume scores use different public signals and are not directly comparable."}
        </AlertDescription>
      </Alert>
      <Suspense fallback={<KeywordsTableSkeleton />}>
        <KeywordsTable
          id={id}
          store={store}
          country={market}
          homeCountry={homeCountry}
        />
      </Suspense>
      <SuggestionsPanel id={id} country={market} store={store} />
      <KeywordCombinations
        id={id}
        store={store}
        homeCountry={homeCountry}
        market={market}
      />
      {keywordFields ? (
        <MarketSearchReadsCard
          id={id}
          homeCountry={homeCountry}
          market={market}
        />
      ) : null}
    </div>
  );
}
