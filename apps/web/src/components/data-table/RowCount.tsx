"use client";

import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";

export function RowCount({
  shown,
  total,
  noun,
}: {
  shown: number;
  total: number;
  noun: string;
}) {
  const language = useInterfaceLanguage();
  if (language === "zh-CN")
    return (
      <p className="text-body text-muted-foreground" aria-live="polite">
        显示 {shown} 项，共 {total} 项
      </p>
    );
  return (
    <p className="text-body text-muted-foreground" aria-live="polite">
      <span className="numeric font-mono font-medium text-foreground">
        {shown}
      </span>
      {" of "}
      <span className="numeric font-mono font-medium text-foreground">
        {total}
      </span>{" "}
      {total === 1 ? noun : `${noun}s`}
    </p>
  );
}
