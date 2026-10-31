"use client";

import { Check, Clock } from "lucide-react";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import type { ActionUpdateRequest } from "@asobeast/shared";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatNumber } from "@/lib/format";
import { ActionDismissMenu } from "./ActionDismissMenu";
import { SNOOZE_PRESET_DAYS, snoozeUntil } from "./ActionSnoozeMenu";

const BAR_BUTTON = "h-11 @2xl/queue:h-7";

export function ActionBulkBar({
  count,
  shown,
  busy,
  onUpdate,
  onSelectAll,
  onClear,
}: {
  count: number;
  shown: number;
  busy: boolean;
  onUpdate: (body: ActionUpdateRequest) => void;
  onSelectAll: () => void;
  onClear: () => void;
}) {
  const language = useInterfaceLanguage();
  if (count === 0) return null;

  return (
    <div
      role="toolbar"
      aria-label={language === "zh-CN" ? "批量操作" : "Bulk actions"}
      className="sticky bottom-4 z-20 flex flex-wrap items-center gap-2 rounded-lg border bg-popover px-3 py-2 shadow-overlay"
    >
      <span className="text-body font-medium">
        {language === "zh-CN" ? `已选择 ${formatNumber(count)} 项` : `${formatNumber(count)} selected`}
      </span>
      <Button
        size="sm"
        className={BAR_BUTTON}
        disabled={busy}
        onClick={() => onUpdate({ status: "DONE" })}
      >
        <Check aria-hidden />
        {language === "zh-CN" ? "完成" : "Done"}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={BAR_BUTTON}
            disabled={busy}
          >
            <Clock aria-hidden />
            {language === "zh-CN" ? "推迟" : "Snooze"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {SNOOZE_PRESET_DAYS.map((days) => (
            <DropdownMenuItem
              key={days}
              onSelect={() =>
                onUpdate({ status: "SNOOZED", snoozedUntil: snoozeUntil(days) })
              }
            >
              {days} {language === "zh-CN" ? "天" : "days"}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <ActionDismissMenu
        className={BAR_BUTTON}
        disabled={busy}
        onDismiss={(reason) => onUpdate({ status: "DISMISSED", reason })}
      />
      {count < shown ? (
        <Button
          variant="ghost"
          size="sm"
          className={BAR_BUTTON}
          onClick={onSelectAll}
        >
          {language === "zh-CN" ? `选择显示的全部 ${formatNumber(shown)} 项` : `Select all ${formatNumber(shown)} shown`}
        </Button>
      ) : null}
      <Button
        variant="ghost"
        size="sm"
        className={BAR_BUTTON}
        onClick={onClear}
      >
        {language === "zh-CN" ? "清除选择" : "Clear selection"}
      </Button>
    </div>
  );
}
