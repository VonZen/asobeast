"use client";

import {
  useIsMutating,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { CalendarClock, Loader2 } from "lucide-react";
import { toast } from "@/lib/localized-toast";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { Button } from "@/components/ui/button";
import { ApiError, runDaily } from "@/lib/api";
import { pluralize } from "@/lib/format";
import { appKeys } from "@/lib/queries";
import { queuedToast } from "@/lib/queued-toast";
import { useSingleFlight } from "@/lib/single-flight";

export function RunDailyAction({ appId }: { appId: string }) {
  const language = useInterfaceLanguage();
  const queryClient = useQueryClient();
  const busy = useIsMutating({ mutationKey: ["app-action", appId] }) > 0;

  const mutation = useMutation({
    mutationKey: ["app-action", appId, "run-daily"],
    mutationFn: () => runDaily(appId),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: appKeys.detail(appId) });
      const { apps, keywords, categories, reviews } = result.enqueued;
      const jobs = apps + keywords + categories + reviews;
      if (jobs === 0) {
        toast.info(
          language === "zh-CN"
            ? "没有新的任务需要加入队列"
            : "Nothing new to queue",
          {
            description:
              language === "zh-CN"
                ? "此 App 今天的检查已在队列中、正在运行或已完成。"
                : "Today's checks for this app are already queued, running or done.",
          },
        );
        return;
      }
      queuedToast(
        keywords > 0
          ? `rank checks for ${pluralize(keywords, "keyword")}`
          : pluralize(jobs, "job"),
        "Follow the run in the header; tables update as positions land.",
      );
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError
          ? error.envelope.message
          : language === "zh-CN"
            ? "每日任务运行失败"
            : "Run daily failed",
      );
    },
  });
  const runOnce = useSingleFlight(mutation);

  return (
    <Button
      variant="outline"
      aria-disabled={busy || undefined}
      onClick={() => {
        if (!busy) runOnce();
      }}
      aria-label={language === "zh-CN" ? "运行每日任务" : "Run daily"}
    >
      {mutation.isPending ? (
        <Loader2 className="animate-spin" />
      ) : (
        <CalendarClock />
      )}
      <span className="hidden lg:inline">
        {language === "zh-CN" ? "运行每日任务" : "Run daily"}
      </span>
    </Button>
  );
}
