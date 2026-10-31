import type {
  ChangeImpactFunnel,
  ChangeImpactMovement,
  ChangeImpactWindow,
} from "@asobeast/shared";
import { formatConversion, formatCount } from "@/lib/funnel";
import { formatDate, formatMeasure } from "@/lib/format";
import type { InterfaceLanguage } from "@/lib/interface-language";

const dateList = new Intl.ListFormat("en-US", { type: "conjunction" });

const plural = (count: number, noun: string): string =>
  `${count} ${noun}${count === 1 ? "" : "s"}`;

export function windowTitle(
  days: number,
  language: InterfaceLanguage = "en",
): string {
  return language === "zh-CN" ? `${days} 天后` : `After ${days} days`;
}

export function windowStatusLine(
  impact: Pick<ChangeImpactWindow, "status" | "targetDate" | "measuredOn">,
  language: InterfaceLanguage = "en",
): string {
  if (language === "zh-CN") {
    if (impact.status === "pending")
      return `${formatDate(impact.targetDate, language)} 可衡量`;
    if (impact.status === "measured")
      return `衡量日期：${formatDate(impact.measuredOn, language)}`;
    return `${formatDate(impact.targetDate, language)} 附近没有排名检查`;
  }
  if (impact.status === "pending") {
    return `Measurable on ${formatDate(impact.targetDate)}`;
  }
  if (impact.status === "measured") {
    return `Measured on ${formatDate(impact.measuredOn)}`;
  }
  return `No rank check near ${formatDate(impact.targetDate)}`;
}

export function movementLine(
  movement: ChangeImpactMovement,
  language: InterfaceLanguage = "en",
): string {
  return language === "zh-CN"
    ? `${movement.improved} 个上升，${movement.declined} 个下降`
    : `${movement.improved} improved, ${movement.declined} declined`;
}

export function rankingShiftLine(
  movement: ChangeImpactMovement,
  language: InterfaceLanguage = "en",
): string | null {
  if (language === "zh-CN") {
    const parts = [
      movement.entered > 0 ? `${movement.entered} 个开始获得排名` : null,
      movement.exited > 0 ? `${movement.exited} 个不再有排名` : null,
    ].filter((part): part is string => part !== null);
    return parts.length ? parts.join("，") : null;
  }
  const parts = [
    movement.entered > 0 ? `${movement.entered} started ranking` : null,
    movement.exited > 0 ? `${movement.exited} stopped ranking` : null,
  ].filter((part): part is string => part !== null);
  return parts.length === 0 ? null : parts.join(", ");
}

export function measuredLine(
  movement: ChangeImpactMovement,
  language: InterfaceLanguage = "en",
): string {
  return language === "zh-CN"
    ? `${movement.measured} 个关键词在两天均有检查`
    : `${plural(movement.measured, "keyword")} checked on both days`;
}

export function visibilityRange(
  impact: Pick<ChangeImpactWindow, "visibilityBefore" | "visibilityAfter">,
): string | null {
  const { visibilityBefore: before, visibilityAfter: after } = impact;
  if (before === null || after === null) return null;
  return `${formatMeasure(before)} → ${formatMeasure(after)}`;
}

export function overlapNotice(
  dates: readonly string[],
  language: InterfaceLanguage = "en",
): string | null {
  if (dates.length === 0) return null;
  if (language === "zh-CN")
    return `此时间范围内还有其他更改：${dates.map((date) => formatDate(date, language)).join("、")}。`;
  const list = dateList.format(dates.map((date) => formatDate(date)));
  return dates.length === 1
    ? `Another change on ${list} falls inside this window.`
    : `Other changes on ${list} fall inside this window.`;
}

export function impactScopeLine({
  days,
  totalChanges,
  shown,
}: {
  days: number;
  totalChanges: number;
  shown: number;
}): string {
  return shown === totalChanges
    ? `${plural(shown, "change")} to your listing in the last ${days} days`
    : `The ${shown} newest of ${totalChanges} changes to your listing in the last ${days} days`;
}

export interface FunnelRanges {
  gets: string;
  conversion: string;
}

export function funnelRanges(
  funnel: ChangeImpactFunnel | null | undefined,
): FunnelRanges | null {
  if (funnel?.status !== "measured" || !funnel.before || !funnel.after) {
    return null;
  }
  return {
    gets: `${formatCount(funnel.before.gets)} → ${formatCount(funnel.after.gets)}`,
    conversion: `${formatConversion(funnel.before.conversion)} → ${formatConversion(funnel.after.conversion)}`,
  };
}

export function funnelNote(
  funnel: ChangeImpactFunnel | null | undefined,
  days: number,
  language: InterfaceLanguage = "en",
): string | null {
  if (!funnel || funnel.status === "measured") return null;
  if (language === "zh-CN") {
    if (funnel.status === "unmeasured") return "此变更之前没有控制台数据";
    return funnel.finalOn
      ? `此时间范围的控制台数据将于 ${formatDate(funnel.finalOn, language)} 确定`
      : `此时间范围的控制台数据将在 ${days - funnel.completeDays} 天后确定`;
  }
  if (funnel.status === "unmeasured") {
    return "No console data before this change";
  }
  if (funnel.finalOn) {
    return `The console's numbers for this window are final by ${formatDate(funnel.finalOn)}`;
  }
  return `The console's numbers for this window are final in ${plural(days - funnel.completeDays, "day")}`;
}
