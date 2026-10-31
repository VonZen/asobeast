import Link from "next/link";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { Star } from "lucide-react";
import type { PortfolioApp, PortfolioAppInsight } from "@asobeast/shared";
import { GradedNumber } from "@/components/ui/graded";
import { formatCompact, formatRating, pluralize } from "@/lib/format";
import { grade } from "@/lib/grade";

const FACT_LINK =
  "relative z-20 inline-flex min-h-6 items-center underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";

function RatingFact({ rating }: { rating: PortfolioAppInsight["rating"] }) {
  if (rating.average === null) return null;
  return (
    <span className="inline-flex items-center gap-1">
      <Star className="size-3.5" aria-hidden />
      <GradedNumber
        value={formatRating(rating.average)}
        grade={grade("rating", rating.average)}
        label="Rating"
      />
      {rating.count === null ? null : (
        <span>({formatCompact(rating.count)})</span>
      )}
    </span>
  );
}

function AuditFact({ audit }: { audit: PortfolioAppInsight["audit"] }) {
  const language = useInterfaceLanguage();
  if (audit?.current == null) return null;
  return (
    <span className="inline-flex items-center gap-1">
      <span aria-hidden>{language === "zh-CN" ? "审核" : "Audit"}</span>
      <GradedNumber
        value={String(audit.current)}
        grade={grade("audit", audit.current)}
        label="Audit"
      />
    </span>
  );
}

function ForApp({ app }: { app: PortfolioApp }) {
  return <span className="sr-only"> for {app.name ?? "this app"}</span>;
}

function ActionsFact({
  app,
  actions,
}: {
  app: PortfolioApp;
  actions: PortfolioAppInsight["actions"];
}) {
  const language = useInterfaceLanguage();
  if (!actions || actions.open === 0) return null;
  return (
    <Link href={`/apps/${app.id}/actions`} className={FACT_LINK}>
      {language === "zh-CN"
        ? `${actions.open} 项待处理`
        : pluralize(actions.open, "open action")}
      <ForApp app={app} />
      {actions.critical > 0 ? (
        <span className="text-priority-critical">
          {" "}
          · {actions.critical} {language === "zh-CN" ? "项紧急" : "critical"}
        </span>
      ) : null}
    </Link>
  );
}

function ReviewsFact({ app, count }: { app: PortfolioApp; count: number }) {
  const language = useInterfaceLanguage();
  if (count === 0) return null;
  return (
    <Link href={`/apps/${app.id}/reviews`} className={FACT_LINK}>
      {language === "zh-CN"
        ? `${count} 条新低评分`
        : pluralize(count, "new low rating")}
      <ForApp app={app} />
    </Link>
  );
}

export function AppFacts({
  app,
  insight,
  compact = false,
}: {
  app: PortfolioApp;
  insight: PortfolioAppInsight;
  compact?: boolean;
}) {
  return (
    <div
      data-slot="app-facts"
      className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-muted-foreground empty:hidden"
    >
      <RatingFact rating={insight.rating} />
      {compact ? null : <AuditFact audit={insight.audit} />}
      <ActionsFact app={app} actions={insight.actions} />
      {compact ? null : (
        <ReviewsFact app={app} count={insight.negativeReviews7d} />
      )}
    </div>
  );
}
