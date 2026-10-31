"use client";

import { LocalizedText } from "@/components/layout/LocalizedText";

import { RefreshCw } from "lucide-react";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { componentCopy } from "@/lib/component-copy";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RetryableRead {
  data: unknown;
  isError: boolean;
  isFetching: boolean;
  errorUpdatedAt: number;
  refetch: () => Promise<unknown>;
}

export const failedRead = (read: RetryableRead): boolean =>
  read.data === undefined &&
  (read.isError || (read.isFetching && read.errorUpdatedAt > 0));

export function InlineQueryError({
  message,
  read,
}: {
  message: string;
  read: RetryableRead;
}) {
  const locale = useInterfaceLanguage();
  const retrying = read.isFetching;
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
      <span role="alert">{componentCopy(locale, message)}</span>
      <Button
        size="sm"
        variant="outline"
        aria-disabled={retrying || undefined}
        onClick={() => {
          if (!retrying) void read.refetch();
        }}
      >
        <RefreshCw className={cn(retrying && "animate-spin")} />
        <LocalizedText en="Retry" />
      </Button>
    </div>
  );
}
