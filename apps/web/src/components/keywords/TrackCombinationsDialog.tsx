"use client";

import { LocalizedText } from "@/components/layout/LocalizedText";

import Link from "next/link";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { useAuth } from "@/components/auth/use-auth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCountry, formatNumber } from "@/lib/format";

export const keywordCount = (count: number) =>
  `${formatNumber(count)} keyword${count === 1 ? "" : "s"}`;

export function TrackCombinationsDialog({
  count,
  market,
  open,
  pending,
  onOpenChange,
  onConfirm,
}: {
  count: number;
  market: string;
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const storefront = formatCountry(market);
  const zh = useInterfaceLanguage() === "zh-CN";
  const { isOperator } = useAuth();
  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {zh
              ? `在 ${storefront} 跟踪 ${formatNumber(count)} 个关键词？`
              : `Track ${keywordCount(count)} in ${storefront}?`}
          </DialogTitle>
          <DialogDescription>
            {zh
              ? `每个跟踪关键词每天在 ${storefront} 增加一次商店搜索请求。`
              : `Each tracked keyword adds one store search a day in ${storefront}.`}
            {isOperator ? (
              <>
                {" "}
                <Link
                  href="/settings#daily-capacity"
                  className="font-medium text-foreground underline underline-offset-4"
                >
                  <LocalizedText en="Review the daily request budget" />
                </Link>
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            <LocalizedText en="Cancel" />
          </Button>
          <Button disabled={pending} onClick={onConfirm}>
            <LocalizedText en="Track" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
