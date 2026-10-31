"use client";

import { Suspense, useState } from "react";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { formatDate } from "@/lib/format";
import Link from "next/link";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useQueryState } from "nuqs";
import type { ChangeEventItem } from "@asobeast/shared";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsList, TabsOption } from "@/components/ui/tabs";
import { portfolioOptions, recentChangesOptions } from "@/lib/queries";
import { changeOwnerParser, type ChangeOwner } from "@/lib/search-params";
import { groupChangesByDay } from "./change-days";
import { ChangeRow } from "./ChangeTimeline";
import { ChangeTimelineSkeleton } from "./skeletons";

const VISIBLE_CHANGES = 8;

const OWNER_TABS: Array<{ value: ChangeOwner; label: string }> = [
  { value: "all", label: "All" },
  { value: "yours", label: "Yours" },
  { value: "competitors", label: "Competitors" },
];

const EMPTY_FILTER: Record<ChangeOwner, string> = {
  all: "No changes in this window.",
  yours: "No changes to your apps in this window.",
  competitors: "No changes from competitors in this window.",
};

const ownedBy =
  (owner: ChangeOwner) =>
  (event: ChangeEventItem): boolean =>
    owner === "all" || event.isCompetitor === (owner === "competitors");

function RecentChangesList({ today }: { today: string }) {
  const language = useInterfaceLanguage();
  const { data } = useSuspenseQuery(recentChangesOptions());
  const { data: portfolio } = useSuspenseQuery(portfolioOptions);
  const [owner, setOwner] = useQueryState("changes", changeOwnerParser);
  const [expanded, setExpanded] = useState(false);

  if (data.events.length === 0) {
    return (
      <EmptyState
        title={language === "zh-CN" ? "暂无变化" : "No changes yet"}
        body={
          language === "zh-CN"
            ? "每日刷新后，所有 App 的元数据变化会显示在这里。"
            : "Metadata changes across your portfolio appear after daily refreshes."
        }
      />
    );
  }

  const mixed =
    data.events.some((event) => event.isCompetitor) &&
    data.events.some((event) => !event.isCompetitor);
  const active = mixed ? owner : "all";
  const events = data.events.filter(ownedBy(active));
  const shown = expanded ? events : events.slice(0, VISIBLE_CHANGES);
  const hidden = events.length - shown.length;
  const icons = new Map(portfolio.apps.map((app) => [app.id, app.iconUrl]));

  return (
    <div className="flex flex-col gap-4">
      {mixed ? (
        <Tabs
          value={owner}
          onValueChange={(value) =>
            void setOwner(changeOwnerParser.parse(value))
          }
        >
          <TabsList>
            {OWNER_TABS.map((tab) => (
              <TabsOption key={tab.value} value={tab.value}>
                {language === "zh-CN"
                  ? { all: "全部", yours: "你的 App", competitors: "竞品" }[
                      tab.value
                    ]
                  : tab.label}
              </TabsOption>
            ))}
          </TabsList>
        </Tabs>
      ) : null}

      {events.length === 0 ? (
        <p className="text-body text-muted-foreground">
          {language === "zh-CN"
            ? {
                all: "此时间范围内没有变化。",
                yours: "此时间范围内你的 App 没有变化。",
                competitors: "此时间范围内竞品没有变化。",
              }[active]
            : EMPTY_FILTER[active]}
        </p>
      ) : (
        groupChangesByDay(shown, today).map((group) => (
          <section key={group.day} className="flex flex-col gap-1">
            <h3 className="text-label text-muted-foreground uppercase">
              {language === "zh-CN"
                ? group.label === "Today"
                  ? "今天"
                  : group.label === "Yesterday"
                    ? "昨天"
                    : formatDate(group.day, language)
                : group.label}
            </h3>
            <div className="divide-y">
              {group.events.map((event) => (
                <Link
                  key={event.id}
                  href={`/apps/${event.appId}/changes`}
                  className="block rounded-lg px-2 transition-colors hover:bg-muted/40"
                >
                  <ChangeRow
                    event={event}
                    iconUrl={
                      event.isCompetitor
                        ? null
                        : (icons.get(event.appId) ?? null)
                    }
                  />
                </Link>
              ))}
            </div>
          </section>
        ))
      )}

      {hidden > 0 ? (
        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          onClick={() => setExpanded(true)}
        >
          {language === "zh-CN" ? `再显示 ${hidden} 条` : `Show ${hidden} more`}
        </Button>
      ) : null}
    </div>
  );
}

export function RecentChangesCard({ today }: { today: string }) {
  const language = useInterfaceLanguage();
  return (
    <Card>
      <CardHeader>
        <CardTitle asChild>
          <h2>{language === "zh-CN" ? "最近变化" : "Recent changes"}</h2>
        </CardTitle>
        <CardDescription>
          {language === "zh-CN" ? "所有 App" : "Across your portfolio"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<ChangeTimelineSkeleton />}>
          <RecentChangesList today={today} />
        </Suspense>
      </CardContent>
    </Card>
  );
}
