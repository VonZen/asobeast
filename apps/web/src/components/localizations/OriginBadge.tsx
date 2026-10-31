"use client";

import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import type { AppLocalizationOrigin } from "@asobeast/shared";
import { Badge } from "@/components/ui/badge";

export function OriginBadge({ origin }: { origin: AppLocalizationOrigin }) {
  const zh = useInterfaceLanguage() === "zh-CN";
  if (origin === "home")
    return <Badge variant="outline">{zh ? "主要语言" : "Home"}</Badge>;
  if (origin === "detected")
    return <Badge variant="info">{zh ? "已检测" : "Detected"}</Badge>;
  return null;
}
