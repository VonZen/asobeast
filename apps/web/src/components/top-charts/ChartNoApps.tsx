"use client";

import { Trophy } from "lucide-react";
import type { ChartCaptureSummary, ChartPage } from "@asobeast/shared";
import { EmptyState } from "@/components/ui/empty-state";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { formatDate, storeLabel } from "@/lib/format";
import { noAppsBody } from "./chart-actions";

export function ChartNoApps({
  page,
  className,
}: {
  page: Pick<ChartPage, "chart"> & { capture: ChartCaptureSummary };
  className?: string;
}) {
  const language = useInterfaceLanguage();
  return (
    <EmptyState
      className={className}
      icon={Trophy}
      title={
        language === "zh-CN" ? "此排行榜中没有 App" : "No apps in this chart"
      }
      body={
        language === "zh-CN"
          ? `${storeLabel(page.chart.store)} 在 ${formatDate(page.capture.date, language)} 的 ${page.chart.genreName} 类别中没有列出 App。某些榜单类别（如付费榜）可能没有 App。`
          : noAppsBody(page.chart, page.capture.date)
      }
    />
  );
}
