import type { ReactNode } from "react";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { FollowedCharts } from "./FollowedCharts";

export function ChartsHeader({ actions }: { actions: ReactNode }) {
  const language = useInterfaceLanguage();
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-display tracking-tight text-balance">
          {language === "zh-CN" ? "排行榜" : "Top charts"}
        </h1>
        <p className="text-body text-muted-foreground">
          {language === "zh-CN"
            ? "按国家和类别查看免费、付费和畅销排行榜，每天采集一次。"
            : "Free, paid and grossing charts by country and category, captured once a day."}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <FollowedCharts />
        {actions}
      </div>
    </div>
  );
}
