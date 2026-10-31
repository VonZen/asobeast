"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import {
  ACTIVATION_WINDOW_DAYS,
  PLANS,
  type AdminActivation,
  type AdminOverview as Overview,
} from "@asobeast/shared";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InfoTip } from "@/components/ui/info-tip";
import { StatTile, StatTileGroup } from "@/components/ui/stat-tile";
import { formatNumber, pluralize, storeLabel } from "@/lib/format";
import { adminOverviewOptions } from "@/lib/queries";
import { SignupsChart } from "./SignupsChart";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";

const joinParts = (parts: (string | null)[]) =>
  parts.filter(Boolean).join(" · ") || undefined;

const countedPart = (count: number, label: string) =>
  count > 0 ? `${formatNumber(count)} ${label}` : null;

const ACTIVATION_GUIDE =
  "https://docs.asobeast.com/security/admin-surfaces#activation";

function ActivationTile({ activation }: { activation: AdminActivation }) {
  const zh = useInterfaceLanguage() === "zh-CN";
  return (
    <StatTile
      label={zh ? "激活情况" : "Activation"}
      value={zh ? `${formatNumber(activation.rankedWithinADay)} / ${formatNumber(activation.importedLast30Days)}` : `${formatNumber(activation.rankedWithinADay)} of ${formatNumber(activation.importedLast30Days)}`}
      note={zh ? `导入后一天内获得排名 · ${formatNumber(activation.completedSetup)} 个已完成设置` : `ranked within a day of import · ${formatNumber(activation.completedSetup)} completed setup`}
      info={
        <InfoTip
          label={zh ? "激活情况说明" : "What activation means"}
          title={zh ? "激活情况" : "Activation"}
          summary={zh ? `最近 ${ACTIVATION_WINDOW_DAYS} 天导入的 App 中，有多少在导入后 24 小时内至少有一个关键词获得排名。这是引导设置所关注的首次产生价值时间。` : `Of the apps imported in the last ${ACTIVATION_WINDOW_DAYS} days, how many had a position for one of their keywords within 24 hours of the import, which is the time to value the guided setup is built for.`}
        >
          <a
            href={ACTIVATION_GUIDE}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-foreground underline decoration-primary underline-offset-4 hover:decoration-2"
          >
            {zh ? "查看激活统计方式" : "Read how activation is counted"}
          </a>
        </InfoTip>
      }
    />
  );
}

function OverviewTiles({ overview }: { overview: Overview }) {
  const { workspaces, users, apps, keywords } = overview;
  const zh = useInterfaceLanguage() === "zh-CN";
  return (
    <StatTileGroup>
      <StatTile
        label={zh ? "工作区" : "Workspaces"}
        value={formatNumber(workspaces.total)}
        note={joinParts([
          countedPart(workspaces.suspended, zh ? "已停用" : "suspended"),
          countedPart(workspaces.pendingDeletion, zh ? "待删除" : "pending deletion"),
        ])}
      />
      <StatTile
        label={zh ? "用户" : "Users"}
        value={formatNumber(users.total)}
        note={joinParts([
          `${formatNumber(users.emailVerified)} ${zh ? "已验证" : "confirmed"}`,
          `${formatNumber(users.joinedLast7Days)} ${zh ? "本周加入" : "joined this week"}`,
        ])}
      />
      <StatTile
        label={zh ? "跟踪的 App" : "Tracked apps"}
        value={formatNumber(apps.tracked)}
        note={zh ? `${formatNumber(apps.competitors)} 个竞品` : pluralize(apps.competitors, "competitor")}
      />
      <StatTile
        label={zh ? "关键词市场" : "Keyword markets"}
        value={formatNumber(keywords.trackedMarkets)}
        note={zh ? `覆盖 ${formatNumber(keywords.storefronts)} 个商店市场` : `tracked across ${pluralize(keywords.storefronts, "storefront")}`}
      />
      <StatTile
        label={zh ? "已搜索关键词" : "Searched keywords"}
        value={formatNumber(keywords.searched)}
        note={zh ? "每个关键词每天搜索一次" : "one store search each per day"}
      />
      <StatTile
        label={zh ? "本月 AI 调用次数" : "AI calls this month"}
        value={formatNumber(overview.aiCallsThisMonth)}
      />
      {overview.activation ? (
        <ActivationTile activation={overview.activation} />
      ) : null}
    </StatTileGroup>
  );
}

function CountList({
  rows,
}: {
  rows: { key: string; label: string; count: number }[];
}) {
  return (
    <dl className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-2 text-sm">
      {rows.map((row) => (
        <div key={row.key} className="contents">
          <dt className="text-muted-foreground">{row.label}</dt>
          <dd className="numeric text-right font-mono">
            {formatNumber(row.count)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function AdminOverview() {
  const { data: overview } = useSuspenseQuery(adminOverviewOptions);
  const zh = useInterfaceLanguage() === "zh-CN";

  return (
    <div className="flex flex-col gap-6">
      <OverviewTiles overview={overview} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
        <Card>
          <CardHeader>
            <CardTitle asChild>
              <h2>{zh ? "最近 30 天注册情况" : "Sign ups, last 30 days"}</h2>
            </CardTitle>
            <CardDescription>
              {zh ? `最近 30 天新增 ${formatNumber(overview.users.joinedLast30Days)} 个账号。` : `${pluralize(overview.users.joinedLast30Days, "account")} joined in the last 30 days.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignupsChart signups={overview.signups} />
          </CardContent>
        </Card>
        <div className="flex flex-col gap-6">
          {overview.billing ? (
            <Card>
              <CardHeader>
                <CardTitle asChild>
                  <h2>{zh ? "套餐分布" : "Plans"}</h2>
                </CardTitle>
                <CardDescription>
                  {zh ? "各工作区当前使用的套餐。" : "The plan each workspace is on right now."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CountList
                  rows={overview.workspaces.byPlan.map(({ key, count }) => ({
                    key,
                    label: PLANS[key].displayName,
                    count,
                  }))}
                />
              </CardContent>
            </Card>
          ) : null}
          <Card>
            <CardHeader>
              <CardTitle asChild>
                <h2>{zh ? "按商店统计 App" : "Apps by store"}</h2>
              </CardTitle>
              <CardDescription>
                {zh ? "仅统计跟踪的 App，不含竞品。" : "Tracked apps, competitors aside."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CountList
                rows={overview.apps.byStore.map(({ key, count }) => ({
                  key,
                  label: storeLabel(key),
                  count,
                }))}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
