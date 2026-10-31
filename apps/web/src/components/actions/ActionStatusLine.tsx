"use client";

import type { ReactNode } from "react";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { ActionSummary } from "@asobeast/shared";
import { Separated } from "@/components/ui/separated";
import { formatDateTime, formatNumber } from "@/lib/format";
import { actionSummaryFor } from "@/lib/queries";

function statusParts(summary: ActionSummary, zh: boolean): ReactNode[] {
  const { critical, high } = summary.openByPriority;
  return [
    zh
      ? `${formatNumber(summary.open)} 项待处理`
      : `${formatNumber(summary.open)} open`,
    critical > 0 ? (
      <span className="text-priority-critical">
        {formatNumber(critical)} {zh ? "项紧急" : "critical"}
      </span>
    ) : null,
    high > 0
      ? zh
        ? `${formatNumber(high)} 项高优先级`
        : `${formatNumber(high)} high`
      : null,
    summary.generatedAt ? (
      <span>
        {zh ? "生成于 " : "generated "}
        <time dateTime={summary.generatedAt}>
          {formatDateTime(summary.generatedAt, zh ? "zh-CN" : "en")}
        </time>
      </span>
    ) : zh ? (
      "尚未生成"
    ) : (
      "not generated yet"
    ),
  ].filter((part) => part !== null);
}

export function ActionStatusLine({ appId }: { appId?: string }) {
  const language = useInterfaceLanguage();
  const { data: summary } = useSuspenseQuery(actionSummaryFor(appId));

  return (
    <p data-slot="action-status" className="text-body text-muted-foreground">
      <Separated parts={statusParts(summary, language === "zh-CN")} />
      {appId === undefined && summary.suppressedByCap > 0 ? (
        <span className="hidden @md/actions:inline">
          <span aria-hidden> · </span>
          {language === "zh-CN"
            ? `因单个应用数量上限隐藏 ${formatNumber(summary.suppressedByCap)} 项`
            : `${formatNumber(summary.suppressedByCap)} withheld by the per app cap`}
        </span>
      ) : null}
    </p>
  );
}
