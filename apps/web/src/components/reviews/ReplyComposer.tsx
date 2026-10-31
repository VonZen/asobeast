"use client";

import { useId, useRef, useState, type RefObject } from "react";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { interfaceCopy } from "@/lib/interface-copy";
import { Copy, ExternalLink } from "lucide-react";
import { toast } from "@/lib/localized-toast";
import type {
  ReviewItem,
  ReviewReplyPatchRequest,
  Store,
} from "@asobeast/shared";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { storeLabel } from "@/lib/format";
import { useSharedFlight } from "@/lib/single-flight";
import { cn } from "@/lib/utils";
import { PostReplyDialog } from "./PostReplyDialog";
import { ReplyConfirmDialog } from "./ReplyConfirmDialog";
import { ReplyDraftControls } from "./ReplyDraftControls";
import { ReplyFooter, StoreReplyNotice } from "./ReplyStoreNotes";
import { WithdrawReplyButton } from "./WithdrawReplyButton";
import { measureReply, type ReplyMeasure } from "./reply-text";
import { consoleHref, consoleLabel } from "./store-console";
import {
  composerActions,
  discardNotice,
  markLabel,
} from "./store-reply-access";
import { useReplyDraft } from "./use-reply-draft";
import { useReviewReply } from "./use-review-reply";
import { useStorePosting } from "./use-store-posting";
import { useStoreReplyAccess } from "./use-store-reply-access";

export interface ReplyComposerProps {
  appId: string;
  review: ReviewItem;
  store: Store;
  storeAppId: string;
  onClose: () => void;
}

function useReplyText(saved: string) {
  const [text, setText] = useState(saved);
  const [baseline, setBaseline] = useState(saved);
  if (saved !== baseline) {
    setBaseline(saved);
    if (text === baseline) setText(saved);
  }
  return [text, setText] as const;
}

function ReplyCounter({
  id,
  measure,
  store,
}: {
  id: string;
  measure: ReplyMeasure;
  store: Store;
}) {
  const language = useInterfaceLanguage();
  const { length, limit, over } = measure;
  return (
    <p
      id={id}
      className={cn(
        "text-caption numeric",
        over ? "text-destructive" : "text-muted-foreground",
      )}
    >
      {length} / {limit}
      <span aria-live="polite">
        {over
          ? language === "zh-CN"
            ? ` · ${storeLabel(store)} 最多允许 ${limit} 个字符`
            : ` · ${storeLabel(store)} allows at most ${limit} characters`
          : null}
      </span>
    </p>
  );
}

function ClearedReplyHint({
  text,
  saved,
  drafting,
}: {
  text: string;
  saved: string;
  drafting: boolean;
}) {
  const language = useInterfaceLanguage();
  const kept = text === "" && saved !== "" && !drafting;
  return (
    <p
      aria-live="polite"
      className="text-caption text-muted-foreground empty:hidden"
    >
      {kept
        ? language === "zh-CN"
          ? "清空输入框会保留已保存的回复。点击“丢弃”可将其移除。"
          : "Emptying the field keeps the saved reply. Press Discard to remove it."
        : null}
    </p>
  );
}

function DiscardReplyButton({
  notice,
  disabled,
  textRef,
  onDiscard,
}: {
  notice: string;
  disabled: boolean;
  textRef: RefObject<HTMLTextAreaElement | null>;
  onDiscard: () => void;
}) {
  const language = useInterfaceLanguage();
  return (
    <ReplyConfirmDialog
      trigger={
        <Button variant="outline" size="sm" disabled={disabled}>
          {language === "zh-CN" ? "丢弃" : "Discard"}
        </Button>
      }
      title={language === "zh-CN" ? "丢弃这条回复？" : "Discard this reply?"}
      description={
        language === "zh-CN"
          ? `此评论保存的回复文本和已回复标记将被移除。${interfaceCopy(language, notice)}`
          : `The text and the replied mark kept for this review are removed. ${notice}`
      }
      cancelLabel={language === "zh-CN" ? "保留" : "Keep it"}
      actionLabel={language === "zh-CN" ? "丢弃" : "Discard"}
      destructive
      textRef={textRef}
      onConfirm={onDiscard}
    />
  );
}

function ReplyTextField({
  textRef,
  text,
  saved,
  measure,
  store,
  drafting,
  onChange,
  onBlur,
}: {
  textRef: RefObject<HTMLTextAreaElement | null>;
  text: string;
  saved: string;
  measure: ReplyMeasure;
  store: Store;
  drafting: boolean;
  onChange: (text: string) => void;
  onBlur: () => void;
}) {
  const language = useInterfaceLanguage();
  const counterId = useId();
  return (
    <div className="flex flex-col gap-1">
      <Textarea
        ref={textRef}
        autoFocus
        aria-label={language === "zh-CN" ? "回复内容" : "Reply text"}
        dir="auto"
        aria-describedby={counterId}
        aria-invalid={measure.over || undefined}
        aria-busy={drafting || undefined}
        readOnly={drafting}
        value={text}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        placeholder={
          language === "zh-CN"
            ? drafting
              ? "正在起草回复…"
              : "填写将在商店评论下显示的回复"
            : drafting
              ? "Drafting a reply…"
              : "Write the reply the store will show under this review"
        }
        className="min-h-24 bg-card"
      />
      <ReplyCounter id={counterId} measure={measure} store={store} />
      <ClearedReplyHint
        text={measure.trimmed}
        saved={saved}
        drafting={drafting}
      />
    </div>
  );
}

const markBody = (
  marked: boolean,
  unsaved: boolean,
  trimmed: string,
): ReviewReplyPatchRequest =>
  marked
    ? { replied: false }
    : { ...(unsaved ? { text: trimmed } : {}), replied: true };

export function ReplyComposer({
  appId,
  review,
  store,
  storeAppId,
  onClose,
}: ReplyComposerProps) {
  const language = useInterfaceLanguage();
  const saved = review.reply?.text ?? "";
  const [text, setText] = useReplyText(saved);
  const { save, mark, discard, post, withdraw, pending } = useReviewReply(
    appId,
    review,
  );
  const draft = useReplyDraft(appId, review, setText);
  const access = useStoreReplyAccess(store);
  const busy = pending || draft.drafting;
  const markOnce = useSharedFlight(mark);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const measure = measureReply(text, store);
  const { trimmed, over } = measure;
  const unsaved = trimmed !== "" && trimmed !== saved;
  const marked = Boolean(review.reply?.repliedAt);
  const consoleName = consoleLabel(store);
  const posted = Boolean(review.reply?.post);
  const ready = access.kind === "ready";
  const actions = composerActions(access, store, review.reply, trimmed);
  const unusable = over || trimmed === "" || draft.drafting;

  const saveIfChanged = () =>
    unsaved && !over && !draft.drafting ? save(trimmed) : Promise.resolve(null);

  const copy = async () => {
    const copied = navigator.clipboard
      ? navigator.clipboard.writeText(trimmed)
      : Promise.reject(new Error("clipboard unavailable"));
    void saveIfChanged().catch(() => null);
    try {
      await copied;
      toast.success(
        language === "zh-CN"
          ? `回复已复制，请粘贴到 ${consoleName}。`
          : `Reply copied. Paste it in ${consoleName}.`,
      );
    } catch {
      toast.error(
        language === "zh-CN"
          ? "无法复制，请选中文本后手动复制。"
          : "Couldn't copy — select and copy it manually",
      );
    }
  };

  const { publish, retract } = useStorePosting({
    store,
    saveIfChanged,
    post,
    withdraw,
  });

  return (
    <section
      aria-label={language === "zh-CN" ? "回复评论" : "Reply to review"}
      className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-3"
    >
      <StoreReplyNotice review={review} store={store} />
      <ReplyDraftControls
        review={review}
        store={store}
        busy={pending}
        draft={draft}
        text={text}
      />
      <ReplyTextField
        textRef={textRef}
        text={text}
        saved={saved}
        measure={measure}
        store={store}
        drafting={draft.drafting}
        onChange={setText}
        onBlur={() => void saveIfChanged().catch(() => null)}
      />
      <div className="flex flex-wrap items-center gap-2">
        {actions.post ? (
          <PostReplyDialog
            store={store}
            text={trimmed}
            label={actions.post}
            disabled={unusable}
            busy={busy}
            textRef={textRef}
            onPost={publish}
          />
        ) : null}
        <Button
          size="sm"
          variant={ready ? "outline" : "default"}
          disabled={unusable}
          onClick={() => void copy()}
        >
          <Copy />
          {language === "zh-CN" ? "复制" : "Copy"}
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a
            href={consoleHref(store, storeAppId)}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink />
            {language === "zh-CN"
              ? `打开 ${consoleName}`
              : `Open ${consoleName}`}
          </a>
        </Button>
        {actions.mark ? (
          <Button
            variant={ready ? "secondary" : "outline"}
            size="sm"
            disabled={over && !marked}
            aria-disabled={busy || undefined}
            onClick={() => {
              if (busy) return;
              void markOnce(markBody(marked, unsaved, trimmed)).catch(
                () => null,
              );
            }}
          >
            {interfaceCopy(language, markLabel(marked, ready))}
          </Button>
        ) : null}
        {actions.withdraw ? (
          <WithdrawReplyButton
            busy={busy}
            textRef={textRef}
            onWithdraw={retract}
          />
        ) : null}
        {actions.discard ? (
          <DiscardReplyButton
            notice={discardNotice(store, review.reply)}
            disabled={busy || (!review.reply && text === "")}
            textRef={textRef}
            onDiscard={() =>
              void discard()
                .then(() => setText(""))
                .catch(() => null)
            }
          />
        ) : null}
        <Button variant="ghost" size="sm" className="ml-auto" onClick={onClose}>
          {language === "zh-CN" ? "关闭" : "Close"}
        </Button>
      </div>
      <ReplyFooter access={access} store={store} posted={posted} />
    </section>
  );
}
