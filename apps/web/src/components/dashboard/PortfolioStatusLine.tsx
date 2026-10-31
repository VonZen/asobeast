"use client";

import type { ReactNode } from "react";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import type { InterfaceLanguage } from "@/lib/interface-language";
import Link from "next/link";
import { useSuspenseQuery } from "@tanstack/react-query";
import type {
  DailyBudget,
  PortfolioTotals,
  RunState,
  WorkspaceRunStatus,
} from "@asobeast/shared";
import { Separated } from "@/components/ui/separated";
import { formatDate, pluralize } from "@/lib/format";
import {
  budgetOptions,
  portfolioOptions,
  runStatusOptions,
} from "@/lib/queries";

const RUN_STATE_TEXT: Record<RunState, string | null> = {
  idle: null,
  running: "Daily run in progress",
  complete: "Daily run complete",
  delayed: "Daily run delayed",
};

function inventory(
  totals: PortfolioTotals,
  language: InterfaceLanguage,
): ReactNode[] {
  if (language === "zh-CN")
    return [
      `${totals.apps} 个 App`,
      `${totals.trackedKeywords} 个关键词`,
      `${totals.competitors} 个竞品`,
    ];
  return [
    pluralize(totals.apps, "app"),
    pluralize(totals.trackedKeywords, "keyword"),
    pluralize(totals.competitors, "competitor"),
  ];
}

function budgetShare(utilization: number): string {
  const percent = Math.round(utilization * 100);
  return percent === 0 ? "<1%" : `${percent}%`;
}

function freshness(
  run: WorkspaceRunStatus,
  budget: DailyBudget | null,
  language: InterfaceLanguage,
): ReactNode[] {
  const state =
    language === "zh-CN"
      ? (
          {
            idle: null,
            running: "每日任务进行中",
            complete: "每日任务已完成",
            delayed: "每日任务延迟",
          } satisfies Record<RunState, string | null>
        )[run.state]
      : RUN_STATE_TEXT[run.state];
  return [
    run.lastCaptureAt ? (
      <span>
        {language === "zh-CN" ? "采集于 " : "Collected "}
        <time dateTime={run.lastCaptureAt}>
          {formatDate(run.lastCaptureAt, language)}
        </time>
      </span>
    ) : null,
    state,
    budget && budget.utilization > 0 ? (
      <Link href="/settings" className="underline-offset-4 hover:underline">
        {language === "zh-CN"
          ? `已使用每日请求额度的 ${budgetShare(budget.utilization)}`
          : `${budgetShare(budget.utilization)} of the daily request budget`}
      </Link>
    ) : null,
  ].filter((part) => part !== null);
}

export function PortfolioStatusLine() {
  return <StatusLine budget={null} />;
}

export function OperatorPortfolioStatusLine() {
  const { data: budget } = useSuspenseQuery(budgetOptions);
  return <StatusLine budget={budget} />;
}

function StatusLine({ budget }: { budget: DailyBudget | null }) {
  const language = useInterfaceLanguage();
  const { data: portfolio } = useSuspenseQuery(portfolioOptions);
  const { data: run } = useSuspenseQuery(runStatusOptions);
  const fresh = freshness(run, budget, language);

  return (
    <div
      data-slot="portfolio-status"
      className="flex flex-col gap-1 text-body text-muted-foreground"
    >
      <p>
        <Separated parts={inventory(portfolio.totals, language)} />
      </p>
      {fresh.length > 0 ? (
        <p>
          <Separated parts={fresh} />
        </p>
      ) : null}
    </div>
  );
}
