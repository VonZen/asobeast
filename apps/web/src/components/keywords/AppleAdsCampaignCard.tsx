"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { useAuth } from "@/components/auth/use-auth";
import { getAppleAdsCampaignStats, syncAppleAdsCampaigns } from "@/lib/api";

export function AppleAdsCampaignCard({
  appId,
  country,
}: {
  appId: string;
  country: string;
}) {
  const zh = useInterfaceLanguage() === "zh-CN";
  const { isOwner } = useAuth();
  const client = useQueryClient();
  const stats = useQuery({
    queryKey: ["apple-ads-campaigns", appId, country],
    queryFn: () => getAppleAdsCampaignStats(appId, country),
  });
  const sync = useMutation({
    mutationFn: () => syncAppleAdsCampaigns(appId),
    onSuccess: () =>
      void client.invalidateQueries({
        queryKey: ["apple-ads-campaigns", appId],
      }),
  });
  if (!stats.data?.configured) return null;
  const byCurrency = new Map<
    string,
    { impressions: number; taps: number; installs: number; spend: number }
  >();
  for (const row of stats.data.rows) {
    const current = byCurrency.get(row.currency) ?? {
      impressions: 0,
      taps: 0,
      installs: 0,
      spend: 0,
    };
    current.impressions += row.impressions;
    current.taps += row.taps;
    current.installs += row.installs;
    current.spend += row.spend;
    byCurrency.set(row.currency, current);
  }
  return (
    <section className="rounded-xl border p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">
            {zh ? "Apple Ads 活动数据" : "Apple Ads campaigns"}
          </h3>
          <p className="text-xs text-muted-foreground">
            {country.toUpperCase()} ·{" "}
            {zh ? "最近 30 个完整自然日" : "Last 30 complete days"}
          </p>
        </div>
        {isOwner ? (
          <Button
            variant="outline"
            disabled={sync.isPending}
            onClick={() => sync.mutate()}
          >
            {zh ? "同步广告活动" : "Sync campaigns"}
          </Button>
        ) : null}
      </div>
      {byCurrency.size ? (
        [...byCurrency.entries()].map(([currency, values]) => (
          <div
            key={currency}
            className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4"
          >
            <div>
              <span className="text-muted-foreground">
                {zh ? "展示" : "Impressions"}
              </span>
              <p className="font-semibold tabular-nums">
                {values.impressions.toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">
                {zh ? "点击" : "Taps"}
              </span>
              <p className="font-semibold tabular-nums">
                {values.taps.toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">
                {zh ? "安装" : "Installs"}
              </span>
              <p className="font-semibold tabular-nums">
                {values.installs.toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">
                {zh ? "花费" : "Spend"} ({currency || "?"})
              </span>
              <p className="font-semibold tabular-nums">
                {values.spend.toFixed(2)}
              </p>
            </div>
          </div>
        ))
      ) : (
        <p className="text-sm text-muted-foreground">
          {zh
            ? "还没有该市场的广告数据。"
            : "No campaign data for this market yet."}
        </p>
      )}
      {sync.data ? (
        <p role="status" className="text-xs">
          {zh ? "已同步" : "Synced"} {sync.data.campaigns}{" "}
          {zh ? "个活动" : "campaigns"}, {sync.data.keywords}{" "}
          {zh ? "条关键词记录" : "keyword rows"} ({sync.data.from} –{" "}
          {sync.data.through})
        </p>
      ) : null}
      {sync.error ? (
        <p role="alert" className="text-sm text-destructive">
          {String(sync.error)}
        </p>
      ) : null}
    </section>
  );
}
