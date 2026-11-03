"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { getOnlineKeywordFields } from "@/lib/api";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import {
  KEYWORD_FIELD_CHAR_LIMIT,
  type AppLocalizationItem,
} from "@asobeast/shared";
import { Button } from "@/components/ui/button";
import { Meter } from "@/components/ui/meter";
import { Textarea } from "@/components/ui/textarea";
import {
  keywordFieldDraft,
  readingStorefrontNames,
  type KeywordFieldDraft,
} from "@/lib/app-localizations";
import { formatList } from "@/lib/format";
import { localizationName } from "@/lib/localizations";
import { cn } from "@/lib/utils";
import { SaveKeywordFieldDialog } from "./SaveKeywordFieldDialog";
import { useKeywordFieldSave } from "./useKeywordFieldSave";

function KeywordFieldUsage({
  field,
  countId,
}: {
  field: KeywordFieldDraft;
  countId: string;
}) {
  const over = field.over > 0;
  const zh = useInterfaceLanguage() === "zh-CN";
  return (
    <>
      <Meter
        value={Math.min(field.used, KEYWORD_FIELD_CHAR_LIMIT)}
        max={KEYWORD_FIELD_CHAR_LIMIT}
        tone="health"
        fill={over ? "bg-destructive" : undefined}
      />
      <div className="flex items-center justify-between gap-3 text-caption">
        <span className="text-muted-foreground">
          {zh ? "用英文逗号分隔关键词。" : "Separate keywords with commas."}
        </span>
        <span
          id={countId}
          aria-live="polite"
          className={cn(
            "numeric font-mono",
            over ? "font-medium text-signal-down" : "text-muted-foreground",
          )}
        >
          {field.used}/{KEYWORD_FIELD_CHAR_LIMIT}
          {over
            ? zh
              ? ` · 超出 ${field.over} 个字符`
              : ` · ${field.over} over the limit`
            : ""}
        </span>
      </div>
      {field.storedAs === null ? null : (
        <p className="text-caption text-muted-foreground">
          {zh ? "实际保存为" : "Stored as"}{" "}
          <span className="font-mono break-all">{field.storedAs}</span>
        </p>
      )}
    </>
  );
}

export function KeywordFieldEditor({
  id,
  item,
  leading,
}: {
  id: string;
  item: AppLocalizationItem;
  leading?: ReactNode;
}) {
  const zh = useInterfaceLanguage() === "zh-CN";
  const countId = useId();
  const editor = useRef<HTMLTextAreaElement>(null);
  const saveButton = useRef<HTMLButtonElement>(null);
  const name = localizationName(item.localization);
  const [draft, setDraft] = useState<string | null>(null);
  // A localization with no saved field starts from what App Store Connect holds.
  const online = useQuery({
    queryKey: ["online-keyword-fields", id],
    queryFn: () => getOnlineKeywordFields(id),
    staleTime: 5 * 60_000,
    retry: false,
  });
  const onlineText =
    item.phrases.length === 0
      ? (online.data?.items[item.localization] ?? "")
      : "";
  const text = draft ?? (item.phrases.join(",") || onlineText);
  const prefilled = draft === null && onlineText !== "";
  const field = keywordFieldDraft(text, item.phrases);
  const over = field.over > 0;
  const {
    checking,
    saving,
    review,
    error,
    clearError,
    request,
    confirm,
    dismiss,
  } = useKeywordFieldSave(id, item, () => setDraft(null));
  const busy = checking || saving;

  return (
    <div className="flex flex-col gap-3">
      <Textarea
        ref={editor}
        value={text}
        onChange={(event) => {
          setDraft(event.target.value);
          clearError();
        }}
        readOnly={busy}
        rows={3}
        spellCheck={false}
        aria-label={zh ? `${name}关键词字段` : `${name} keyword field`}
        aria-describedby={countId}
        aria-invalid={over}
        placeholder={
          zh
            ? "该语言还没有关键词字段"
            : "No keyword field for this localization yet"
        }
      />
      {prefilled ? (
        <p className="text-caption text-muted-foreground">
          {zh
            ? "已从 App Store Connect 读取线上的关键词。保存后才会记入 asobeast。"
            : "Read from App Store Connect. It is only recorded in asobeast once you save."}
        </p>
      ) : null}
      <KeywordFieldUsage field={field} countId={countId} />
      {item.readBy.length === 0 ? (
        <p className="text-caption text-muted-foreground">
          {zh
            ? `当前市场均不读取${name}。读取该语言的市场包括：${formatList(readingStorefrontNames(item.localization))}。可以添加其中一个作为关键词市场，以跟踪这些词组。`
            : `None of your markets reads ${name}. Storefronts that read it: ${formatList(readingStorefrontNames(item.localization))}. Add one of them as a keyword market to track these phrases there.`}
        </p>
      ) : null}
      {error && review === null ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>{leading}</div>
        <Button
          ref={saveButton}
          disabled={
            busy || over || (!field.changed && field.phrases.length === 0)
          }
          onClick={() => request(text)}
        >
          {busy ? <Loader2 className="animate-spin" /> : null}
          {busy
            ? zh
              ? "正在保存…"
              : "Saving…"
            : zh
              ? "保存关键词字段"
              : "Save keyword field"}
        </Button>
      </div>
      {review ? (
        <SaveKeywordFieldDialog
          preview={review}
          pending={saving}
          error={error}
          onConfirm={confirm}
          onClose={dismiss}
          returnFocus={() =>
            (saveButton.current?.disabled
              ? editor.current
              : saveButton.current
            )?.focus()
          }
        />
      ) : null}
    </div>
  );
}
