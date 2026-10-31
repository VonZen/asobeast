"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { AppIcon } from "@/components/AppIcon";
import { useMarket } from "@/components/app-detail/use-market";
import {
  formatCompact,
  formatCountry,
  formatDate,
  formatNumber,
  formatPrice,
  formatRating,
} from "@/lib/format";
import { queryMarket } from "@/lib/market";
import { appListingOptions } from "@/lib/queries";

export function SnapshotFacts({ id }: { id: string }) {
  const language = useInterfaceLanguage();
  const { market, home } = useMarket(id);
  const country = queryMarket(market, home);
  const { data: detail } = useSuspenseQuery(appListingOptions(id, country));
  const snapshot = detail.latestSnapshot;
  const where = country === undefined ? "" : ` · ${formatCountry(country)}`;

  const facts = [
    snapshot?.ratingAvg != null
      ? `★ ${formatRating(snapshot.ratingAvg)}${
          snapshot.ratingCount != null
            ? ` (${formatNumber(snapshot.ratingCount)})`
            : ""
        }`
      : null,
    snapshot?.installs != null
      ? language === "zh-CN"
        ? `${formatCompact(snapshot.installs)} 次安装`
        : `${formatCompact(snapshot.installs)} installs`
      : null,
    snapshot?.version ? `v${snapshot.version}` : null,
    snapshot?.price != null
      ? formatPrice(snapshot.price, snapshot.currency)
      : null,
    snapshot
      ? `${language === "zh-CN" ? "快照" : "Snapshot"} ${formatDate(snapshot.capturedAt, language)}${where}`
      : null,
  ].filter((fact): fact is string => fact !== null);

  return (
    <div className="flex items-center gap-3">
      <AppIcon src={detail.iconUrl} name={detail.name} size={48} />
      {facts.length > 0 ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-body text-muted-foreground">
          {facts.map((fact) => (
            <span key={fact}>{fact}</span>
          ))}
        </div>
      ) : (
        <p className="text-body text-muted-foreground">
          {language === "zh-CN"
            ? "尚无商店快照，刷新后即可获取。"
            : "No store snapshot yet. Refresh to capture one."}
        </p>
      )}
    </div>
  );
}
