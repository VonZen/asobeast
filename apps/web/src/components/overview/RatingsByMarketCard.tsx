"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import type { ListingMarket } from "@asobeast/shared";
import { useMarket } from "@/components/app-detail/use-market";
import { CollapsedSectionsProvider } from "@/components/layout/CollapsedSections";
import { CollapsibleCard } from "@/components/layout/CollapsibleCard";
import { KNOWN_SECTIONS } from "@/components/layout/known-sections";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { GradedNumber } from "@/components/ui/graded";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNumber, formatRating, pluralize } from "@/lib/format";
import { grade } from "@/lib/grade";
import { offersMarkets } from "@/lib/market";
import { marketRatingRows, ratingTotal } from "@/lib/ratings-by-market";
import { MarketRatingRow } from "./MarketRatingRow";
import { OVERVIEW_SECTION } from "./overview-sections";
import { RatingsByMarketHelp } from "./RatingsByMarketHelp";
import { RatingsByMarketSkeleton } from "./skeletons";

function RatingsTable({
  markets,
  selected,
}: {
  markets: readonly ListingMarket[];
  selected: string | undefined;
}) {
  const language = useInterfaceLanguage();
  const rows = marketRatingRows(markets);
  const total = ratingTotal(rows);
  return (
    <Table scrollLabel="Market ratings table" scrollFocus="overflow">
      <TableCaption>
        {language === "zh-CN"
          ? "各市场最新商品页的评分和评分数量"
          : "Rating and number of ratings on the newest listing captured in each market"}
      </TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">
            {language === "zh-CN" ? "市场" : "Market"}
          </TableHead>
          <TableHead scope="col" className="text-right">
            {language === "zh-CN" ? "平均评分" : "Average"}
          </TableHead>
          <TableHead scope="col" className="text-right">
            {language === "zh-CN" ? "评分数" : "Ratings"}
          </TableHead>
          <TableHead scope="col" className="text-right">
            {language === "zh-CN" ? "采集时间" : "Captured"}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <MarketRatingRow
            key={row.country}
            row={row}
            selected={row.country === selected}
          />
        ))}
      </TableBody>
      {total ? (
        <TableFooter>
          <TableRow>
            <TableCell>
              {language === "zh-CN" ? "所有列出的市场" : "All listed markets"}
            </TableCell>
            <TableCell className="text-right">
              <GradedNumber
                value={formatRating(total.average)}
                grade={grade("rating", total.average)}
                label="Rating across the listed markets"
              />
            </TableCell>
            <TableCell className="numeric text-right font-mono">
              {formatNumber(total.count)}
            </TableCell>
            <TableCell className="text-right text-muted-foreground">
              {language === "zh-CN"
                ? `${total.markets} 个市场`
                : pluralize(total.markets, "market")}
            </TableCell>
          </TableRow>
        </TableFooter>
      ) : null}
    </Table>
  );
}

function SingleMarket({ id, canTrack }: { id: string; canTrack: boolean }) {
  const language = useInterfaceLanguage();
  return (
    <EmptyState
      className="py-8"
      title={
        language === "zh-CN" ? "目前只有一个市场" : "Only one market so far"
      }
      body={
        language === "zh-CN"
          ? "App Store 为每个商店市场分别记录评分。在其他市场追踪关键词后，每日任务会采集该市场的商品页，并在此处显示评分。"
          : "The App Store keeps a rating for each storefront. Track a keyword in another market and the daily run captures the listing there, so its rating appears next to this one."
      }
      action={
        canTrack ? (
          <Button asChild variant="outline">
            <Link href={`/apps/${id}/keywords`}>
              {language === "zh-CN"
                ? "在其他市场追踪关键词"
                : "Track keywords in another market"}
            </Link>
          </Button>
        ) : undefined
      }
    />
  );
}

function RatingsByMarketBody({
  id,
  canTrack,
}: {
  id: string;
  canTrack: boolean;
}) {
  const { markets, scope } = useMarket(id);
  return offersMarkets(markets) ? (
    <RatingsTable markets={markets} selected={scope} />
  ) : (
    <SingleMarket id={id} canTrack={canTrack} />
  );
}

export function RatingsByMarketCard({
  id,
  canTrack,
  collapsed,
}: {
  id: string;
  canTrack: boolean;
  collapsed: readonly string[];
}) {
  const language = useInterfaceLanguage();
  return (
    <CollapsedSectionsProvider initial={collapsed} known={KNOWN_SECTIONS}>
      <CollapsibleCard
        section={OVERVIEW_SECTION.ratingsByMarket}
        eyebrow={language === "zh-CN" ? "商店评分" : "Store ratings"}
        title={language === "zh-CN" ? "各市场评分" : "Ratings by market"}
        actions={<RatingsByMarketHelp />}
      >
        <Suspense fallback={<RatingsByMarketSkeleton />}>
          <RatingsByMarketBody id={id} canTrack={canTrack} />
        </Suspense>
      </CollapsibleCard>
    </CollapsedSectionsProvider>
  );
}
