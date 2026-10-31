"use client";

import { toast as originalToast } from "sonner";
import { componentCopy } from "@/lib/component-copy";
import type { InterfaceLanguage } from "@/lib/interface-language";

const localeNow = (): InterfaceLanguage =>
  typeof document !== "undefined" && document.documentElement.lang === "zh-CN"
    ? "zh-CN"
    : "en";

/**
 * Translate only recognized status templates. Preserve interpolated app names,
 * keyword text, addresses, and server-provided values exactly as received.
 */
export function toastMessageCopy(
  locale: InterfaceLanguage,
  message: string,
): string {
  if (locale === "en") return message;
  const fixed = componentCopy(locale, message);
  if (fixed !== message) return fixed;

  const patterns: Array<[RegExp, string]> = [
    [/^Deleted (.+)$/, "已删除 $1"],
    [/^Could not delete (.+)$/, "无法删除 $1"],
    [/^Now tracking (.+)$/, "已开始跟踪 $1"],
    [/^Stopped tracking (.+)$/, "已停止跟踪 $1"],
    [/^Could not stop tracking (.+)$/, "无法停止跟踪 $1"],
    [/^Tracking (.+)$/, "正在跟踪 $1"],
    [/^Removed (.+)$/, "已移除 $1"],
    [/^Could not remove (.+)$/, "无法移除 $1"],
    [/^Could not track (.+)$/, "无法跟踪 $1"],
    [/^(.+) copied$/, "已复制 $1"],
    [/^Could not load (.+)$/, "无法加载 $1"],
  ];
  for (const [pattern, replacement] of patterns) {
    if (pattern.test(message)) return message.replace(pattern, replacement);
  }
  return message;
}

const TRANSLATABLE_METHODS = new Set([
  "success",
  "error",
  "info",
  "warning",
  "message",
  "loading",
]);

const localized = (message: unknown) =>
  typeof message === "string"
    ? toastMessageCopy(localeNow(), message)
    : message;

/** A Sonner-compatible toast facade that does not change its call signatures. */
export const toast: typeof originalToast = new Proxy(originalToast, {
  apply(target, thisArg, args: unknown[]) {
    return Reflect.apply(target, thisArg, [
      localized(args[0]),
      ...args.slice(1),
    ]);
  },
  get(target, property, receiver) {
    const member: unknown = Reflect.get(target, property, receiver);
    if (
      typeof property !== "string" ||
      !TRANSLATABLE_METHODS.has(property) ||
      typeof member !== "function"
    ) {
      return member;
    }
    return (...args: unknown[]) =>
      Reflect.apply(member, target, [localized(args[0]), ...args.slice(1)]);
  },
});
