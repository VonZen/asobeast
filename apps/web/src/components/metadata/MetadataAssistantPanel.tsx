"use client";

import { LocalizedText } from "@/components/layout/LocalizedText";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { componentCopy } from "@/lib/component-copy";

import { Suspense, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy, Loader2, Sparkles } from "lucide-react";
import { useQueryState } from "nuqs";
import { toast } from "@/lib/localized-toast";
import {
  APP_STORE_LOCALIZATIONS,
  type MetadataDraft,
  type MetadataField,
  type Store,
} from "@asobeast/shared";
import {
  AiCallsLeft,
  useAiAllowanceSpent,
  useAiFailureToast,
} from "@/components/ai/ai-allowance";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { generateMetadataDrafts } from "@/lib/api";
import { invalidateAiUsage } from "@/lib/queries";
import { METADATA_FIELD_LABELS } from "@/lib/metadata-display";
import { draftLocaleParser } from "@/lib/search-params";
import { useSingleFlight } from "@/lib/single-flight";
import { DraftLocalizationSelect } from "./DraftLocalizationSelect";
import { DraftLocalizationSkeleton } from "./skeletons";
import { LintIssueRow } from "./LintIssueRow";

const STORE_FIELDS: Record<Store, MetadataField[]> = {
  APP_STORE: ["title", "subtitle", "keywordField"],
  GOOGLE_PLAY: ["title", "shortDescription", "description"],
};

function DraftCard({ draft }: { draft: MetadataDraft }) {
  const locale = useInterfaceLanguage();
  async function copy() {
    try {
      await navigator.clipboard.writeText(draft.value);
      toast.success(
        locale === "zh-CN"
          ? `已复制${componentCopy(locale, METADATA_FIELD_LABELS[draft.field])}`
          : `${METADATA_FIELD_LABELS[draft.field]} copied`,
      );
    } catch {
      toast.error(
        componentCopy(locale, "Couldn't copy — select and copy it manually"),
      );
    }
  }

  return (
    <div className="min-w-0 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="font-medium text-foreground">
          {componentCopy(locale, METADATA_FIELD_LABELS[draft.field])}
        </span>
        <span className="text-sm tabular-nums text-muted-foreground">
          {draft.chars}/{draft.limit}
        </span>
      </div>
      <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-lg border border-border bg-muted p-2 font-mono text-sm text-foreground">
        {draft.value}
      </pre>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        {draft.issues.length === 0 ? (
          <Badge variant="success">{componentCopy(locale, "no issues")}</Badge>
        ) : (
          <ul className="flex min-w-0 flex-col gap-1.5">
            {draft.issues.map((issue, index) => (
              <LintIssueRow key={`${issue.rule}-${index}`} issue={issue} />
            ))}
          </ul>
        )}
        <Button
          variant="outline"
          aria-label={`Copy ${METADATA_FIELD_LABELS[draft.field]} draft`}
          onClick={copy}
        >
          <Copy />
          <LocalizedText en="Copy" />
        </Button>
      </div>
      {draft.rationale ? (
        <p className="mt-2 text-xs text-muted-foreground">{draft.rationale}</p>
      ) : null}
    </div>
  );
}

export function MetadataAssistantPanel({
  appId,
  store,
  canLocalize,
}: {
  appId: string;
  store: Store;
  canLocalize: boolean;
}) {
  const locale = useInterfaceLanguage();
  const available = STORE_FIELDS[store];
  const [selected, setSelected] = useState<MetadataField[]>(available);
  const [instructions, setInstructions] = useState("");
  const [draftLocale] = useQueryState("draftLocale", draftLocaleParser);
  const queryClient = useQueryClient();
  const spent = useAiAllowanceSpent();
  const failAi = useAiFailureToast();

  const mutation = useMutation({
    mutationKey: ["metadata-assistant", appId],
    mutationFn: () =>
      generateMetadataDrafts(appId, {
        fields: selected,
        instructions: instructions.trim() || undefined,
        localization: canLocalize ? (draftLocale ?? undefined) : undefined,
      }),
    onError: (error) =>
      failAi(error, componentCopy(locale, "Draft generation failed")),
    onSettled: () => invalidateAiUsage(queryClient),
  });
  const draftOnce = useSingleFlight(mutation);

  const drafts = mutation.data?.drafts ?? [];
  const drafted = mutation.data?.localization ?? null;

  function toggle(field: MetadataField, checked: boolean) {
    setSelected((current) =>
      checked ? [...current, field] : current.filter((item) => item !== field),
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-medium">
        <LocalizedText en="AI drafts" />
      </h2>
      <Card>
        <CardContent className="flex flex-col gap-4">
          {canLocalize ? (
            <Suspense fallback={<DraftLocalizationSkeleton />}>
              <DraftLocalizationSelect appId={appId} />
            </Suspense>
          ) : null}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="assistant-instructions"
              className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              <LocalizedText en="Instructions (optional)" />
            </label>
            <textarea
              id="assistant-instructions"
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              maxLength={500}
              rows={2}
              placeholder={componentCopy(
                locale,
                "Steer tone or angle — e.g. emphasise sleep tracking.",
              )}
              className="w-full resize-y rounded-lg border border-border bg-muted p-2 text-sm text-foreground"
            />
          </div>
          <div className="flex flex-wrap gap-4">
            {available.map((field) => (
              <label
                key={field}
                className="flex items-center gap-2 text-sm text-foreground"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(field)}
                  onChange={(event) => toggle(field, event.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                {componentCopy(locale, METADATA_FIELD_LABELS[field])}
              </label>
            ))}
          </div>
          <div className="flex flex-col items-start gap-1.5">
            <Button
              onClick={() => draftOnce()}
              disabled={mutation.isPending || selected.length === 0 || spent}
            >
              {mutation.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Sparkles />
              )}
              {componentCopy(
                locale,
                drafts.length > 0 ? "Regenerate" : "Generate drafts",
              )}
            </Button>
            <AiCallsLeft />
          </div>
        </CardContent>
      </Card>
      {drafted ? (
        <p className="text-sm text-muted-foreground">
          {locale === "zh-CN"
            ? `已按${APP_STORE_LOCALIZATIONS[drafted]}生成草稿`
            : `Drafted in ${APP_STORE_LOCALIZATIONS[drafted]}`}
        </p>
      ) : null}
      {drafts.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 @2xl/metadata:grid-cols-2">
          {drafts.map((draft) => (
            <DraftCard key={draft.field} draft={draft} />
          ))}
        </div>
      ) : null}
      <p className="text-xs text-muted-foreground">
        {componentCopy(
          locale,
          "Drafts are suggestions — AsoBeast never writes to the store.",
        )}
      </p>
    </section>
  );
}
