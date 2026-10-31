"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import type { ActionSummary } from "@asobeast/shared";
import { TrendChip } from "@/components/ui/delta-chip";
import { StatTile, StatTileGroup } from "@/components/ui/stat-tile";
import { formatNumber } from "@/lib/format";
import {
  actionSummaryOptions,
  portfolioInsightsOptions,
  portfolioOptions,
} from "@/lib/queries";
import { cn } from "@/lib/utils";
import { MovementValue } from "./MovementValue";
import { PULSE_GRID } from "./skeletons";

function Top10Note({
  delta,
  tracked,
}: {
  delta: number | null;
  tracked: number;
}) {
  const language = useInterfaceLanguage();
  return (
    <span className="flex flex-wrap items-center gap-x-1">
      <TrendChip label="7d" value={delta} />
      <span>
        {language === "zh-CN"
          ? `共追踪 ${formatNumber(tracked)} 个`
          : `of ${formatNumber(tracked)} tracked`}
      </span>
    </span>
  );
}

function OpenActionsNote({ summary }: { summary: ActionSummary }) {
  const language = useInterfaceLanguage();
  if (summary.generatedAt === null)
    return language === "zh-CN" ? "尚未生成" : "not generated yet";
  const { critical, high } = summary.openByPriority;
  if (critical === 0 && high === 0)
    return language === "zh-CN" ? "等待处理" : "waiting on you";
  return (
    <>
      <span className={cn(critical > 0 && "text-priority-critical")}>
        {formatNumber(critical)} {language === "zh-CN" ? "项紧急" : "critical"}
      </span>{" "}
      · {formatNumber(high)} {language === "zh-CN" ? "项高优先级" : "high"}
    </>
  );
}

export function PortfolioPulse() {
  const language = useInterfaceLanguage();
  const { data: portfolio } = useSuspenseQuery(portfolioOptions);
  const { data: insights } = useSuspenseQuery(portfolioInsightsOptions);
  const { data: actions } = useSuspenseQuery(actionSummaryOptions);
  if (portfolio.apps.length === 0) return null;

  const { top10, top10Delta7d, movement, changes7d } = insights.totals;

  return (
    <StatTileGroup className={PULSE_GRID}>
      <StatTile
        label={language === "zh-CN" ? "排名前十的关键词" : "Keywords in top 10"}
        value={formatNumber(top10)}
        note={
          <Top10Note
            delta={top10Delta7d}
            tracked={portfolio.totals.trackedKeywords}
          />
        }
      />
      <StatTile
        label={language === "zh-CN" ? "关键词排名变化" : "Keyword movement"}
        value={<MovementValue movement={movement} />}
        note={
          language === "zh-CN"
            ? `7 天内 ${formatNumber(movement.entered)} 个新上榜 · ${formatNumber(movement.lost)} 个掉出`
            : `${formatNumber(movement.entered)} new · ${formatNumber(movement.lost)} lost in 7 days`
        }
      />
      <StatTile
        label={language === "zh-CN" ? "待处理事项" : "Open actions"}
        value={actions.generatedAt === null ? "—" : formatNumber(actions.open)}
        note={<OpenActionsNote summary={actions} />}
      />
      <StatTile
        label={language === "zh-CN" ? "本周变化" : "Changes this week"}
        value={formatNumber(changes7d.own + changes7d.competitors)}
        note={
          language === "zh-CN"
            ? `竞品 ${formatNumber(changes7d.competitors)} 次 · 你的 App ${formatNumber(changes7d.own)} 次`
            : `${formatNumber(changes7d.competitors)} by competitors · ${formatNumber(changes7d.own)} yours`
        }
      />
    </StatTileGroup>
  );
}
