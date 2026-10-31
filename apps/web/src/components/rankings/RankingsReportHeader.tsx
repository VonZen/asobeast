"use client";

import { useQueryStates } from "nuqs";
import { ReportHeader } from "@/components/app-detail/ReportHeader";
import { rankingsRangeParsers } from "@/lib/search-params";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";

export function RankingsReportHeader({ id }: { id: string }) {
  const chinese = useInterfaceLanguage() === "zh-CN";
  const [ranges] = useQueryStates(rankingsRangeParsers);

  return (
    <ReportHeader
      id={id}
      page={chinese ? "排名" : "Rankings"}
      ranges={[
        {
          label: chinese ? "排名历史" : "Ranking history",
          preset: ranges.range,
        },
        {
          label: chinese ? "SERP 排名变化" : "SERP movers",
          preset: `${ranges.movers}d`,
        },
      ]}
    />
  );
}
