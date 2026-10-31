"use client";

import { LocalizedText } from "@/components/layout/LocalizedText";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintReportButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      className="print:hidden"
      onClick={() => window.print()}
    >
      <Printer />
      <LocalizedText en="Print report" />
    </Button>
  );
}
