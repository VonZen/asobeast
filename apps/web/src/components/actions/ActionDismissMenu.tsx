"use client";

import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { interfaceCopy } from "@/lib/interface-copy";
import { X } from "lucide-react";
import {
  ACTION_DISMISS_REASONS,
  type ActionDismissReason,
} from "@asobeast/shared";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ACTION_DISMISS_REASON_LABEL } from "./action-history";

type OnDismiss = (reason?: ActionDismissReason) => void;

function DismissItems({ onDismiss }: { onDismiss: OnDismiss }) {
  const language = useInterfaceLanguage();
  return (
    <>
      {ACTION_DISMISS_REASONS.map((reason) => (
        <DropdownMenuItem key={reason} onSelect={() => onDismiss(reason)}>
          {interfaceCopy(language, ACTION_DISMISS_REASON_LABEL[reason])}
        </DropdownMenuItem>
      ))}
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={() => onDismiss()}>
        {language === "zh-CN" ? "不填写原因并忽略" : "Dismiss without a reason"}
      </DropdownMenuItem>
    </>
  );
}

export function ActionDismissSubMenu({ onDismiss }: { onDismiss: OnDismiss }) {
  const language = useInterfaceLanguage();
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        {language === "zh-CN" ? "忽略" : "Dismiss"}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DismissItems onDismiss={onDismiss} />
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

export function ActionDismissMenu({
  onDismiss,
  disabled,
  className,
}: {
  onDismiss: OnDismiss;
  disabled: boolean;
  className?: string;
}) {
  const language = useInterfaceLanguage();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          data-command="dismiss"
          className={className}
        >
          <X aria-hidden />
          {language === "zh-CN" ? "忽略" : "Dismiss"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DismissItems onDismiss={onDismiss} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
