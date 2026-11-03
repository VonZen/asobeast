"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/use-auth";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { assessKeywordRelevance } from "@/lib/api/keyword-relevance";
import { keywordsOptions } from "@/lib/queries";

export function KeywordRelevanceCard({
  appId,
  country,
}: {
  appId: string;
  country: string;
}) {
  const zh = useInterfaceLanguage() === "zh-CN";
  const { isOwner } = useAuth();
  const client = useQueryClient();
  const query = useQuery(keywordsOptions(appId, country));
  const [approved, setApproved] = useState(false);
  const ids =
    query.data
      ?.filter((item) => item.active)
      .slice(0, 25)
      .map((item) => item.keywordId) ?? [];
  const assess = useMutation({
    mutationFn: () => assessKeywordRelevance(appId, ids),
    onSuccess: () => {
      setApproved(false);
      void client.invalidateQueries({
        queryKey: keywordsOptions(appId, country).queryKey,
      });
    },
  });
  if (!isOwner || ids.length === 0) return null;
  return (
    <div className="rounded-xl border p-4 space-y-2">
      <h3 className="font-semibold">
        {zh ? "AI 关键词相关度" : "AI keyword relevance"}
      </h3>
      <p className="text-sm text-muted-foreground">
        {zh
          ? `评估当前市场前 ${ids.length} 个活跃关键词与 App 的契合度，结果写入已有的相关度字段（0–100）。需要消耗 AI 额度。`
          : `Assess the first ${ids.length} active market keywords for app fit (0–100). This updates the existing relevance field and spends AI allowance.`}
      </p>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={approved}
          onChange={(event) => setApproved(event.target.checked)}
        />
        {zh
          ? "确认覆盖这些关键词的相关度"
          : "Confirm updating these keyword relevance scores"}
      </label>
      <Button
        variant="outline"
        disabled={!approved || assess.isPending}
        onClick={() => assess.mutate()}
      >
        {zh ? "评估相关度" : "Assess relevance"}
      </Button>
      {assess.data ? (
        <p role="status" className="text-sm">
          {zh ? "已更新" : "Updated"} {assess.data.scores.length}
        </p>
      ) : null}
      {assess.error ? (
        <p role="alert" className="text-sm text-destructive">
          {String(assess.error)}
        </p>
      ) : null}
    </div>
  );
}
