"use client";

import type { ComponentProps } from "react";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { Download } from "lucide-react";
import { SubjectButton } from "@/components/SubjectButton";

type ExportCsvButtonProps = Omit<
  ComponentProps<typeof SubjectButton>,
  "icon" | "label"
>;

export function ExportCsvButton(props: ExportCsvButtonProps) {
  const language = useInterfaceLanguage();
  return (
    <SubjectButton
      icon={<Download aria-hidden />}
      label={language === "zh-CN" ? "导出 CSV" : "Export CSV"}
      {...props}
    />
  );
}
