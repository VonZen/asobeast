"use client";

import type { RefObject } from "react";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { Button } from "@/components/ui/button";
import { ReplyConfirmDialog } from "./ReplyConfirmDialog";

export function WithdrawReplyButton({
  busy,
  textRef,
  onWithdraw,
}: {
  busy: boolean;
  textRef: RefObject<HTMLTextAreaElement | null>;
  onWithdraw: () => void;
}) {
  const language = useInterfaceLanguage();
  return (
    <ReplyConfirmDialog
      trigger={
        <Button
          variant="outline"
          size="sm"
          aria-disabled={busy || undefined}
          onClick={(event) => {
            if (busy) event.preventDefault();
          }}
        >
          {language === "zh-CN" ? "从 App Store 撤回" : "Withdraw from App Store"}
        </Button>
      }
      title={language === "zh-CN" ? "撤回此回复？" : "Withdraw this response?"}
      description={language === "zh-CN" ? "Apple 会在一天内移除该回复，文本仍会保存在这里。" : "Apple removes it within a day. The text stays here."}
      cancelLabel={language === "zh-CN" ? "保留" : "Keep it"}
      actionLabel={language === "zh-CN" ? "撤回" : "Withdraw"}
      destructive
      textRef={textRef}
      onConfirm={onWithdraw}
    />
  );
}
