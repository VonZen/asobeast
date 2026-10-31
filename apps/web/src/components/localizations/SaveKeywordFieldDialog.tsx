"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { Gauge, Loader2, TriangleAlert } from "lucide-react";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { UPGRADE_PATH, type KeywordFieldSavePreview } from "@asobeast/shared";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  addedSentence,
  droppedSentence,
  saveCostText,
  saveQuotaNotice,
  selectedCost,
} from "@/lib/app-localizations";
import { formatCountry, formatList, formatNumber } from "@/lib/format";
import { localizationName } from "@/lib/localizations";
import { ReadRoleBadge } from "./ReadRoleBadge";

export function SaveKeywordFieldDialog({
  preview,
  pending,
  error,
  onConfirm,
  onClose,
  returnFocus,
}: {
  preview: KeywordFieldSavePreview;
  pending: boolean;
  error: string | null;
  onConfirm: (trackIn: string[]) => void;
  onClose: () => void;
  returnFocus: () => void;
}) {
  const zh = useInterfaceLanguage() === "zh-CN";
  const groupId = useId();
  const name = localizationName(preview.localization);
  const [trackIn, setTrackIn] = useState<string[]>(() =>
    preview.markets.map((market) => market.country),
  );
  const cost = selectedCost(preview, trackIn);
  const quota = saveQuotaNotice(preview.quota, cost);
  const added = addedSentence(preview);
  const dropped = droppedSentence(preview);

  function toggle(country: string, checked: boolean) {
    setTrackIn((current) =>
      checked
        ? [...current, country]
        : current.filter((entry) => entry !== country),
    );
  }

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next && !pending) onClose();
      }}
    >
      <DialogContent
        size="md"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocus();
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {zh ? `保存${name}关键词字段` : `Save the ${name} keyword field`}
          </DialogTitle>
          <DialogDescription>
            {zh
              ? "选择需要跟踪这些词组的市场。无论是否选择跟踪，对应市场仍会读取该关键词字段。"
              : "Choose the markets that should track its phrases. Every market on its list reads the field either way."}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="gap-4">
          {added ? (
            <p className="text-body text-foreground">
              {zh
                ? `新增 ${preview.added.length} 个词组：${preview.added.join(", ")}`
                : added}
            </p>
          ) : null}
          {dropped ? (
            <p className="text-body text-muted-foreground">
              {zh
                ? `${preview.dropped.length} 个词组将从字段中移除${preview.markets.length > 0 ? `，并停止在${formatList(preview.markets.map((m) => formatCountry(m.country)))}作为关键词字段词组跟踪` : ""}。`
                : dropped}
            </p>
          ) : null}
          <fieldset className="flex flex-col gap-2">
            <legend className="sr-only">
              {zh ? "跟踪这些词组的市场" : "Markets that track the phrases"}
            </legend>
            {preview.markets.map((market) => {
              const checkboxId = `${groupId}-${market.country}`;
              return (
                <div
                  key={market.country}
                  className="flex flex-wrap items-center gap-2"
                >
                  <Checkbox
                    id={checkboxId}
                    checked={trackIn.includes(market.country)}
                    disabled={pending}
                    onCheckedChange={(checked) =>
                      toggle(market.country, checked === true)
                    }
                  />
                  <Label htmlFor={checkboxId}>
                    {formatCountry(market.country)}
                  </Label>
                  <ReadRoleBadge role={market.role} />
                  {market.newPhrases.length > 0 ? (
                    <span className="text-caption text-muted-foreground">
                      {zh
                        ? `${market.newPhrases.length} 个新增`
                        : `${market.newPhrases.length} new`}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </fieldset>
          <Alert role="note">
            <Gauge aria-hidden />
            <AlertDescription>
              {zh
                ? cost.keywordMarkets === 0
                  ? "不会新增跟踪市场。"
                  : `新增 ${cost.keywordMarkets} 个关键词市场，每天约增加 ${cost.dailyRequests} 次商店请求。`
                : saveCostText(cost)}
            </AlertDescription>
          </Alert>
          {quota ? (
            <Alert role="note" variant={quota.over ? "warning" : "default"}>
              {quota.over ? <TriangleAlert aria-hidden /> : null}
              <AlertDescription>
                {zh && preview.quota?.limit != null
                  ? preview.quota.limit === 0
                    ? "当前套餐不包含关键词市场。"
                    : `保存后已使用 ${formatNumber(preview.quota.used + cost.keywordMarkets)} / ${formatNumber(preview.quota.limit)} 个关键词市场。`
                  : quota.text}
                {quota.upgrade ? (
                  <>
                    {" "}
                    <Button asChild variant="link" className="h-auto p-0">
                      <Link href={UPGRADE_PATH}>
                        {zh ? "查看套餐" : "See plans"}
                      </Link>
                    </Button>
                  </>
                ) : null}
              </AlertDescription>
            </Alert>
          ) : null}
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" disabled={pending} onClick={onClose}>
            {zh ? "取消" : "Cancel"}
          </Button>
          <Button
            disabled={pending || quota?.over === true}
            onClick={() => onConfirm(trackIn)}
          >
            {pending ? <Loader2 className="animate-spin" /> : null}
            {pending
              ? zh
                ? "正在保存…"
                : "Saving…"
              : trackIn.length === 0
                ? zh
                  ? "保存"
                  : "Save"
                : zh
                  ? "保存并跟踪"
                  : "Save and track"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
