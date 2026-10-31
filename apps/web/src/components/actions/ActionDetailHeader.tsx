import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ACTION_RULE_TITLES, type ActionItem } from "@asobeast/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatCountry, storeLabel } from "@/lib/format";
import { ACTION_CATEGORY_LABEL, ACTION_STATUS_LABEL } from "./action-copy";
import { localizedActionHeadline } from "./action-headline";
import { actionHref, actionSection } from "./action-links";
import { ActionPriorityBadge } from "./ActionPriorityBadge";
import { ActionStateControls } from "./ActionStateControls";
import { StatusIcon } from "./ActionStatusIcon";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { CHINESE_RULE_TITLES } from "./action-headline-zh";
import { interfaceCopy } from "@/lib/interface-copy";

export function ActionDetailHeader({ item }: { item: ActionItem }) {
  const locale = useInterfaceLanguage();
  const href = actionHref(item);

  return (
    <SheetHeader className="gap-3 border-b p-4 pr-12">
      <div className="flex flex-wrap items-center gap-2">
        <ActionPriorityBadge priority={item.priority} />
        <Badge variant="secondary">
          {interfaceCopy(locale, ACTION_CATEGORY_LABEL[item.category])}
        </Badge>
        <Badge variant="outline">
          <StatusIcon status={item.status} />
          {interfaceCopy(locale, ACTION_STATUS_LABEL[item.status])}
        </Badge>
      </div>
      <SheetTitle className="text-title text-balance">
        {localizedActionHeadline(item, locale)}
      </SheetTitle>
      <SheetDescription>
        {locale === "zh-CN"
          ? CHINESE_RULE_TITLES[item.rule]
          : ACTION_RULE_TITLES[item.rule]}{" "}
        · {item.scope.appName ?? (locale === "zh-CN" ? "某个 App" : "An app")} ·{" "}
        {storeLabel(item.scope.store)} · {formatCountry(item.scope.country)}
      </SheetDescription>
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild size="sm">
          <Link href={href}>
            {locale === "zh-CN"
              ? `前往${interfaceCopy(locale, actionSection(href))}处理`
              : `Fix it in ${actionSection(href)}`}
            <ArrowRight aria-hidden />
          </Link>
        </Button>
        <ActionStateControls item={item} />
      </div>
    </SheetHeader>
  );
}
