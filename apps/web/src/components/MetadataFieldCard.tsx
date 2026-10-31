"use client";

import { useId, useState } from "react";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { interfaceCopy } from "@/lib/interface-copy";
import {
  countChars,
  type LintIssue,
  type MetadataField,
} from "@asobeast/shared";
import { LintIssueRow } from "@/components/metadata/LintIssueRow";
import { Meter } from "@/components/ui/meter";
import { Textarea } from "@/components/ui/textarea";
import { METADATA_FIELD_LABELS } from "@/lib/metadata-display";
import { cn } from "@/lib/utils";

export function MetadataFieldCard({
  field,
  value,
  limit,
  issues,
}: {
  field: MetadataField;
  value: string;
  limit: number;
  issues: LintIssue[];
}) {
  const language = useInterfaceLanguage();
  const countId = useId();
  const [draft, setDraft] = useState(value);
  const used = countChars(draft);
  const over = used > limit;
  const label = interfaceCopy(language, METADATA_FIELD_LABELS[field]);

  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="font-medium text-foreground">{label}</span>
        <span
          id={countId}
          aria-live="polite"
          className={cn(
            "numeric font-mono text-body",
            over ? "font-semibold text-signal-down" : "text-muted-foreground",
          )}
        >
          {used}/{limit}
          {over
            ? language === "zh-CN"
              ? ` · 超出 ${used - limit}`
              : ` · ${used - limit} over`
            : ""}
        </span>
      </div>

      <Meter
        value={Math.min(used, limit)}
        max={limit}
        tone={over ? "neutral" : "score"}
        className={over ? "bg-signal-down-subtle" : undefined}
      />

      <Textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        rows={field === "description" ? 4 : 2}
        aria-label={label}
        aria-describedby={countId}
        aria-invalid={over}
        className="resize-y"
      />

      {issues.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {issues.map((issue, index) => (
            <LintIssueRow key={`${issue.rule}-${index}`} issue={issue} />
          ))}
        </ul>
      ) : (
        <p className="text-body text-success">
          {language === "zh-CN" ? "没有发现问题。" : "No issues."}
        </p>
      )}
    </div>
  );
}
