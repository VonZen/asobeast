"use client";

import { MoreHorizontal } from "lucide-react";
import { toast } from "@/lib/localized-toast";
import type { ActionItem, ActionUpdateRequest } from "@asobeast/shared";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ActionDismissSubMenu } from "./ActionDismissMenu";
import { SNOOZE_PRESET_DAYS, snoozeUntil } from "./ActionSnoozeMenu";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";

export function ActionRowMenu({
  item,
  headline,
  href,
  disabled,
  onUpdate,
}: {
  item: ActionItem;
  headline: string;
  href: string;
  disabled: boolean;
  onUpdate: (body: ActionUpdateRequest) => void;
}) {
  const chinese = useInterfaceLanguage() === "zh-CN";
  const copyLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}${href}`);
    toast.success(chinese ? "链接已复制" : "Link copied");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={disabled}
          aria-label={
            chinese ? `${headline} 的更多操作` : `More actions for ${headline}`
          }
          data-command="more"
          className="size-11 @2xl/queue:size-7"
        >
          <MoreHorizontal aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {item.status === "SNOOZED" ? (
          <DropdownMenuItem onSelect={() => onUpdate({ status: "OPEN" })}>
            {chinese ? "立即恢复" : "Wake now"}
          </DropdownMenuItem>
        ) : (
          SNOOZE_PRESET_DAYS.map((days) => (
            <DropdownMenuItem
              key={days}
              onSelect={() =>
                onUpdate({ status: "SNOOZED", snoozedUntil: snoozeUntil(days) })
              }
            >
              {chinese ? `延后 ${days} 天` : `Snooze ${days} days`}
            </DropdownMenuItem>
          ))
        )}
        <ActionDismissSubMenu
          onDismiss={(reason) => onUpdate({ status: "DISMISSED", reason })}
        />
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void copyLink()}>
          {chinese ? "复制链接" : "Copy link"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
