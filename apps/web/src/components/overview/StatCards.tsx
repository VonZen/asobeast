"use client";

import Link from "next/link";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { useKeywordScope } from "@/components/app-detail/use-market";
import { appSummaryOptions } from "@/lib/queries";
import { TrendChip } from "@/components/ui/delta-chip";
import { VisibilityHelp } from "@/components/visibility/VisibilityHelp";

export function StatCards({ id }: { id: string }) {
  const language = useInterfaceLanguage();
  const { country, switchable } = useKeywordScope(id);
  const { data: summary } = useSuspenseQuery(appSummaryOptions(id, country));
  const label = switchable
    ? ` · ${country?.toUpperCase() ?? (language === "zh-CN" ? "所有市场" : "All markets")}`
    : "";

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader>
          <CardDescription className="flex items-center gap-1">
            {language === "zh-CN" ? "可见度" : "Visibility"}
            {label}
            <VisibilityHelp />
          </CardDescription>
          <CardTitle className="numeric font-mono text-3xl">
            {Math.round(summary.visibility.current)}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          <TrendChip label="7d" value={summary.visibility.delta7d} />
          <TrendChip label="30d" value={summary.visibility.delta30d} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>
            {language === "zh-CN" ? "追踪的关键词" : "Tracked keywords"}
            {label}
          </CardDescription>
          <CardTitle className="numeric font-mono text-3xl">
            {summary.trackedKeywords}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          {language === "zh-CN"
            ? `${summary.rankDistribution.top10} 个进入前十`
            : `${summary.rankDistribution.top10} in top 10`}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>
            {language === "zh-CN" ? "竞品" : "Competitors"}
          </CardDescription>
          <CardTitle className="numeric font-mono text-3xl">
            {summary.competitors}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Link
            href={`/apps/${id}/competitors`}
            className="text-xs font-medium text-muted-foreground hover:text-foreground print:hidden"
          >
            {language === "zh-CN" ? "查看对比" : "View comparison"}
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>
            {language === "zh-CN" ? "上次刷新" : "Last refresh"}
          </CardDescription>
          <CardTitle className="text-xl">
            {summary.lastRefreshAt
              ? formatDate(summary.lastRefreshAt, language)
              : language === "zh-CN"
                ? "从未"
                : "never"}
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
