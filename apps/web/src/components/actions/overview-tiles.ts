import type { InterfaceLanguage } from "@/lib/interface-language";
import type {
  ActionActivity,
  ActionItem,
  ActionSummary,
} from "@asobeast/shared";
import { formatDate, formatNumber } from "@/lib/format";

export interface OverviewTile {
  label: string;
  value: string;
  note: string;
}

const WEEK_DAYS = 7;
const NOT_GENERATED = "not generated yet";

function openNote(summary: ActionSummary): string {
  const { critical, high } = summary.openByPriority;
  if (summary.open === 0) return "nothing open";
  if (critical === 0 && high === 0) return "all medium or low";
  return `${formatNumber(critical)} critical · ${formatNumber(high)} high`;
}

function nextWake(items: readonly ActionItem[]): string {
  const dates = items
    .map((item) => item.snoozedUntil)
    .filter((date): date is string => date !== null)
    .sort();
  return dates.length > 0 ? `next wakes ${formatDate(dates[0])}` : "none";
}

export function overviewTiles(
  summary: ActionSummary,
  activity: ActionActivity,
  todo: readonly ActionItem[],
  language: InterfaceLanguage = "en",
): OverviewTile[] {
  const week = activity.days.slice(-WEEK_DAYS);
  const tiles: OverviewTile[] = [
    {
      label: "Open",
      value: formatNumber(
        Object.values(summary.openByPriority).reduce((sum, n) => sum + n, 0),
      ),
      note: openNote(summary),
    },
    {
      label: "New this week",
      value: formatNumber(
        week.reduce((sum, day) => sum + day.opened + day.reopened, 0),
      ),
      note: `${formatNumber(week.reduce((sum, day) => sum + day.resolved, 0))} resolved on their own`,
    },
    {
      label: "Confirmed fixed",
      value: formatNumber(activity.totals.verified),
      note: `${formatNumber(activity.totals.done)} marked done · ${activity.days.length} days`,
    },
    {
      label: "Snoozed",
      value: formatNumber(summary.snoozed),
      note: nextWake(todo.filter((item) => item.status === "SNOOZED")),
    },
  ];
  if (language === "zh-CN") {
    const { critical, high } = summary.openByPriority;
    tiles[0].label = "待处理";
    tiles[0].note =
      summary.open === 0
        ? "暂无待处理事项"
        : critical === 0 && high === 0
          ? "均为中低优先级"
          : `${formatNumber(critical)} 项紧急 · ${formatNumber(high)} 项高优先级`;
    tiles[1].label = "本周新增";
    tiles[1].note = `${formatNumber(week.reduce((sum, day) => sum + day.resolved, 0))} 项自动解决`;
    tiles[2].label = "已确认修复";
    tiles[2].note = `${formatNumber(activity.totals.done)} 项标记完成 · ${activity.days.length} 天`;
    tiles[3].label = "已推迟";
    const dates = todo
      .filter((item) => item.status === "SNOOZED")
      .map((item) => item.snoozedUntil)
      .filter((date): date is string => date !== null)
      .sort();
    tiles[3].note = dates.length
      ? `下次恢复：${formatDate(dates[0], language)}`
      : "无";
  }
  if (summary.generatedAt !== null) return tiles;
  return tiles.map((tile) => ({
    ...tile,
    value: "—",
    note: language === "zh-CN" ? "尚未生成" : NOT_GENERATED,
  }));
}
