"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { TriangleAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatNumber, storeLabel } from "@/lib/format";
import { budgetOptions } from "@/lib/queries";
import {
  utilizationLevel,
  utilizationPercent,
  utilizationStatus,
} from "@/lib/utilization";
import { UtilizationMeter } from "@/components/capacity/UtilizationMeter";
import { budgetCompletionSentence } from "./budget-completion";
import { localizationsNote, marketListingsNote } from "./market-listings-note";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { interfaceCopy } from "@/lib/interface-copy";

const WARNING_COPY =
  "Daily jobs may not finish within store rate limits; remove keywords or countries, or raise SCRAPE_ITUNES_RPM at your own risk.";

export function BudgetCard() {
  const locale = useInterfaceLanguage();
  const chinese = locale === "zh-CN";
  const t = (value: string) => interfaceCopy(locale, value);
  const { data: budget } = useSuspenseQuery(budgetOptions);
  const level = utilizationLevel(budget.utilization);
  const completion = budgetCompletionSentence(budget.completion, budget.total);
  const notes = [
    marketListingsNote(budget.marketListings),
    localizationsNote(budget.localizations),
  ].filter((note): note is string => note !== null);

  const rows = [
    { label: "Apps", value: budget.apps },
    { label: "Keywords", value: budget.keywords },
    { label: "Categories", value: budget.categories },
    { label: "Reviews", value: budget.reviews },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Daily request budget")}</CardTitle>
        <CardDescription>
          {t(
            "Estimated store requests the daily pipeline enqueues, against your rate limit.",
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
          {rows.map((row) => (
            <div key={row.label} className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground">{t(row.label)}</dt>
              <dd className="text-lg font-semibold tabular-nums">
                {formatNumber(row.value)}
              </dd>
            </div>
          ))}
        </dl>

        {notes.map((note) => (
          <p key={note} className="text-sm text-muted-foreground">
            {note}
          </p>
        ))}

        <div className="flex flex-col gap-4">
          {budget.stores.map((store) => (
            <div key={store.store} className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium">{storeLabel(store.store)}</span>
                <span className="text-muted-foreground tabular-nums">
                  {chinese ? (
                    `${formatNumber(store.total)} / ${formatNumber(store.capacityPerDay)} 次请求/天 · `
                  ) : (
                    <>
                      {formatNumber(store.total)} of{" "}
                      {formatNumber(store.capacityPerDay)} requests/day ·{" "}
                    </>
                  )}
                  {utilizationPercent(store.utilization)}%
                </span>
              </div>
              <UtilizationMeter
                label={
                  chinese
                    ? `${storeLabel(store.store)} 每日请求使用率`
                    : `${storeLabel(store.store)} daily request utilization`
                }
                utilization={store.utilization}
              />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 border-t pt-4">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">
              {chinese
                ? `商店请求额度峰值使用率 · ${formatNumber(budget.total)} / ${formatNumber(budget.capacityPerDay)} 次请求/天`
                : `Peak store utilization · ${formatNumber(budget.total)} of ${formatNumber(budget.capacityPerDay)} requests/day`}
            </span>
            <span className="font-medium tabular-nums">
              {utilizationStatus(budget.utilization)} ·{" "}
              {utilizationPercent(budget.utilization)}%
            </span>
          </div>
          <UtilizationMeter
            label={t("Peak store utilization")}
            utilization={budget.utilization}
          />
        </div>

        {completion ? (
          <p className="text-sm text-muted-foreground tabular-nums">
            {completion}
          </p>
        ) : null}

        {level !== "ok" ? (
          <Alert variant={level === "danger" ? "destructive" : "default"}>
            <TriangleAlert />
            <AlertDescription>{t(WARNING_COPY)}</AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}
