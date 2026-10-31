"use client";

import type { ReactNode } from "react";
import type { RowData, Table as TableInstance } from "@tanstack/react-table";
import type { Options } from "nuqs";
import { ColumnMenu } from "@/components/data-table/ColumnMenu";
import {
  FilterChips,
  type FilterChip,
} from "@/components/data-table/FilterChips";
import { FilteredEmpty } from "@/components/data-table/FilteredEmpty";
import { RowCount } from "@/components/data-table/RowCount";
import { SearchInput } from "@/components/data-table/SearchInput";
import type { DataTableFeatures } from "@/components/data-table/table-features";
import { EmptyState } from "@/components/ui/empty-state";
import { AdminTable } from "./AdminTable";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { ListLimitNote } from "./ListLimitNote";
import { PLAN_COLUMN } from "./useAdminTable";

export function AdminList<TData extends RowData>({
  table,
  caption,
  noun,
  loaded,
  total,
  billing,
  search,
  onSearch,
  chips = [],
  onClearFilters,
  filters,
}: {
  table: TableInstance<DataTableFeatures, TData>;
  caption: string;
  noun: string;
  loaded: number;
  total: number;
  billing: boolean;
  search: string;
  onSearch: (value: string, options: Options) => void;
  chips?: readonly FilterChip[];
  onClearFilters: () => void;
  filters?: ReactNode;
}) {
  const locale = useInterfaceLanguage();
  const zh = locale === "zh-CN";
  const itemName = ({ workspace: "工作区", account: "账号", app: "App" } as Record<string, string>)[noun] ?? noun;
  const translatedCaption = ({ "Workspaces on this instance": "此实例中的工作区", "Accounts on this instance": "此实例中的账号", "Apps on this instance": "此实例中的 App" } as Record<string, string>)[caption] ?? caption;
  const shown = table.getRowModel().rows.length;
  const filtered = search !== "" || chips.length > 0;
  const hideable = table
    .getAllLeafColumns()
    .filter((column) => billing || column.id !== PLAN_COLUMN);

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          label={zh ? `搜索${itemName}` : `Search ${noun}s`}
          value={search}
          onSearch={onSearch}
        />
        {filters}
        <div className="ml-auto flex items-center gap-3">
          <RowCount shown={shown} total={loaded} noun={noun} />
          <ColumnMenu columns={hideable} />
        </div>
      </div>
      <FilterChips chips={chips} onClearAll={onClearFilters} />
      <ListLimitNote shown={loaded} total={total} noun={noun} />
      {shown > 0 ? (
        <AdminTable table={table} caption={zh ? translatedCaption : caption} />
      ) : filtered ? (
        <FilteredEmpty
          title={zh ? `没有符合筛选条件的${itemName}` : `No ${noun}s match these filters`}
          onClear={onClearFilters}
        />
      ) : (
        <EmptyState title={zh ? `此实例中暂无${itemName}` : `No ${noun}s on this instance yet`} />
      )}
    </div>
  );
}
