"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { Store, StoreFunnelReport } from "@asobeast/shared";
import { useKeywordScope } from "@/components/app-detail/use-market";
import { useAuth } from "@/components/auth/use-auth";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendChip } from "@/components/ui/delta-chip";
import { EmptyState } from "@/components/ui/empty-state";
import { StatTile, StatTileGroup } from "@/components/ui/stat-tile";
import { formatDate } from "@/lib/format";
import {
  FUNNEL_COPY,
  type FunnelCopy,
  FUNNEL_HEADLINE_DAYS,
  FUNNEL_SERIES_DAYS,
  formatConversion,
  formatCount,
  funnelState,
  funnelTiles,
  searchShare,
  trendValue,
  windowOf,
} from "@/lib/funnel";
import { funnelOptions, storeConnectionsOptions } from "@/lib/queries";
import {
  appStateLabel,
  STORE_CONNECTIONS_PATH,
} from "@/lib/store-connection-copy";
import { FunnelHelp } from "./FunnelHelp";
import { FunnelTilesSkeleton } from "./skeletons";

const FUNNEL_COPY_ZH: Record<Store, FunnelCopy> = {
  APP_STORE: {
    ...FUNNEL_COPY.APP_STORE,
    base: "曝光量",
    freshness: "Apple 的每日数据通常在三天内确定，最近几天的数据仍可能增加。",
    connectTitle: "连接 App Store Connect 后即可查看曝光量和转化率。",
    connectBody:
      "连接 App Store Connect API 密钥后，AsoBeast 可读取此 App 自 2024 年起的 Apple 官方表现数据。",
    askOwner: "请联系工作区所有者连接 App Store Connect。",
    notReporting:
      "当此 App 属于已连接密钥对应的团队，且 Apple 发布首份报告后，系统即可读取数据。",
    refusedTitle: "App Store Connect 拒绝了已连接的密钥。",
    refusedBody:
      "密钥重新获得授权后，已保存的数据会重新显示。请验证现有密钥或连接新密钥。",
    refusedAskOwner: "请联系工作区所有者，在「集成」中验证密钥。",
  },
  GOOGLE_PLAY: {
    ...FUNNEL_COPY.GOOGLE_PLAY,
    base: "商品详情页访问人数",
    freshness:
      "Google 的每日数据通常延迟 3 至 7 天发布；统计口径已于 2026 年 7 月 10 日调整。",
    connectTitle:
      "连接 Google Play Console 后即可查看商品详情页访问人数和转化率。",
    connectBody:
      "通过 Google 登录或在 Play Console 中邀请服务账号后，AsoBeast 可从每月报告文件读取 Google 官方表现数据。",
    askOwner: "请联系工作区所有者连接 Google Play Console。",
    notReporting:
      "当 Play Console 将该 App 的商店表现数据写入 Cloud Storage 后，系统即可读取。",
    refusedTitle: "Google Play Console 拒绝了当前连接。",
    refusedBody:
      "Google 重新接受连接后，已保存的数据会重新显示。请验证连接或重新授权。",
    refusedAskOwner: "请联系工作区所有者，在「集成」中验证 Google Play 连接。",
  },
};

const CONNECT_LINK =
  "text-body font-medium text-foreground underline decoration-primary underline-offset-4 hover:decoration-2";

function NotReporting({ store, reason }: { store: Store; reason: string }) {
  const zh = useInterfaceLanguage() === "zh-CN";
  const copy = (zh ? FUNNEL_COPY_ZH : FUNNEL_COPY)[store];
  return (
    <EmptyState
      title={
        zh
          ? `${copy.console} 尚未提供此 App 的数据：${reason}。`
          : `${copy.console} reports nothing for this app yet: ${reason}.`
      }
      body={copy.notReporting}
    />
  );
}

function ConnectionRefused({ store }: { store: Store }) {
  const zh = useInterfaceLanguage() === "zh-CN";
  const { isOwner } = useAuth();
  const copy = (zh ? FUNNEL_COPY_ZH : FUNNEL_COPY)[store];
  return (
    <EmptyState
      title={copy.refusedTitle}
      body={isOwner ? copy.refusedBody : copy.refusedAskOwner}
      action={
        isOwner ? (
          <Link href={STORE_CONNECTIONS_PATH} className={CONNECT_LINK}>
            {zh ? "前往集成页面验证" : "Verify in Integrations"}
          </Link>
        ) : null
      }
    />
  );
}

function NotConnected({ id, store }: { id: string; store: Store }) {
  const zh = useInterfaceLanguage() === "zh-CN";
  const { isOwner } = useAuth();
  const copy = (zh ? FUNNEL_COPY_ZH : FUNNEL_COPY)[store];
  const { data: connections } = useSuspenseQuery(storeConnectionsOptions);
  const connection = connections.connections.find(
    (item) => item.store === store,
  );
  if (connection?.status === "rejected")
    return <ConnectionRefused store={store} />;
  if (connection) {
    const app = connection.apps.find((item) => item.appId === id);
    return (
      <NotReporting
        store={store}
        reason={appStateLabel(app?.state ?? null, store)}
      />
    );
  }
  return (
    <EmptyState
      title={copy.connectTitle}
      body={isOwner ? copy.connectBody : copy.askOwner}
      action={
        isOwner ? (
          <Link href={STORE_CONNECTIONS_PATH} className={CONNECT_LINK}>
            {zh ? "前往集成页面连接" : "Connect in Integrations"}
          </Link>
        ) : null
      }
    />
  );
}

function FunnelTiles({ report }: { report: StoreFunnelReport }) {
  const zh = useInterfaceLanguage() === "zh-CN";
  const headline = windowOf(report, FUNNEL_HEADLINE_DAYS);
  const week = windowOf(report, 7);
  const share = searchShare(report, headline);
  const settled = headline?.status === "measured";
  const copy = (zh ? FUNNEL_COPY_ZH : FUNNEL_COPY)[report.store];

  return (
    <div className="flex flex-col gap-3">
      <StatTileGroup>
        {funnelTiles(report).map((tile) => (
          <StatTile
            key={tile.label}
            label={
              zh
                ? ((
                    {
                      Impressions: "曝光量",
                      "Product page views": "产品页面浏览量",
                      "Get taps": "获取点击量",
                      "Store listing visitors": "商品详情页访问人数",
                      Acquisitions: "获客量",
                      Conversion: "转化率",
                    } as Record<string, string>
                  )[tile.label] ?? tile.label)
                : tile.label
            }
            value={
              tile.metric === "conversion"
                ? formatConversion(headline?.current?.conversion ?? null)
                : formatCount(headline?.current?.[tile.metric] ?? null)
            }
            note={
              <span className="flex flex-wrap gap-3">
                <TrendChip
                  label="7d"
                  unit="%"
                  value={trendValue(week, tile.metric)}
                />
                <TrendChip
                  label="28d"
                  unit="%"
                  value={trendValue(headline, tile.metric)}
                />
              </span>
            }
          />
        ))}
      </StatTileGroup>
      <p className="text-caption text-muted-foreground">
        {share === null
          ? null
          : zh
            ? `搜索来源占${copy.base}的 ${share}%。`
            : `Search: ${share}% of ${copy.base}. `}
        {headline && settled
          ? zh
            ? `截至 ${formatDate(headline.to)} 的最近 28 个完整自然日，与此前 28 天对比。`
            : `Last 28 complete days through ${formatDate(headline.to)}, against the 28 before.`
          : copy.freshness}
      </p>
    </div>
  );
}

function FunnelBody({ id }: { id: string }) {
  const { country } = useKeywordScope(id);
  const { data: report } = useSuspenseQuery(
    funnelOptions(id, FUNNEL_SERIES_DAYS, country),
  );
  return funnelState(report) === "off" ? (
    <NotConnected id={id} store={report.store} />
  ) : (
    <FunnelTiles report={report} />
  );
}

export function FunnelCard({ id, store }: { id: string; store: Store }) {
  const zh = useInterfaceLanguage() === "zh-CN";
  const { country, switchable } = useKeywordScope(id);
  const { data: connections } = useSuspenseQuery(storeConnectionsOptions);
  if (!connections.available) return null;
  const market = switchable
    ? ` · ${country?.toUpperCase() ?? (zh ? "所有市场" : "All markets")}`
    : "";

  return (
    <Card>
      <CardHeader>
        <CardDescription>{FUNNEL_COPY[store].console}</CardDescription>
        <CardTitle>
          {zh ? "商店转化漏斗" : "Store funnel"}
          {market}
        </CardTitle>
        <CardAction>
          <FunnelHelp store={store} />
        </CardAction>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<FunnelTilesSkeleton />}>
          <FunnelBody id={id} />
        </Suspense>
      </CardContent>
    </Card>
  );
}
