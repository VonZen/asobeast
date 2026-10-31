"use client";

import { Tabs, TabsList, TabsOption } from "@/components/ui/tabs";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { rangeLabel, type DayPreset } from "@/lib/ranges";

export function PrintRangeLabel({ preset }: { preset: DayPreset }) {
  const language = useInterfaceLanguage();
  return (
    <span className="hidden text-body text-muted-foreground print:inline">
      {language === "zh-CN"
        ? `最近 ${preset.slice(0, -1)} 天`
        : rangeLabel(preset)}
    </span>
  );
}

export function RangePicker<T extends DayPreset>({
  presets,
  value,
  onChange,
  label,
}: {
  presets: readonly T[];
  value: T;
  onChange: (next: T) => void;
  label?: string;
}) {
  const language = useInterfaceLanguage();
  return (
    <Tabs value={value} onValueChange={(next) => onChange(next as T)}>
      <TabsList
        aria-label={label ?? (language === "zh-CN" ? "日期范围" : "Date range")}
        className="print:hidden"
      >
        {presets.map((preset) => (
          <TabsOption key={preset} value={preset}>
            {language === "zh-CN" ? `${preset.slice(0, -1)} 天` : preset}
          </TabsOption>
        ))}
      </TabsList>
      <PrintRangeLabel preset={value} />
    </Tabs>
  );
}
