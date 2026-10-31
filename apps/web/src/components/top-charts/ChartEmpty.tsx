"use client";

import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import type { ReactNode } from "react";
import type { PlanLimits } from "@asobeast/shared";
import { EmptyState } from "@/components/ui/empty-state";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { formatDate } from "@/lib/format";
import { accountPlanOptions } from "@/lib/queries";
import { emptyChartBody } from "./chart-actions";

export function ChartEmpty({
  captured,
  date,
  action,
  className,
}: {
  captured: boolean;
  date: string | null;
  action?: ReactNode;
  className?: string;
}) {
  const language = useInterfaceLanguage();
  const limits = useQuery(accountPlanOptions).data?.limits;
  return (
    <EmptyState
      className={className}
      icon={Trophy}
      title={
        language === "zh-CN"
          ? captured
            ? `${formatDate(date, language)} 没有此排行榜的采集记录`
            : "尚未采集此排行榜"
          : captured
            ? `No capture of this chart on ${formatDate(date)}`
            : "This chart has not been captured yet"
      }
      body={
        language === "zh-CN"
          ? chineseEmptyBody(captured, limits)
          : emptyChartBody(captured, limits)
      }
      action={action}
    />
  );
}

function chineseEmptyBody(
  captured: boolean,
  limits: Pick<PlanLimits, "onDemand"> | undefined,
): string {
  const limit = limits?.onDemand?.chartCapture.limit;
  const hint = captured
    ? limit === 0
      ? "请选择已采集的日期。"
      : "请选择已采集的日期，或采集今天的榜单。"
    : limit === 0
      ? "关注此类别后，每日任务会持续采集。"
      : "可以立即采集，或关注此类别，让每日任务持续采集。 ";
  const cost = !limits
    ? "采集今天的榜单会向商店请求一次。"
    : limit === undefined
      ? "采集今天的榜单会向商店请求一次，并为所有工作区保存该榜单。"
      : limit === 0
        ? "你的方案不包含排行榜采集。"
        : `采集今天的榜单会使用每日 ${limit} 次排行榜采集额度中的一次。`;
  return `${hint} ${cost}`;
}
