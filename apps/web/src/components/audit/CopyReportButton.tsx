"use client";

import { LocalizedText } from "@/components/layout/LocalizedText";

import { Copy } from "lucide-react";
import { toast } from "@/lib/localized-toast";
import type { AppAuditResult } from "@asobeast/shared";
import { Button } from "@/components/ui/button";
import { auditMarkdown } from "./audit-report";

export function CopyReportButton({
  audit,
  app,
}: {
  audit: AppAuditResult;
  app: { name: string | null; country: string };
}) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(auditMarkdown(audit, app));
      toast.success("Report copied");
    } catch {
      toast.error("Your browser blocked the clipboard");
    }
  };

  return (
    <Button variant="outline" className="w-fit" onClick={() => void copy()}>
      <Copy />
      <LocalizedText en="Copy report" />
    </Button>
  );
}
