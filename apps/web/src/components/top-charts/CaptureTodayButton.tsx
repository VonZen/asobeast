"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, Loader2 } from "lucide-react";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { useQueryStates } from "nuqs";
import { toast } from "@/lib/localized-toast";
import type { ComponentProps } from "react";
import type { ChartKey } from "@asobeast/shared";
import { Button } from "@/components/ui/button";
import { captureChart } from "@/lib/api";
import { armFocusHandoff } from "@/lib/focus-handoff";
import { seedChartCapture } from "@/lib/queries";
import { chartParsers } from "@/lib/search-params";
import { useSingleFlight } from "@/lib/single-flight";
import {
  captureErrorText,
  captureFocusKey,
  noAppsToast,
} from "./chart-actions";
import { listsNoApps } from "./chart-column-rows";

export function CaptureTodayButton({
  chart,
  variant,
  size,
}: {
  chart: ChartKey;
} & Pick<ComponentProps<typeof Button>, "variant" | "size">) {
  const zh = useInterfaceLanguage() === "zh-CN";
  const queryClient = useQueryClient();
  const [, setSearch] = useQueryStates(chartParsers);
  const mutation = useMutation({
    mutationFn: () => captureChart(chart),
    onSuccess: (page) => {
      if (page.answeredNoApps) {
        toast.info(noAppsToast(page.chart.store));
        return;
      }
      seedChartCapture(queryClient, page);
      toast.success(
        listsNoApps(page)
          ? noAppsToast(page.chart.store)
          : zh
            ? "已采集今日排行榜"
            : "Captured today's chart",
      );
      void setSearch({ date: null });
    },
    onError: (error) => toast.error(captureErrorText(error)),
  });
  const captureOnce = useSingleFlight(mutation);

  return (
    <Button
      variant={variant}
      size={size}
      aria-disabled={mutation.isPending || undefined}
      onClick={() => {
        armFocusHandoff(captureFocusKey(chart));
        captureOnce();
      }}
    >
      {mutation.isPending ? (
        <Loader2 className="animate-spin" aria-hidden />
      ) : (
        <Download aria-hidden />
      )}
      {zh ? "采集今日榜单" : "Capture today"}
    </Button>
  );
}
