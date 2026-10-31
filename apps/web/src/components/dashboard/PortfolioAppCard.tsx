import Link from "next/link";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import type { PortfolioApp, PortfolioAppInsight } from "@asobeast/shared";
import { RankBandBar } from "@/components/charts/RankBandBar";
import { AppIcon } from "@/components/AppIcon";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TrendChip } from "@/components/ui/delta-chip";
import {
  formatCountry,
  formatDate,
  formatNumber,
  pluralize,
  storeLabel,
} from "@/lib/format";
import { AppCardLink } from "@/components/apps/AppCardLink";
import { DelistedBadge } from "@/components/apps/DelistedBadge";
import { DeleteAppMenu } from "@/components/apps/DeleteAppMenu";
import { AppFacts } from "./AppFacts";
import { setupChipText } from "./setup-chip";
import { Sparkline } from "./Sparkline";

export function AppStats({ app }: { app: PortfolioApp }) {
  const language = useInterfaceLanguage();
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-muted-foreground">
      <span>
        {language === "zh-CN"
          ? `${app.trackedKeywords} 个关键词`
          : pluralize(app.trackedKeywords, "keyword")}
      </span>
      <span>
        {language === "zh-CN"
          ? `${app.competitors} 个竞品`
          : pluralize(app.competitors, "competitor")}
      </span>
      <span>
        {language === "zh-CN" ? "更新于 " : "Updated "}
        {formatDate(app.lastCapturedAt, language)}
      </span>
    </div>
  );
}

export function AppBadges({ app }: { app: PortfolioApp }) {
  const language = useInterfaceLanguage();
  const setup = setupChipText(app.setup);
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge variant="secondary" className="w-fit">
        {storeLabel(app.store)}
      </Badge>
      <Badge
        variant="outline"
        className="w-fit"
        title={`${language === "zh-CN" ? "主市场" : "Home storefront"} · ${formatCountry(app.country)}`}
      >
        {app.country.toUpperCase()}
      </Badge>
      {app.delistedAt ? <DelistedBadge since={app.delistedAt} /> : null}
      {setup ? (
        <Badge variant="info" asChild className="relative z-20 min-h-6 w-fit">
          <Link href={`/apps/${app.id}/setup`}>{setup}</Link>
        </Badge>
      ) : null}
    </div>
  );
}

function Top10Line({ insight }: { insight: PortfolioAppInsight }) {
  const language = useInterfaceLanguage();
  return (
    <div className="flex flex-col gap-1">
      <RankBandBar distribution={insight.rankDistribution} />
      <div className="flex flex-wrap items-center gap-2 text-caption text-muted-foreground">
        <span>
          {language === "zh-CN"
            ? `${formatNumber(insight.rankDistribution.top10)} 个进入前十`
            : `${formatNumber(insight.rankDistribution.top10)} in top 10`}
        </span>
        <TrendChip label="7d" value={insight.top10Delta7d} />
      </div>
    </div>
  );
}

const hasTrackedKeywords = (insight: PortfolioAppInsight): boolean =>
  Object.values(insight.rankDistribution).some((count) => count > 0);

export function PortfolioAppCard({
  app,
  insight,
}: {
  app: PortfolioApp;
  insight: PortfolioAppInsight | undefined;
}) {
  const language = useInterfaceLanguage();
  const name =
    app.name ?? (language === "zh-CN" ? "未命名 App" : "Untitled app");

  return (
    <Card className="@container/app-card relative h-full gap-0 p-4 transition-colors hover:bg-muted/40">
      <AppCardLink
        id={app.id}
        name={name}
        className="absolute inset-0 z-10 rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      />

      <div className="absolute top-2 right-2 z-20">
        <DeleteAppMenu id={app.id} name={name} />
      </div>

      <div className="flex flex-1 flex-col gap-3">
        <div className="flex items-start gap-4">
          <AppIcon src={app.iconUrl} name={app.name} />
          <div className="flex min-w-0 flex-1 flex-col gap-1 pr-6">
            <span title={name} className="truncate font-medium">
              {name}
            </span>
            <AppBadges app={app} />
          </div>
        </div>

        {app.lastCapturedAt === null ? (
          <p className="text-body text-muted-foreground">
            {language === "zh-CN"
              ? "正在采集首批排名，可见度将在一小时内显示。"
              : "Collecting the first positions. Visibility appears within the hour."}
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <span className="numeric font-mono text-3xl font-semibold">
                  {Math.round(app.visibility.current)}
                </span>
                <TrendChip label="7d" value={app.visibility.delta7d} />
              </div>
              <span className="text-caption text-muted-foreground">
                {language === "zh-CN" ? "可见度" : "visibility"}
              </span>
            </div>

            <Sparkline points={app.sparkline} />

            {insight && hasTrackedKeywords(insight) ? (
              <Top10Line insight={insight} />
            ) : null}
            {insight ? <AppFacts app={app} insight={insight} /> : null}
          </>
        )}

        <div data-slot="app-card-footer" className="mt-auto">
          <AppStats app={app} />
        </div>
      </div>
    </Card>
  );
}

export function PortfolioGroupMember({
  app,
  insight,
}: {
  app: PortfolioApp;
  insight: PortfolioAppInsight | undefined;
}) {
  const language = useInterfaceLanguage();
  const name =
    app.name ?? (language === "zh-CN" ? "未命名 App" : "Untitled app");

  return (
    <div className="relative flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
      <AppCardLink
        id={app.id}
        name={name}
        className="absolute inset-0 z-10 rounded-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      />

      <div className="absolute top-2 right-0 z-20">
        <DeleteAppMenu id={app.id} name={name} />
      </div>

      <div className="flex items-center gap-3 pr-6">
        <AppIcon src={app.iconUrl} name={app.name} size={36} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span title={name} className="truncate text-body font-medium">
            {name}
          </span>
          <AppBadges app={app} />
        </div>
        {app.lastCapturedAt === null ? null : (
          <div className="flex flex-col items-end gap-1">
            <span className="numeric font-mono text-2xl font-semibold">
              {Math.round(app.visibility.current)}
            </span>
            <TrendChip label="7d" value={app.visibility.delta7d} />
          </div>
        )}
      </div>

      {app.lastCapturedAt === null ? (
        <p className="text-caption text-muted-foreground">
          {language === "zh-CN"
            ? "正在采集首批排名。"
            : "Collecting the first positions."}
        </p>
      ) : (
        <>
          <Sparkline points={app.sparkline} />
          {insight ? <AppFacts app={app} insight={insight} compact /> : null}
        </>
      )}

      <AppStats app={app} />
    </div>
  );
}
