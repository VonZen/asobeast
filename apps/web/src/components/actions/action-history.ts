import type {
  ActionDismissReason,
  ActionEventItem,
  ActionEventType,
} from "@asobeast/shared";
import { PRODUCT_NAME } from "@/lib/brand";
import { formatDate } from "@/lib/format";
import type { InterfaceLanguage } from "@/lib/interface-language";
import { interfaceCopy } from "@/lib/interface-copy";
import { ACTION_PRIORITY_LABEL } from "./action-copy";

export const ACTION_EVENT_LABEL: Record<ActionEventType, string> = {
  opened: "Opened",
  reopened: "Reopened",
  snoozed: "Snoozed",
  woke: "Woke up",
  done: "Marked done",
  dismissed: "Dismissed",
  resolved: "Resolved on its own",
  verified: "Confirmed fixed",
};

export const ACTION_DISMISS_REASON_LABEL: Record<ActionDismissReason, string> =
  {
    not_relevant: "Not relevant to this app",
    handled_elsewhere: "Already handled elsewhere",
    disagree_with_data: "The data looks wrong",
  };

export interface HistoryEntry {
  id: string;
  date: string;
  label: string;
  detail: string | null;
  actor: string;
}

function detailOf(event: ActionEventItem, language: InterfaceLanguage): string | null {
  switch (event.type) {
    case "snoozed":
      return event.snoozedUntil
        ? (language === "zh-CN" ? `推迟至 ${formatDate(event.snoozedUntil, language)}` : `until ${formatDate(event.snoozedUntil)}`)
        : null;
    case "dismissed":
      return event.reason ? interfaceCopy(language, ACTION_DISMISS_REASON_LABEL[event.reason]) : null;
    case "opened":
    case "reopened":
      return language === "zh-CN" ? `${interfaceCopy(language, ACTION_PRIORITY_LABEL[event.priority])} · 影响 ${event.impact}` : `${ACTION_PRIORITY_LABEL[event.priority]} · impact ${event.impact}`;
    default:
      return null;
  }
}

export function historyEntries(
  events: readonly ActionEventItem[],
  language: InterfaceLanguage = "en",
): HistoryEntry[] {
  return [...events].reverse().map((event) => ({
    id: event.id,
    date: event.occurredAt,
    label: interfaceCopy(language, ACTION_EVENT_LABEL[event.type]),
    detail: detailOf(event, language),
    actor:
      event.actor === "system"
        ? PRODUCT_NAME
        : (event.actorName ?? (language === "zh-CN" ? "团队成员" : "A teammate")),
  }));
}
