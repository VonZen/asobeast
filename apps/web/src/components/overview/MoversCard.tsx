"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import type { KeywordMover } from "@asobeast/shared";
import { MoverList } from "@/components/rankings/MoverRow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useKeywordScope } from "@/components/app-detail/use-market";
import { appSummaryOptions } from "@/lib/queries";

export function MoversCard({ id }: { id: string }) {
  const language = useInterfaceLanguage();
  const { country } = useKeywordScope(id);
  const { data: summary } = useSuspenseQuery(appSummaryOptions(id, country));
  const rankingsHref = (mover: KeywordMover) =>
    `/apps/${id}/rankings?keywords=${mover.keywordId}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {language === "zh-CN" ? "关键词排名变化" : "Keyword movers"}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-2">
        <MoverList
          title={language === "zh-CN" ? "排名上升" : "Climbers"}
          movers={summary.movers.up}
          renderHref={rankingsHref}
        />
        <MoverList
          title={language === "zh-CN" ? "排名下降" : "Fallers"}
          movers={summary.movers.down}
          renderHref={rankingsHref}
        />
      </CardContent>
    </Card>
  );
}
