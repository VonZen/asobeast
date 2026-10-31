"use client";

import { CircleCheck, Filter, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/format";
import { GenerateNowButton } from "./GenerateNowButton";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";

export function ActionEmptyState({
  generatedAt,
  filtered,
  onClearFilters,
}: {
  generatedAt: string | null;
  filtered: boolean;
  onClearFilters: () => void;
}) {
  const locale = useInterfaceLanguage();
  const chinese = locale === "zh-CN";
  if (generatedAt === null) {
    return (
      <EmptyState
        icon={ListChecks}
        title={chinese ? "尚未生成行动" : "No actions generated yet"}
        body={
          chinese
            ? "每日采集流程完成后会生成行动。你也可以立即生成；此操作仅读取已保存的数据，不会产生商店请求。"
            : "Actions are generated after the daily pipeline completes. You can also run generation now — it reads stored data only and costs no store requests."
        }
        action={<GenerateNowButton generatedAt={generatedAt} />}
      />
    );
  }
  if (filtered) {
    return (
      <EmptyState
        icon={Filter}
        title={
          chinese ? "没有符合筛选条件的行动" : "No actions match these filters"
        }
        body={
          chinese
            ? "此工作区没有符合当前状态、优先级和规则筛选条件的行动。"
            : "Nothing in this workspace matches the current status, priority and rule filters."
        }
        action={
          <Button variant="outline" onClick={onClearFilters}>
            {chinese ? "清除筛选" : "Clear filters"}
          </Button>
        }
      />
    );
  }

  return (
    <EmptyState
      icon={CircleCheck}
      title={chinese ? "目前没有待处理事项" : "Nothing to do right now"}
      body={
        chinese
          ? `上次生成时间：${formatDateTime(generatedAt, locale)}。`
          : `Last generated ${formatDateTime(generatedAt)}.`
      }
      action={<GenerateNowButton generatedAt={generatedAt} />}
    />
  );
}
