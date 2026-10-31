"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { PRODUCT_NAME } from "@/lib/brand";
import { formatCountry } from "@/lib/format";
import { appDetailOptions } from "@/lib/queries";
import { rangeLabel, type DayPreset } from "@/lib/ranges";
import { usePrintedDate } from "./use-printed-date";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";

export interface ReportRange {
  label: string;
  preset: DayPreset;
}

export function ReportHeader({
  id,
  page,
  ranges,
}: {
  id: string;
  page: string;
  ranges: readonly ReportRange[];
}) {
  const chinese = useInterfaceLanguage() === "zh-CN";
  const { data: detail } = useSuspenseQuery(appDetailOptions(id));
  const printedDate = usePrintedDate();
  const facts = [
    `${chinese ? "主要商店市场" : "Home storefront"}: ${formatCountry(detail.country)}`,
    ...ranges.map((range) => `${range.label}: ${rangeLabel(range.preset)}`),
  ];

  return (
    <div className="hidden flex-col gap-1 print:flex">
      <p className="text-title">{chinese ? `${page}报告` : `${page} report`}</p>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-body text-muted-foreground">
        {facts.map((fact) => (
          <li key={fact}>{fact}</li>
        ))}
      </ul>
      <p
        className="text-caption text-muted-foreground"
        suppressHydrationWarning
      >
        {chinese
          ? `由 ${PRODUCT_NAME} 于 ${printedDate}（UTC）打印`
          : `Printed ${printedDate} (UTC) from ${PRODUCT_NAME}`}
      </p>
    </div>
  );
}
