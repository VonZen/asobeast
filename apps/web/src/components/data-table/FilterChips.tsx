"use client";

import { X } from "lucide-react";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { componentFilterCopy } from "@/lib/component-copy";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface FilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

export function FilterChips({
  chips,
  onClearAll,
}: {
  chips: readonly FilterChip[];
  onClearAll: () => void;
}) {
  const language = useInterfaceLanguage();
  if (chips.length === 0) return null;

  return (
    <ul
      aria-label={language === "zh-CN" ? "已启用的筛选条件" : "Active filters"}
      className="flex flex-wrap items-center gap-2"
    >
      {chips.map((chip) => (
        <li key={chip.key} className="max-w-full min-w-0">
          <Badge
            variant="secondary"
            className="h-auto min-h-6 max-w-full gap-1 py-px pr-0.5 text-left whitespace-normal wrap-anywhere"
          >
            {componentFilterCopy(language, chip.label)}
            <button
              type="button"
              aria-label={
                language === "zh-CN"
                  ? `移除 ${componentFilterCopy(language, chip.label)}`
                  : `Remove ${chip.label}`
              }
              onClick={chip.onRemove}
              className="inline-flex size-5 shrink-0 items-center justify-center rounded-full opacity-70 outline-none hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-3" aria-hidden />
            </button>
          </Badge>
        </li>
      ))}
      {chips.length > 1 ? (
        <li>
          <Button variant="ghost" size="xs" onClick={onClearAll}>
            {language === "zh-CN" ? "清除全部" : "Clear all"}
          </Button>
        </li>
      ) : null}
    </ul>
  );
}
