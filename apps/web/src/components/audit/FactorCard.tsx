"use client";

import { useId, useState } from "react";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { interfaceCopy } from "@/lib/interface-copy";
import Link from "next/link";
import type { AuditFactorResult, Store } from "@asobeast/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Meter } from "@/components/ui/meter";
import {
  availabilityLabel,
  percent,
  scoreStatus,
  STATUS_LABEL,
} from "./audit-copy";
import { unlockHref } from "./audit-links";
import { FactorChecks } from "./FactorChecks";
import { STATUS_ICON } from "./status-icons";

export function FactorCard({
  appId,
  factor,
  store,
  totalWeight,
}: {
  appId: string;
  factor: AuditFactorResult;
  store: Store;
  totalWeight: number;
}) {
  const language = useInterfaceLanguage();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const status = scoreStatus(factor.score);
  const Icon = STATUS_ICON[status];
  const scored = factor.checks.filter((check) => check.score !== null).length;
  const firstIssue = factor.checks.find(
    (check) => check.status === "warn" || check.status === "fail",
  );
  const waiting = factor.availability === "awaiting-input";
  const unlock = factor.checks.find((check) => check.unlock)?.unlock ?? null;

  return (
    <article aria-label={interfaceCopy(language, factor.label)}>
      <Card>
        <CardContent className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-body font-medium">
              {interfaceCopy(language, factor.label)}
            </h3>
            <span className="numeric font-mono text-body font-semibold">
              {factor.score === null ? "—" : factor.score}
            </span>
          </div>
          <Meter
            value={factor.score ?? 0}
            max={10}
            tone="health"
            className="w-full"
          />
          <span className="flex items-center gap-2 text-sm">
            <Icon aria-hidden className="size-4" />
            {interfaceCopy(language, STATUS_LABEL[status])}
          </span>
          {waiting && unlock ? (
            <Link
              href={unlockHref(appId, unlock.kind)}
              className="w-fit text-sm font-medium underline-offset-4 hover:underline"
            >
              {unlock.label}
            </Link>
          ) : (
            <>
              <span className="text-sm text-muted-foreground">
                {language === "zh-CN"
                  ? `${factor.checks.length} 项检查中已有 ${scored} 项评分`
                  : `${scored} of ${factor.checks.length} checks scored`}
                {factor.confidence !== undefined && factor.confidence < 1
                  ? language === "zh-CN"
                    ? ` · 已衡量 ${percent(factor.confidence)}%`
                    : ` · ${percent(factor.confidence)}% measured`
                  : ""}
              </span>
              {availabilityLabel(factor.availability, store) ? (
                <span className="text-sm text-muted-foreground">
                  {availabilityLabel(factor.availability, store)}
                </span>
              ) : null}
              {firstIssue ? (
                <span className="text-sm text-muted-foreground">
                  {language === "zh-CN" ? "首个问题：" : "First issue: "}
                  {interfaceCopy(language, firstIssue.label)},{" "}
                  {firstIssue.detail}
                </span>
              ) : null}
              <button
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpen(!open)}
                className="w-fit text-sm font-medium underline-offset-4 hover:underline"
              >
                {language === "zh-CN"
                  ? open
                    ? "隐藏检查项"
                    : "显示检查项"
                  : open
                    ? "Hide checks"
                    : "Show checks"}
              </button>
              {open ? (
                <div id={panelId} className="flex flex-col gap-3">
                  <span className="text-caption text-muted-foreground">
                    {language === "zh-CN"
                      ? `占 ${totalWeight} 分中的 ${factor.weight} 分`
                      : `Worth ${factor.weight} points of ${totalWeight}`}
                  </span>
                  <FactorChecks appId={appId} checks={factor.checks} />
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </article>
  );
}
