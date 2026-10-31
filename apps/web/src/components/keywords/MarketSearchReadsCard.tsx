"use client";

import { Suspense, useId, type ReactNode } from "react";
import Link from "next/link";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  KEYWORD_FIELD_CHAR_LIMIT,
  type MarketLocalizationRead,
} from "@asobeast/shared";
import { ReadRoleBadge } from "@/components/localizations/ReadRoleBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InfoTip } from "@/components/ui/info-tip";
import { Meter } from "@/components/ui/meter";
import {
  editLocalizationHref,
  hasMarketReads,
  localizationsSectionHref,
  uniqueWordCount,
  unshippedReads,
} from "@/lib/app-localizations";
import { formatNumber, pluralize } from "@/lib/format";
import { localizationName } from "@/lib/localizations";
import { marketKeywordFieldsOptions } from "@/lib/queries";
import { MarketWastedWords } from "./MarketWastedWords";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { MarketSearchReadsSkeleton } from "./skeletons";

function ReadsCard({
  market,
  aside,
  children,
}: {
  market: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  const titleId = useId();
  const zh = useInterfaceLanguage() === "zh-CN";
  return (
    <Card role="region" aria-labelledby={titleId} className="min-w-0">
      <CardHeader>
        <CardTitle id={titleId}>
          {zh
            ? `${market.toUpperCase()} 市场搜索读取的关键词字段`
            : `What ${market.toUpperCase()} search reads`}
        </CardTitle>
        {aside ? <CardAction>{aside}</CardAction> : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">{children}</CardContent>
    </Card>
  );
}

function ReadRow({ id, read }: { id: string; read: MarketLocalizationRead }) {
  const name = localizationName(read.localization);
  const zh = useInterfaceLanguage() === "zh-CN";
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="flex min-w-44 items-center gap-2">
        <span className="font-medium">{name}</span>
        <ReadRoleBadge role={read.role} />
      </span>
      <span className="flex min-w-32 flex-1 items-center gap-2">
        <Meter
          value={Math.min(read.charactersUsed, read.charactersLimit)}
          max={read.charactersLimit}
          tone="health"
        />
        <span className="numeric shrink-0 font-mono text-caption text-muted-foreground">
          {read.phrases.length === 0
            ? zh
              ? "空"
              : "Empty"
            : `${read.charactersUsed}/${read.charactersLimit}`}
        </span>
      </span>
      <Button asChild variant="link" size="sm" className="h-auto p-0">
        <Link
          href={editLocalizationHref(id, read.localization)}
          aria-label={
            zh ? `编辑${name}关键词字段` : `Edit the ${name} keyword field`
          }
        >
          {zh ? "编辑" : "Edit"}
        </Link>
      </Button>
    </li>
  );
}

function UnshippedReads({
  id,
  market,
  reads,
  open,
}: {
  id: string;
  market: string;
  reads: readonly MarketLocalizationRead[];
  open: boolean;
}) {
  const zh = useInterfaceLanguage() === "zh-CN";
  if (reads.length === 0) return null;
  return (
    <details open={open} className="rounded-lg border border-border px-3 py-2">
      <summary className="cursor-pointer text-body">
        {zh
          ? `${market.toUpperCase()} 市场还会读取 ${reads.length} 个未提供的本地化版本，最多可增加 ${formatNumber(reads.length * KEYWORD_FIELD_CHAR_LIMIT)} 个字符`
          : `${market.toUpperCase()} also reads ${pluralize(reads.length, "localization")} you don’t ship · up to ${formatNumber(reads.length * KEYWORD_FIELD_CHAR_LIMIT)} more characters`}
      </summary>
      <ul className="mt-3 flex flex-wrap gap-2">
        {reads.map((read) => (
          <li key={read.localization}>
            <Badge variant="secondary">
              {localizationName(read.localization)}
            </Badge>
          </li>
        ))}
      </ul>
      <Button asChild variant="link" size="sm" className="mt-2 h-auto p-0">
        <Link href={localizationsSectionHref(id)}>
          {zh ? "前往元数据页面添加" : "Add one on the metadata page"}
        </Link>
      </Button>
    </details>
  );
}

function MarketReads({ id, market }: { id: string; market: string }) {
  const zh = useInterfaceLanguage() === "zh-CN";
  const { data } = useSuspenseQuery(marketKeywordFieldsOptions(id, market));
  const shipped = data.localizations.filter((read) => read.shipped);

  return (
    <ReadsCard
      market={market}
      aside={
        <span className="flex items-center gap-2 text-caption text-muted-foreground">
          {zh
            ? `${formatNumber(uniqueWordCount(data.localizations))} 个不同的词 · ${shipped.length} 个本地化版本`
            : `${pluralize(uniqueWordCount(data.localizations), "unique word")} · ${pluralize(shipped.length, "localization")}`}
          <InfoTip
            label={zh ? "了解市场关键词字段" : "About market keyword fields"}
            title={zh ? "市场会读取哪些字段" : "What a market reads"}
            summary={
              zh
                ? "商店市场搜索会读取其支持的所有本地化版本的关键词字段，但关键词组合仅在同一个本地化版本内进行。"
                : "Search in a storefront reads the keyword field of every localization on its list. Words combine only within one localization."
            }
          />
        </span>
      }
    >
      {shipped.length === 0 ? (
        <p className="text-body text-muted-foreground">
          {zh
            ? `${market.toUpperCase()} 市场不会读取此 App 当前提供的任何本地化版本。`
            : `${market.toUpperCase()} reads none of the localizations this app ships.`}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {shipped.map((read) => (
            <ReadRow key={read.localization} id={id} read={read} />
          ))}
        </ul>
      )}
      <MarketWastedWords
        country={data.country}
        wastedWords={data.wastedWords}
        splitPhrases={data.splitPhrases}
      />
      <UnshippedReads
        id={id}
        market={market}
        reads={unshippedReads(data.localizations)}
        open={shipped.length === 0}
      />
    </ReadsCard>
  );
}

export function MarketSearchReadsCard({
  id,
  homeCountry,
  market,
}: {
  id: string;
  homeCountry: string;
  market: string;
}) {
  const zh = useInterfaceLanguage() === "zh-CN";
  if (!hasMarketReads(homeCountry, market)) {
    return (
      <ReadsCard market={market}>
        <p className="text-body text-muted-foreground">
          {zh
            ? `${market.toUpperCase()} 不是 App Store 商店市场，因此不存在关键词字段。`
            : `${market.toUpperCase()} is not an App Store storefront, so it has no keyword field.`}
        </p>
      </ReadsCard>
    );
  }
  return (
    <Suspense fallback={<MarketSearchReadsSkeleton />}>
      <MarketReads id={id} market={market} />
    </Suspense>
  );
}
