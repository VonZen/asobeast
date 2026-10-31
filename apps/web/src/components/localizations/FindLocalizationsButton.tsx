"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, ScanSearch } from "lucide-react";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { toast } from "@/lib/localized-toast";
import { Button } from "@/components/ui/button";
import { ApiError, detectAppLocalizations } from "@/lib/api";
import { pluralize } from "@/lib/format";
import { appKeys, invalidateLocalizationMutation } from "@/lib/queries";
import { queuedToast } from "@/lib/queued-toast";
import { useSingleFlight } from "@/lib/single-flight";

const FOLLOW_INTERVAL_MS = 5_000;
const FOLLOW_LIMIT_MS = 90_000;

export function FindLocalizationsButton({ appId }: { appId: string }) {
  const zh = useInterfaceLanguage() === "zh-CN";
  const queryClient = useQueryClient();
  const [following, setFollowing] = useState(false);

  const detect = useMutation({
    mutationFn: () => detectAppLocalizations(appId),
    onSuccess: ({ queued }) => {
      if (queued === 0) {
        toast.info(
          zh
            ? "当前市场读取的所有语言均已列出或今天已经检查过。"
            : "Every language your markets read is already listed or was checked today.",
        );
        return;
      }
      queuedToast(
        "localizations",
        zh
          ? `正在 App Store 检查 ${queued} 个语言版本。检测结果将显示在此处。`
          : `Checking ${pluralize(queued, "language")} in the App Store. Detected ones appear here.`,
      );
      void queryClient.invalidateQueries({
        queryKey: appKeys.localizations(appId),
      });
      setFollowing(true);
    },
    onError: (error) =>
      toast.error(
        error instanceof ApiError
          ? error.envelope.message
          : zh
            ? "无法检测本地化版本"
            : "Could not look for localizations",
      ),
  });
  const detectOnce = useSingleFlight(detect);

  useEffect(() => {
    if (!following) return;
    const tick = setInterval(() => {
      void queryClient.invalidateQueries({
        queryKey: appKeys.localizations(appId),
      });
    }, FOLLOW_INTERVAL_MS);
    const stop = setTimeout(() => {
      setFollowing(false);
      invalidateLocalizationMutation(queryClient, appId);
    }, FOLLOW_LIMIT_MS);
    return () => {
      clearInterval(tick);
      clearTimeout(stop);
    };
  }, [following, queryClient, appId]);

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={detect.isPending}
      onClick={() => detectOnce()}
    >
      {detect.isPending ? <Loader2 className="animate-spin" /> : <ScanSearch />}
      {zh ? "检测本地化版本" : "Find localizations"}
    </Button>
  );
}
