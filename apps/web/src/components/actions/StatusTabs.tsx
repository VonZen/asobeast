"use client";

import { Suspense } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { ActionStatus } from "@asobeast/shared";
import { Tabs, TabsList, TabsOption } from "@/components/ui/tabs";
import { formatNumber, pluralize } from "@/lib/format";
import { actionSummaryFor } from "@/lib/queries";
import { presetCount, presetOf, STATUS_PRESETS } from "./status-presets";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { interfaceCopy } from "@/lib/interface-copy";

interface StatusTabsProps {
  status: readonly ActionStatus[];
  onChange: (next: ActionStatus[] | null) => void;
}

function Tabbed({
  status,
  onChange,
  byStatus,
}: StatusTabsProps & { byStatus: Record<ActionStatus, number> | null }) {
  const locale = useInterfaceLanguage();
  const chinese = locale === "zh-CN";
  return (
    <Tabs
      value={presetOf(status)?.key ?? ""}
      onValueChange={(key) => {
        const preset = STATUS_PRESETS.find((entry) => entry.key === key);
        if (!preset) return;
        onChange(preset.key === "todo" ? null : [...preset.statuses]);
      }}
      className="min-w-0 max-w-full"
    >
      <TabsList aria-label={chinese ? "行动状态" : "Action status"} scrollable>
        {STATUS_PRESETS.map((preset) => {
          const count = byStatus ? presetCount(preset, byStatus) : null;
          return (
            <TabsOption
              key={preset.key}
              value={preset.key}
              aria-controls="queue"
              aria-label={
                count === null
                  ? undefined
                  : chinese
                    ? `${interfaceCopy(locale, preset.label)}，${count} 项行动`
                    : `${preset.label}, ${pluralize(count, "action")}`
              }
              className="flex-none"
            >
              {interfaceCopy(locale, preset.label)}
              {count === null ? null : (
                <span className="numeric font-mono text-muted-foreground">
                  {formatNumber(count)}
                </span>
              )}
            </TabsOption>
          );
        })}
      </TabsList>
    </Tabs>
  );
}

function CountedTabs({
  appId,
  ...props
}: StatusTabsProps & { appId?: string }) {
  const { data: summary } = useSuspenseQuery(actionSummaryFor(appId));
  return <Tabbed {...props} byStatus={summary.byStatus} />;
}

export function StatusTabs(props: StatusTabsProps & { appId?: string }) {
  return (
    <Suspense fallback={<Tabbed {...props} byStatus={null} />}>
      <CountedTabs {...props} />
    </Suspense>
  );
}
