"use client";

import { Suspense, useMemo } from "react";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { useSuspenseQuery } from "@tanstack/react-query";
import { flexRender, useTable } from "@tanstack/react-table";
import { useQueryState, useQueryStates } from "nuqs";
import { ColumnMenu } from "@/components/data-table/ColumnMenu";
import { FilteredEmpty } from "@/components/data-table/FilteredEmpty";
import { RowCount } from "@/components/data-table/RowCount";
import { SearchInput } from "@/components/data-table/SearchInput";
import { useStoredColumnVisibility } from "@/components/data-table/useStoredColumnVisibility";
import { dataTableFeatures } from "@/components/data-table/table-features";
import { useUrlSorting } from "@/components/data-table/useUrlSorting";
import { CollapsibleCard } from "@/components/layout/CollapsibleCard";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsOption } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { appDetailOptions, discoveryOptions } from "@/lib/queries";
import { storeLabel } from "@/lib/format";
import { DISCOVERY_WINDOWS } from "@/lib/ranges";
import {
  discoveryDaysParser,
  searchParser,
  discoverySortParser,
  sortDirectionParser,
} from "@/lib/search-params";
import { ariaSort } from "@/lib/table/sorting";
import { cn } from "@/lib/utils";
import { COMPETITOR_SECTION } from "./competitor-sections";
import { discoveryColumns } from "./discovery-columns";
import { DiscoveryPanelSkeleton } from "./skeletons";

const DISCOVERY_PARAMS = {
  sort: discoverySortParser,
  dir: sortDirectionParser,
  q: searchParser,
};

const DISCOVERY_URL_KEYS = { sort: "appSort", dir: "appDir", q: "appQ" };

function DiscoveryTable({
  id,
  days,
  storeName,
  store,
  country,
}: {
  id: string;
  days: number;
  storeName: string;
  store: "APP_STORE" | "GOOGLE_PLAY";
  country: string;
}) {
  const language = useInterfaceLanguage();
  const { data } = useSuspenseQuery(discoveryOptions(id, days));
  const [params, setParams] = useQueryStates(DISCOVERY_PARAMS, {
    urlKeys: DISCOVERY_URL_KEYS,
  });
  const columns = useMemo(
    () => discoveryColumns(id, store, country),
    [id, store, country],
  );
  const [visibility, setVisibility] = useStoredColumnVisibility(
    "discovery",
    columns,
  );
  const { sorting, onSortingChange } = useUrlSorting(
    params,
    columns,
    (next) =>
      void setParams({
        sort: next.sort === null ? null : discoverySortParser.parse(next.sort),
        dir: next.dir,
      }),
  );

  const table = useTable({
    features: dataTableFeatures,
    data: data.items,
    columns,
    getRowId: (row) => row.storeAppId,
    state: {
      sorting,
      globalFilter: params.q,
      columnVisibility: visibility,
    },
    onSortingChange,
    onColumnVisibilityChange: setVisibility,
    enableSortingRemoval: false,
    enableMultiSort: false,
    globalFilterFn: "includesString",
    getColumnCanGlobalFilter: (column) => column.id === "app",
  });
  const rows = table.getRowModel().rows;

  if (data.items.length === 0) {
    return (
      <EmptyState
        title={
          language === "zh-CN"
            ? `最近 ${days} 天没有发现同分类竞品`
            : `No same-category competitors found in ${days} days`
        }
        body={
          language === "zh-CN"
            ? "仅显示与当前 App 主分类相同、尚未追踪且出现在关键词搜索结果中的 App。无法确认分类的候选不会显示；可扩大时间范围查看更早记录。"
            : "Only untracked apps with a verified matching primary category appear here. Unknown-category candidates are excluded; widen the window to inspect earlier results."
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          label="Search apps"
          value={params.q}
          onSearch={(q, options) => void setParams({ q }, options)}
        />
        <RowCount shown={rows.length} total={data.items.length} noun="app" />
        <div className="ml-auto">
          <ColumnMenu columns={table.getAllLeafColumns()} />
        </div>
      </div>
      <Table containerClassName="rounded-xl border">
        <TableCaption className="sr-only">
          Untracked {storeName} apps appearing in your keyword search results
          over the last {days} days.
        </TableCaption>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  aria-sort={ariaSort(header.column.getIsSorted())}
                  className={cn(header.column.id === "track" && "w-0")}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={table.getVisibleLeafColumns().length}>
                <FilteredEmpty
                  title={
                    language === "zh-CN"
                      ? "没有符合搜索条件的 App"
                      : "No apps match this search"
                  }
                  onClear={() => void setParams({ q: null })}
                />
              </TableCell>
            </TableRow>
          ) : null}
          {rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function DiscoveryPanel({ id }: { id: string }) {
  const language = useInterfaceLanguage();
  const [days, setDays] = useQueryState("days", discoveryDaysParser);
  const { data: detail } = useSuspenseQuery(appDetailOptions(id));
  const storeName = storeLabel(detail.store);

  return (
    <CollapsibleCard
      section={COMPETITOR_SECTION.discovery}
      eyebrow={language === "zh-CN" ? "发现" : "Discovery"}
      title={
        language === "zh-CN" ? "尚未追踪的 App" : "Apps you don’t track yet"
      }
      actions={
        <>
          <Badge variant="secondary">{storeName}</Badge>
          <Tabs
            value={String(days)}
            onValueChange={(next) => void setDays(Number(next) as typeof days)}
          >
            <TabsList>
              {DISCOVERY_WINDOWS.map((window) => (
                <TabsOption key={window} value={String(window)}>
                  {language === "zh-CN" ? `${window} 天` : `${window}d`}
                </TabsOption>
              ))}
            </TabsList>
          </Tabs>
        </>
      }
    >
      <Suspense fallback={<DiscoveryPanelSkeleton />}>
        <DiscoveryTable
          id={id}
          days={days}
          storeName={storeName}
          store={detail.store}
          country={detail.country}
        />
      </Suspense>
    </CollapsibleCard>
  );
}
