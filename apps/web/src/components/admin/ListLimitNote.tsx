"use client";

import Link from "next/link";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { adminHref } from "@/lib/admin-sections";
import { formatNumber } from "@/lib/format";

export function ListLimitNote({
  shown,
  total,
  noun,
}: {
  shown: number;
  total: number;
  noun: string;
}) {
  const locale = useInterfaceLanguage();
  const itemName = ({ workspace: "工作区", account: "账号", app: "App" } as Record<string, string>)[noun] ?? noun;
  if (total <= shown) return null;

  return (
    <p className="text-sm text-muted-foreground">
      {locale === "zh-CN"
        ? `显示最新 ${formatNumber(shown)} 条，共 ${formatNumber(total)} 条${itemName}记录。`
        : `Showing the newest ${formatNumber(shown)} of ${formatNumber(total)} ${noun}s.`}{" "}
      <Link
        href={adminHref("workspaces")}
        className="font-medium text-foreground underline underline-offset-4"
      >
        {locale === "zh-CN" ? "打开工作区" : "Open a workspace"}
      </Link>{" "}
      {locale === "zh-CN" ? `查看其中全部${itemName}记录。` : `to list all of its ${noun}s.`}
    </p>
  );
}
