import type { ReviewItem, Store } from "@asobeast/shared";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { interfaceCopy } from "@/lib/interface-copy";
import { Badge } from "@/components/ui/badge";
import { replyBadgeLabel, replyBadgeVariant } from "./reply-state";

export function ReplyStateBadge({
  review,
  store,
}: {
  review: ReviewItem;
  store: Store;
}) {
  const language = useInterfaceLanguage();
  const label = replyBadgeLabel(review, store);
  return (
    <Badge variant={replyBadgeVariant(review)}>
      {language === "zh-CN" && label.startsWith("Replied on ")
        ? `已在 ${label.slice("Replied on ".length)} 回复`
        : interfaceCopy(language, label)}
    </Badge>
  );
}
