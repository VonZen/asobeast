"use client";

import { Columns3, TableProperties } from "lucide-react";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { componentCopy } from "@/lib/component-copy";
import { Tabs, TabsList, TabsOption } from "@/components/ui/tabs";
import { chartViewParser, type ChartView } from "@/lib/search-params";

export function ChartViewSwitch({
  view,
  onChange,
}: {
  view: ChartView;
  onChange: (view: ChartView) => void;
}) {
  const locale = useInterfaceLanguage();
  return (
    <Tabs
      value={view}
      onValueChange={(next) => onChange(chartViewParser.parse(next) ?? view)}
    >
      <TabsList aria-label={componentCopy(locale, "Layout")}>
        <TabsOption
          value="columns"
          aria-label={componentCopy(locale, "Side by side")}
        >
          <Columns3 aria-hidden />
        </TabsOption>
        <TabsOption value="table" aria-label={componentCopy(locale, "Table")}>
          <TableProperties aria-hidden />
        </TabsOption>
      </TabsList>
    </Tabs>
  );
}
