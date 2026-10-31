"use client";

import type { AppListItem, ChartPage } from "@asobeast/shared";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { componentCopy } from "@/lib/component-copy";
import { ChartColumn } from "./ChartColumn";
import type { ChartSearch } from "./chart-params";
import { COLUMNS_GRID } from "./skeletons";
import { TrendingPanel } from "./TrendingPanel";

export function ChartColumns({
  pages,
  apps,
  busy,
  search,
}: {
  pages: readonly ChartPage[];
  apps: readonly AppListItem[];
  busy: boolean;
  search: Pick<ChartSearch, "compare" | "date">;
}) {
  const locale = useInterfaceLanguage();
  return (
    <>
      <div aria-busy={busy} className={COLUMNS_GRID}>
        {pages.map((page) => (
          <ChartColumn
            key={page.chart.collection}
            page={page}
            apps={apps}
            search={search}
          />
        ))}
      </div>
      <aside aria-label={componentCopy(locale, "Trending")}>
        <TrendingPanel pages={pages} />
      </aside>
    </>
  );
}
