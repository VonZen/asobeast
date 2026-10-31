import Link from "next/link";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import type { UseQueryResult } from "@tanstack/react-query";
import type { ActionDetail, ActionItem } from "@asobeast/shared";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { isNotFound } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { ActionEvidencePanel } from "./ActionEvidencePanel";
import { ActionExplain } from "./ActionExplain";
import { ActionImpactMeter } from "./ActionImpactMeter";
import { ActionHistory } from "./ActionHistory";
import { ActionNote } from "./ActionNote";
import { ActionOutcome } from "./ActionOutcome";
import { ActionSteps } from "./ActionSteps";
import { ActionTrendChart } from "./ActionTrendChart";

export const ACTION_NOT_FOUND =
  "This action no longer exists. It may have been pruned after 180 days.";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-subtitle">{title}</h3>
      {children}
    </section>
  );
}

function SampleReviews({ item }: { item: ActionItem }) {
  const language = useInterfaceLanguage();
  if (item.evidence?.rule !== "reviews.investigate_theme") return null;
  return (
    <Link
      href={`/apps/${item.scope.appId}/reviews`}
      className="self-start text-sm font-medium underline-offset-4 hover:underline"
    >
      {language === "zh-CN" ? "查看示例评论" : "Read the sample reviews"}
    </Link>
  );
}

export function ActionDetailBodySkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

export function ActionDetailBody({
  detail,
  item,
}: {
  detail: UseQueryResult<ActionDetail>;
  item: ActionItem | undefined;
}) {
  const language = useInterfaceLanguage();
  if (isNotFound(detail.error)) return null;
  if (detail.error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTitle>{language === "zh-CN" ? "无法加载此事项" : "The action could not be loaded"}</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-2">
            {detail.error.message}
            <Button
              variant="outline"
              size="sm"
              onClick={() => void detail.refetch()}
            >
              {language === "zh-CN" ? "重试" : "Try again"}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  const shown = detail.data ?? item;
  if (!shown) return <ActionDetailBodySkeleton />;

  return (
    <div className="@container/sheet flex flex-col gap-6 p-4">
      <ActionImpactMeter impact={shown.impact} />
      <Section title={language === "zh-CN" ? "为什么建议这样做" : "Why this"}>
        <ActionEvidencePanel evidence={shown.evidence} />
        <SampleReviews item={shown} />
      </Section>
      <Section title={language === "zh-CN" ? "如何处理" : "How to fix"}>
        <ActionSteps item={shown} />
      </Section>
      {detail.data?.trend ? (
        <Section title={language === "zh-CN" ? "趋势" : "Trend"}>
          <ActionTrendChart trend={detail.data.trend} item={shown} />
        </Section>
      ) : null}
      {detail.data?.outcome ? (
        <Section title={language === "zh-CN" ? "结果" : "Outcome"}>
          <ActionOutcome
            outcome={detail.data.outcome}
            depth={detail.data.trend?.depth ?? null}
          />
        </Section>
      ) : null}
      {detail.data ? (
        <Section title={language === "zh-CN" ? "历史记录" : "History"}>
          <ActionHistory events={detail.data.events} />
        </Section>
      ) : null}
      <Section title={language === "zh-CN" ? "备注" : "Note"}>
        <ActionNote key={shown.id} item={shown} />
      </Section>
      <ActionExplain item={shown} />
      <p className="text-caption text-muted-foreground">
        {language === "zh-CN" ? `证据上次确认于 ${formatDate(shown.lastSeenAt, language)} · 公式 ${shown.formulaVersion}` : `Evidence last confirmed ${formatDate(shown.lastSeenAt)} · formula ${shown.formulaVersion}`}
      </p>
    </div>
  );
}
