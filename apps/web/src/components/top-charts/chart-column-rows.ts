import type {
  ChartCaptureSummary,
  ChartEntryItem,
  ChartPage,
} from "@asobeast/shared";
import { formatDayMonth } from "@/lib/format";
import type { InterfaceLanguage } from "@/lib/interface-language";

export const CHART_COLUMN_ROWS = 25;

export function columnRows(page: Pick<ChartPage, "entries">): ChartEntryItem[] {
  return [...page.entries]
    .sort((a, b) => a.position - b.position)
    .slice(0, CHART_COLUMN_ROWS);
}

export function columnCaption(
  page: Pick<ChartPage, "capture" | "dates" | "entries" | "today">,
  date: string | null,
  language: InterfaceLanguage = "en",
): string {
  if (language === "zh-CN") {
    const dateLabel = (value: string) =>
      new Intl.DateTimeFormat("zh-CN", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }).format(new Date(value));
    if (page.dates.length === 0) return "尚未采集";
    if (!page.capture) return `${dateLabel(date ?? page.today)} 尚未采集`;
    const total = page.entries.length;
    const count =
      total === 0
        ? "没有 App"
        : total > CHART_COLUMN_ROWS
          ? `共 ${total} 个，显示前 ${CHART_COLUMN_ROWS} 个`
          : `${total} 个 App`;
    return `${count} · ${dateLabel(page.capture.date)}`;
  }
  if (page.dates.length === 0) return "Not captured yet";
  if (!page.capture) {
    return `Not captured on ${formatDayMonth(date ?? page.today)}`;
  }
  const total = page.entries.length;
  if (total === 0) return `No apps · ${formatDayMonth(page.capture.date)}`;
  const count =
    total > CHART_COLUMN_ROWS
      ? `Top ${CHART_COLUMN_ROWS} of ${total}`
      : `${total} ${total === 1 ? "app" : "apps"}`;
  return `${count} · ${formatDayMonth(page.capture.date)}`;
}

export function listsNoApps<P extends Pick<ChartPage, "capture" | "entries">>(
  page: P,
): page is P & { capture: ChartCaptureSummary } {
  return page.capture !== null && page.entries.length === 0;
}

export function capturableToday(
  page: Pick<ChartPage, "dates" | "today">,
): boolean {
  return page.dates[0] !== page.today;
}

export function categoryDates(
  pages: readonly Pick<ChartPage, "dates">[],
): string[] {
  return [...new Set(pages.flatMap((page) => page.dates))].sort().reverse();
}
