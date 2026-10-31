"use client";

import Link from "next/link";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { useSuspenseQuery } from "@tanstack/react-query";
import { TriangleAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { budgetOptions } from "@/lib/queries";
import { utilizationLevel } from "@/lib/utilization";

export function BudgetBanner() {
  const language = useInterfaceLanguage();
  const { data: budget } = useSuspenseQuery(budgetOptions);
  if (utilizationLevel(budget.utilization) !== "danger") {
    return null;
  }

  return (
    <Alert variant="destructive">
      <TriangleAlert />
      <AlertDescription>
        {language === "zh-CN"
          ? "每日请求数超过商店速率上限的 85%。"
          : "Daily requests exceed 85% of your store rate limit."}{" "}
        <Link href="/settings" className="font-medium underline">
          {language === "zh-CN" ? "查看请求额度" : "Review the request budget"}
        </Link>
        .
      </AlertDescription>
    </Alert>
  );
}
