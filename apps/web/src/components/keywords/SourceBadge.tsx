import type { KeywordSource } from "@asobeast/shared";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { interfaceCopy } from "@/lib/interface-copy";
import { Badge } from "@/components/ui/badge";

const VARIANT: Record<
  KeywordSource,
  "default" | "secondary" | "success" | "info" | "warning" | "outline"
> = {
  TITLE: "success",
  SUBTITLE: "info",
  DESCRIPTION: "secondary",
  KEYWORD_FIELD: "default",
  SUGGESTED: "warning",
  MANUAL: "outline",
  COMPETITOR: "secondary",
};

export const SOURCE_LABELS: Record<KeywordSource, string> = {
  TITLE: "Title",
  SUBTITLE: "Subtitle",
  DESCRIPTION: "Description",
  KEYWORD_FIELD: "Keyword field",
  SUGGESTED: "Suggested",
  MANUAL: "Manual",
  COMPETITOR: "Competitor",
};

export function SourceBadge({ source }: { source: KeywordSource }) {
  const language = useInterfaceLanguage();
  return (
    <Badge variant={VARIANT[source]}>
      {interfaceCopy(language, SOURCE_LABELS[source])}
    </Badge>
  );
}
