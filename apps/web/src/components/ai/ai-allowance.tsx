"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/localized-toast";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { formatDate, formatNumber } from "@/lib/format";
import { UPGRADE_PATH } from "@asobeast/shared";
import { ApiError } from "@/lib/api";
import {
  aiAllowanceRefusal,
  aiAllowanceSpent,
  aiCallsLeftText,
} from "@/lib/ai-allowance";
import { accountPlanOptions } from "@/lib/queries";

function useAiUsage() {
  return useQuery(accountPlanOptions).data?.usage.aiCalls;
}

export function useAiAllowanceSpent(): boolean {
  return aiAllowanceSpent(useAiUsage());
}

export function AiCallsLeft() {
  const locale = useInterfaceLanguage();
  const usage = useAiUsage();
  const text = usage ? aiCallsLeftText(usage) : null;
  if (!text) return null;
  const display =
    locale !== "zh-CN"
      ? text
      : usage?.limit === 0
        ? "当前套餐不包含 AI 调用"
        : usage && usage.limit !== null && usage.used >= usage.limit
          ? `AI 调用额度已用完，${formatDate(usage.resetsAt)} 重置。`
          : usage?.limit !== null && usage
            ? `本月剩余 ${formatNumber(usage.limit - usage.used)} / ${formatNumber(usage.limit)} 次 AI 调用`
            : text;
  return <p className="text-xs text-muted-foreground">{display}</p>;
}

export function useAiFailureToast(): (
  error: unknown,
  fallback: string,
) => void {
  const locale = useInterfaceLanguage();
  const router = useRouter();
  return (error, fallback) => {
    const detail =
      error instanceof ApiError ? error.envelope.aiAllowance : undefined;
    if (detail) {
      toast.error(
        locale === "zh-CN"
          ? detail.limit === 0
            ? "当前套餐不包含 AI 调用。"
            : `本月 ${formatNumber(detail.limit)} 次 AI 调用额度已用完，${formatDate(detail.resetsAt)} 重置。`
          : aiAllowanceRefusal(detail),
        {
          action: detail.upgradeTo
            ? {
                label: locale === "zh-CN" ? "查看套餐" : "See plans",
                onClick: () => router.push(UPGRADE_PATH),
              }
            : undefined,
        },
      );
      return;
    }
    toast.error(error instanceof ApiError ? error.envelope.message : fallback);
  };
}
