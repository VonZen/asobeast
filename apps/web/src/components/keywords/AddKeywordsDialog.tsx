"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "@/lib/localized-toast";
import {
  isStorefront,
  KEYWORD_BULK_ADD_LIMIT,
  normalizeText,
  type Store,
  type TrackedKeywordItem,
} from "@asobeast/shared";
import { CountrySelect } from "@/components/CountrySelect";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addKeywords, ApiError } from "@/lib/api";
import { appKeys, invalidateKeywordMutation } from "@/lib/queries";
import { MarketAvailabilityNotice } from "./MarketAvailabilityNotice";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";

function parseKeywords(input: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const part of input.split(/[,\n]/)) {
    const text = normalizeText(part);
    if (text && !seen.has(text)) {
      seen.add(text);
      result.push(text);
    }
  }
  return result;
}

export function AddKeywordsDialog({
  appId,
  store,
  country,
  children,
}: {
  appId: string;
  store: Store;
  country: string;
  children: ReactNode;
}) {
  const chinese = useInterfaceLanguage() === "zh-CN";
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [raw, setRaw] = useState("");
  const [market, setMarket] = useState(country);
  const [error, setError] = useState<string | null>(null);
  const chips = useMemo(() => parseKeywords(raw), [raw]);
  const validMarket = isStorefront(store, market);

  const mutation = useMutation({
    mutationFn: (list: string[]) => addKeywords(appId, list, market),
    onSuccess: (_tracked, list) => {
      const before = new Set(
        queryClient
          .getQueriesData<TrackedKeywordItem[]>({
            queryKey: appKeys.keywordsRoot(appId),
          })
          .flatMap(([, rows]) => rows?.map((row) => row.text) ?? []),
      );
      const added = list.filter((text) => !before.has(text)).length;
      const duplicates = list.length - added;
      invalidateKeywordMutation(queryClient, appId);
      setOpen(false);
      toast.success(
        chinese
          ? `正在跟踪 ${added} 个关键词`
          : `Tracking ${added} keyword${added === 1 ? "" : "s"}`,
        {
          description:
            duplicates > 0
              ? chinese
                ? `${duplicates} 个关键词已在跟踪中`
                : `${duplicates} already tracked`
              : chinese
                ? "排名将在几分钟内陆续显示，表格会自动更新。"
                : "Positions arrive within minutes. The table updates as they land.",
        },
      );
    },
    onError: (err) =>
      setError(
        err instanceof ApiError
          ? err.envelope.message
          : chinese
            ? "无法添加关键词"
            : "Could not add keywords",
      ),
  });

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setMarket(country);
    } else {
      setRaw("");
      setError(null);
      mutation.reset();
    }
  }

  function submit() {
    setError(null);
    if (chips.length > KEYWORD_BULK_ADD_LIMIT) {
      setError(
        chinese
          ? `单次最多添加 ${KEYWORD_BULK_ADD_LIMIT} 个关键词，请将这 ${chips.length} 个关键词分批添加。`
          : `One request may add ${KEYWORD_BULK_ADD_LIMIT} keywords, so split these ${chips.length}`,
      );
      return;
    }
    mutation.mutate(chips);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{chinese ? "添加关键词" : "Add keywords"}</DialogTitle>
          <DialogDescription>
            {chinese
              ? "使用逗号或换行分隔关键词。跟踪前会统一转换为小写并去重。"
              : "Separate phrases with commas or new lines. Each is normalized to lowercase and de-duplicated before tracking."}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="add-keywords-market">
              {chinese ? "市场" : "Market"}
            </Label>
            <CountrySelect
              id="add-keywords-market"
              store={store}
              value={market}
              onChange={setMarket}
              ariaLabel={chinese ? "关键词市场" : "Keyword market"}
            />
            <MarketAvailabilityNotice
              appId={appId}
              store={store}
              country={market}
            />
          </div>
          <Textarea
            value={raw}
            onChange={(event) => {
              setRaw(event.target.value);
              setError(null);
            }}
            rows={4}
            spellCheck={false}
            autoComplete="off"
            placeholder="fitness tracker, workout log…"
            autoFocus
            aria-invalid={error !== null}
          />
          {chips.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {chips.map((chip) => (
                <Badge key={chip} variant="secondary">
                  {chip}
                </Badge>
              ))}
            </div>
          ) : null}
          <p className="text-xs text-muted-foreground tabular-nums">
            {chinese ? (
              `已准备 ${chips.length} / ${KEYWORD_BULK_ADD_LIMIT} 个关键词`
            ) : (
              <>
                {chips.length} of {KEYWORD_BULK_ADD_LIMIT} keyword
                {chips.length === 1 ? "" : "s"} ready
              </>
            )}
          </p>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </DialogBody>

        <DialogFooter>
          <Button
            disabled={mutation.isPending || chips.length === 0 || !validMarket}
            onClick={submit}
          >
            {mutation.isPending ? <Loader2 className="animate-spin" /> : null}
            {mutation.isPending
              ? chinese
                ? "正在添加…"
                : "Adding…"
              : chinese
                ? "添加关键词"
                : "Add keywords"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
