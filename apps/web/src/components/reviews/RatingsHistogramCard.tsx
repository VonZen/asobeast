"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { RATING_STARS, type RatingCounts } from "@asobeast/shared";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate, formatNumber, pluralize } from "@/lib/format";
import { ratingsHistogramOptions } from "@/lib/queries";

const percentOf = (count: number, total: number): number =>
  total === 0 ? 0 : (count / total) * 100;

function HistogramBars({
  counts,
  total,
}: {
  counts: RatingCounts;
  total: number;
}) {
  const language = useInterfaceLanguage();
  return (
    <ul className="flex flex-col gap-2">
      {[...RATING_STARS].reverse().map((star) => {
        const count = counts[star];
        const percent = percentOf(count, total);
        return (
          <li key={star} className="flex items-center gap-3 text-sm">
            <span className="w-14 shrink-0 numeric font-mono whitespace-nowrap text-muted-foreground">
              {star} {language === "zh-CN" ? "星" : "star"}
            </span>
            <span
              role="meter"
              aria-valuenow={Math.round(percent)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={
                language === "zh-CN" ? `${star} 星评分` : `${star} star ratings`
              }
              className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
            >
              <span
                className="block h-full rounded-full bg-primary"
                style={{ width: `${percent}%` }}
              />
            </span>
            <span className="min-w-28 shrink-0 text-right numeric font-mono whitespace-nowrap text-muted-foreground">
              {formatNumber(count)} · {percent.toFixed(1)}%
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function RatingsHistogramCard({ id }: { id: string }) {
  const language = useInterfaceLanguage();
  const { data } = useSuspenseQuery(ratingsHistogramOptions(id));

  if (!data.available || data.counts === null || data.total === null) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardDescription>
          {language === "zh-CN" ? "评分分布" : "Ratings distribution"}
        </CardDescription>
        <CardTitle>
          {language === "zh-CN"
            ? `${formatNumber(data.total)} 条评分`
            : pluralize(data.total, "rating")}
          {data.capturedAt
            ? language === "zh-CN"
              ? `，截至 ${formatDate(data.capturedAt, language)}`
              : ` as of ${formatDate(data.capturedAt)}`
            : ""}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <HistogramBars counts={data.counts} total={data.total} />
      </CardContent>
    </Card>
  );
}
