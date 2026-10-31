"use client";

import type { RefObject } from "react";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { interfaceCopy } from "@/lib/interface-copy";
import { Send } from "lucide-react";
import type { Store } from "@asobeast/shared";
import { Button } from "@/components/ui/button";
import { ReplyConfirmDialog } from "./ReplyConfirmDialog";
import { consoleLabel } from "./store-console";
import { postRules } from "./store-reply-access";

export function PostReplyDialog({
  store,
  text,
  label,
  disabled,
  busy,
  textRef,
  onPost,
}: {
  store: Store;
  text: string;
  label: string;
  disabled: boolean;
  busy: boolean;
  textRef: RefObject<HTMLTextAreaElement | null>;
  onPost: () => void;
}) {
  const language = useInterfaceLanguage();
  return (
    <ReplyConfirmDialog
      trigger={
        <Button
          size="sm"
          disabled={disabled}
          aria-disabled={busy || undefined}
          onClick={(event) => {
            if (busy) event.preventDefault();
          }}
        >
          <Send />
          {language === "zh-CN" ? (label.startsWith("Update on ") ? `更新 ${label.slice("Update on ".length)} 上的回复` : label.startsWith("Post to ") ? `发布到 ${label.slice("Post to ".length)}` : label) : label}
        </Button>
      }
      title={language === "zh-CN" ? "公开发布此回复？" : "Post this reply publicly?"}
      description={language === "zh-CN" ? `AsoBeast 会将此文本发送到 ${consoleLabel(store)}，作为对这条评论的回复。` : `AsoBeast sends this text to ${consoleLabel(store)} as the reply to this review.`}
      cancelLabel={language === "zh-CN" ? "继续编辑" : "Keep editing"}
      actionLabel={language === "zh-CN" ? "发布" : "Post"}
      textRef={textRef}
      onConfirm={onPost}
    >
      <ul className="w-full list-disc space-y-1 pl-4 text-start text-body text-muted-foreground">
        {postRules(store).map((rule) => (
          <li key={rule}>{language === "zh-CN" && rule.startsWith("The reply is public under the review on ") ? `回复会公开显示在 ${store === "APP_STORE" ? "App Store" : "Google Play"} 的评论下方。` : interfaceCopy(language, rule)}</li>
        ))}
      </ul>
      <blockquote
        dir="auto"
        className="w-full rounded-md border bg-muted/40 p-3 text-start text-body wrap-anywhere whitespace-pre-line"
      >
        {text}
      </blockquote>
    </ReplyConfirmDialog>
  );
}
