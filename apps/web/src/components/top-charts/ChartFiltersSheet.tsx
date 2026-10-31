"use client";

import type { ReactNode } from "react";
import { ListFilter } from "lucide-react";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  ChartCompareFilter,
  ChartCountryFilter,
  ChartDeviceFilter,
  ChartGenreFilter,
  ChartKindFilter,
  ChartLayoutFilter,
  type ChartFilterProps,
} from "./chart-filter-controls";
import { showsDevice } from "./chart-filters";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span aria-hidden className="text-caption text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}

export function ChartFiltersSheet({
  active,
  ...filters
}: ChartFilterProps & { active: number }) {
  const zh = useInterfaceLanguage() === "zh-CN";
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <ListFilter aria-hidden />
          {zh ? "筛选" : "Filters"}
          {active > 0 ? (
            <Badge variant="secondary" className="numeric font-mono">
              {active}
            </Badge>
          ) : null}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[80svh]">
        <SheetHeader>
          <SheetTitle>{zh ? "筛选" : "Filters"}</SheetTitle>
          <SheetDescription>
            {zh
              ? "选择排行榜的国家／地区、类别和对比范围。"
              : "Pick the country, category and comparison of the charts."}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col items-start gap-4">
          <Field label={zh ? "国家／地区" : "Country"}>
            <ChartCountryFilter {...filters} />
          </Field>
          <Field label={zh ? "类别" : "Category"}>
            <ChartGenreFilter {...filters} />
          </Field>
          {showsDevice(filters.chart.store) ? (
            <Field label={zh ? "设备" : "Device"}>
              <ChartDeviceFilter {...filters} />
            </Field>
          ) : null}
          {filters.view === "table" ? (
            <Field label={zh ? "榜单" : "Chart"}>
              <ChartKindFilter {...filters} />
            </Field>
          ) : null}
          <Field label={zh ? "对比" : "Compare"}>
            <ChartCompareFilter {...filters} />
          </Field>
          <Field label={zh ? "布局" : "Layout"}>
            <ChartLayoutFilter {...filters} />
          </Field>
        </div>
      </SheetContent>
    </Sheet>
  );
}
