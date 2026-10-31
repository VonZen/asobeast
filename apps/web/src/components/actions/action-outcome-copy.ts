import {
  RANK_DEPTH,
  type ActionOutcome,
  type ActionOutcomeVerdict,
} from "@asobeast/shared";
import { formatDate, formatMeasure } from "@/lib/format";
import type { InterfaceLanguage } from "@/lib/interface-language";
import { interfaceCopy } from "@/lib/interface-copy";
import { TREND_METRIC_LABEL } from "./action-trend-chart";

export const OUTCOME_VERDICT_LABEL: Record<ActionOutcomeVerdict, string> = {
  improved: "Improved",
  worsened: "Worsened",
  unchanged: "No change",
  pending: "Measuring",
};

export const OUTCOME_CAVEAT =
  "Other changes in the same days can also move this number.";

function valueOf(
  outcome: ActionOutcome,
  value: number | null,
  depth: number,
): string {
  if (outcome.metric !== "position") {
    return value === null ? "—" : formatMeasure(value);
  }
  return value === null ? `not in the top ${depth}` : `#${value}`;
}

export function outcomeSentence(
  outcome: ActionOutcome,
  depth: number | null,
  language: InterfaceLanguage = "en",
): string {
  if (language === "zh-CN") {
    if (outcome.verdict === "pending") {
      const from = outcome.beforeDate ?? outcome.afterDate;
      return `${from ? `从 ${formatDate(from, language)} 开始衡量。` : ""}将事项标记为完成后，AsoBeast 需要三天的数据。`;
    }
    const scale = depth ?? RANK_DEPTH;
    const value = (v: number | null) => outcome.metric === "position" ? (v === null ? `未进入前 ${scale} 名` : `#${v}`) : (v === null ? "—" : formatMeasure(v));
    return `${interfaceCopy(language, TREND_METRIC_LABEL[outcome.metric])}在 ${formatDate(outcome.beforeDate, language)} 至 ${formatDate(outcome.afterDate, language)} 期间从 ${value(outcome.before)} 变为 ${value(outcome.after)}。`;
  }
  if (outcome.verdict === "pending") {
    const from = outcome.beforeDate ?? outcome.afterDate;
    return `${from ? `Measured from ${formatDate(from)}. ` : ""}AsoBeast needs three days of data after you marked it done.`;
  }
  const scale = depth ?? RANK_DEPTH;
  const label = TREND_METRIC_LABEL[outcome.metric];
  return `${label} ${valueOf(outcome, outcome.before, scale)} → ${valueOf(outcome, outcome.after, scale)} between ${formatDate(outcome.beforeDate)} and ${formatDate(outcome.afterDate)}.`;
}
