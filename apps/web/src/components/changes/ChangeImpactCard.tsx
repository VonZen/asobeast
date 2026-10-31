"use client";

import { Suspense, useId } from "react";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { interfaceCopy } from "@/lib/interface-copy";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useQueryState } from "nuqs";
import type {
  ChangeImpactItem,
  ChangeImpactWindow,
  KeywordCountrySummary,
  Store,
} from "@asobeast/shared";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCountry, formatDate } from "@/lib/format";
import { changeImpactOptions, keywordCountriesOptions } from "@/lib/queries";
import { changeDaysParser, countryParser } from "@/lib/search-params";
import { ChangeImpactWindowTile, FunnelFacts } from "./ChangeImpactWindowTile";
import { CHANGE_FIELD_LABELS } from "@asobeast/shared";
import { impactScopeLine, windowTitle } from "./change-impact-copy";
import { ChangeImpactSkeleton } from "./skeletons";
import { VisibilityHelp } from "@/components/visibility/VisibilityHelp";

interface ImpactScope {
  id: string;
  store: Store;
  days: number;
  market: string;
}

function ChangeImpactRow({
  item,
  store,
}: {
  item: ChangeImpactItem;
  store: Store;
}) {
  const language = useInterfaceLanguage();
  return (
    <li className="flex flex-col gap-3 border-t pt-4 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-body font-medium">
          {formatDate(item.changedOn, language)}
        </h3>
        {item.fields.map((field) => (
          <Badge key={field} variant="outline">
            {interfaceCopy(language, CHANGE_FIELD_LABELS[field])}
          </Badge>
        ))}
      </div>
      {item.baselineDate === null ? (
        <>
          <p className="text-body text-muted-foreground">
            {language === "zh-CN"
              ? "此变更前没有排名检查，因此无法衡量它对排名的影响。"
              : "No rank check just before this change, so its effect on rankings cannot be measured."}
          </p>
          <FunnelOnlyTiles windows={item.windows} store={store} />
        </>
      ) : (
        <>
          <p className="text-caption text-muted-foreground">
            {language === "zh-CN"
              ? `与 ${formatDate(item.baselineDate, language)} 的排名检查对比`
              : `Compared with the rank check on ${formatDate(item.baselineDate)}`}
          </p>
          <ul className="grid gap-3 sm:grid-cols-3">
            {item.windows.map((impact) => (
              <ChangeImpactWindowTile
                key={impact.days}
                impact={impact}
                store={store}
              />
            ))}
          </ul>
        </>
      )}
    </li>
  );
}

function FunnelOnlyTiles({
  windows,
  store,
}: {
  windows: ChangeImpactWindow[];
  store: Store;
}) {
  const language = useInterfaceLanguage();
  const funnels = windows.filter((impact) => impact.funnel);
  if (funnels.length === 0) return null;
  return (
    <ul className="grid gap-3 sm:grid-cols-3">
      {funnels.map((impact) => (
        <li
          key={impact.days}
          className="flex flex-col gap-2 rounded-lg border p-3"
        >
          <h4 className="text-body font-medium">
            {windowTitle(impact.days, language)}
          </h4>
          <FunnelFacts impact={impact} store={store} />
        </li>
      ))}
    </ul>
  );
}

function ChangeImpactList({ id, store, days, market }: ImpactScope) {
  const language = useInterfaceLanguage();
  const { data } = useSuspenseQuery(changeImpactOptions(id, days, market));

  if (data.items.length === 0) {
    return (
      <EmptyState
        title={
          language === "zh-CN"
            ? `最近 ${days} 天你的商品页没有变化`
            : `No changes to your listing in the last ${days} days`
        }
        body={
          language === "zh-CN"
            ? "刷新发现你的商品页变更后，会显示在这里。可扩大时间范围查看更早的记录。"
            : "A change appears here once a refresh detects an edit to your own listing. Widen the window to look further back."
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-body text-muted-foreground">
        {language === "zh-CN"
          ? data.items.length === data.totalChanges
            ? `最近 ${days} 天你的商品页有 ${data.items.length} 次变更`
            : `最近 ${days} 天你的商品页有 ${data.totalChanges} 次变更，显示最新的 ${data.items.length} 次`
          : impactScopeLine({
              days,
              totalChanges: data.totalChanges,
              shown: data.items.length,
            })}
      </p>
      <ul className="flex flex-col gap-4">
        {data.items.map((item) => (
          <ChangeImpactRow key={item.changedOn} item={item} store={store} />
        ))}
      </ul>
    </div>
  );
}

function ImpactMarketSelect({
  markets,
  market,
  onChange,
}: {
  markets: KeywordCountrySummary[];
  market: string;
  onChange: (country: string) => void;
}) {
  const language = useInterfaceLanguage();
  const selectId = useId();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Label htmlFor={selectId}>
        {language === "zh-CN" ? "市场" : "Market"}
      </Label>
      <Select value={market} onValueChange={onChange}>
        <SelectTrigger id={selectId} className="w-[220px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {markets.map((entry) => (
            <SelectItem key={entry.country} value={entry.country}>
              {entry.country.toUpperCase()} · {formatCountry(entry.country)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ChangeImpactBody({
  id,
  store,
  days,
  market,
  onMarketChange,
}: ImpactScope & { onMarketChange: (country: string) => void }) {
  const language = useInterfaceLanguage();
  const { data: markets } = useSuspenseQuery(keywordCountriesOptions(id));
  const tracked =
    markets.find((entry) => entry.country === market)?.keywordCount ?? 0;

  return (
    <div className="flex flex-col gap-4">
      {markets.length > 1 ? (
        <ImpactMarketSelect
          markets={markets}
          market={market}
          onChange={onMarketChange}
        />
      ) : null}
      {tracked === 0 ? (
        <EmptyState
          title={
            language === "zh-CN"
              ? `尚未在 ${formatCountry(market)} 追踪关键词`
              : `No keywords tracked in ${formatCountry(market)} yet`
          }
          body={
            language === "zh-CN"
              ? "在此市场追踪关键词后，可查看商品页变更对它们的影响。"
              : "Track keywords in this market to see how changes to your listing move them."
          }
        />
      ) : (
        <Suspense fallback={<ChangeImpactSkeleton />}>
          <ChangeImpactList id={id} store={store} days={days} market={market} />
        </Suspense>
      )}
    </div>
  );
}

export function ChangeImpactCard({
  id,
  store,
  homeCountry,
}: {
  id: string;
  store: Store;
  homeCountry: string;
}) {
  const language = useInterfaceLanguage();
  const titleId = useId();
  const [days] = useQueryState("days", changeDaysParser);
  const [country, setCountry] = useQueryState("country", countryParser);
  const market = country || homeCountry;

  return (
    <Card role="region" aria-labelledby={titleId}>
      <CardHeader>
        <CardDescription>
          {language === "zh-CN" ? "变更影响" : "Change impact"}
        </CardDescription>
        <CardTitle asChild>
          <h2 id={titleId}>
            {language === "zh-CN"
              ? "每次变更后的排名变化"
              : "How rankings moved after each change"}
          </h2>
        </CardTitle>
        <CardAction>
          <VisibilityHelp note="Here visibility covers only this market's keywords checked on both days, each weighted by its popularity on the last check before the change, so only positions move it." />
        </CardAction>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<ChangeImpactSkeleton />}>
          <ChangeImpactBody
            id={id}
            store={store}
            days={days}
            market={market}
            onMarketChange={(next) =>
              void setCountry(next === homeCountry ? null : next)
            }
          />
        </Suspense>
      </CardContent>
    </Card>
  );
}
