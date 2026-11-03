import { Suspense } from "react";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { PlanSection } from "@/components/settings/PlanSection";
import { TeamCard } from "@/components/settings/TeamCard";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { BudgetCard } from "@/components/settings/BudgetCard";
import { DeliveryCard } from "@/components/settings/DeliveryCard";
import { EmailAlertsCard } from "@/components/settings/EmailAlertsCard";
import { WebhooksCard } from "@/components/settings/WebhooksCard";
import { WorkspaceDeletionCard } from "@/components/settings/WorkspaceDeletionCard";
import {
  BudgetCardSkeleton,
  DeliveryCardSkeleton,
  EmailAlertsCardSkeleton,
  WebhooksCardSkeleton,
} from "@/components/settings/skeletons";
import { pageReturnedFromCheckout } from "@/lib/checkout-return";
import { getQueryClient } from "@/lib/get-query-client";
import {
  accountPlanOptions,
  alertDeliveryOptions,
  alertsConfigOptions,
  budgetOptions,
  emailAlertsOptions,
  webhooksOptions,
} from "@/lib/queries";
import { viewerIsOperator } from "@/lib/viewer";
import { getInterfaceLanguage } from "@/lib/interface-language-server";
import { LanguageSetting } from "@/components/settings/LanguageSetting";
import { MetadataPublishSetting } from "@/components/settings/MetadataPublishSetting";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const returnedFromCheckout = pageReturnedFromCheckout(await searchParams);
  const queryClient = getQueryClient();
  const [operator, { locale, preference }] = await Promise.all([
    viewerIsOperator(),
    getInterfaceLanguage(),
    returnedFromCheckout
      ? undefined
      : queryClient.prefetchQuery(accountPlanOptions),
    queryClient.prefetchQuery(webhooksOptions),
    queryClient.prefetchQuery(emailAlertsOptions),
    queryClient.prefetchQuery(alertsConfigOptions),
    queryClient.prefetchQuery(alertDeliveryOptions),
    queryClient.prefetchQuery(budgetOptions),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="page-reading flex flex-col gap-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-display tracking-tight text-balance">
            {locale === "zh-CN" ? "设置" : "Settings"}
          </h1>
          <p className="text-body text-muted-foreground">
            {locale === "zh-CN"
              ? "管理套餐、提醒、团队和工作区。"
              : "Your plan, alerts, team and workspace."}
          </p>
        </div>

        <LanguageSetting preference={preference} />
        <PlanSection />
        <SettingsSection
          id="metadata-publishing"
          title={
            locale === "zh-CN"
              ? "App Store 元数据发布"
              : "App Store metadata publishing"
          }
          description={
            locale === "zh-CN"
              ? "控制工作区对 App Store Connect 的元数据写入。"
              : "Control metadata writes to App Store Connect for this workspace."
          }
        >
          <MetadataPublishSetting />
        </SettingsSection>

        {operator ? (
          <SettingsSection
            id="daily-capacity"
            title={locale === "zh-CN" ? "采集容量" : "Capacity"}
            description={
              locale === "zh-CN"
                ? "采集流程占用的每日商店请求额度，决定可跟踪的市场数量。"
                : "How much of your daily store request budget the pipeline uses. It governs how many markets you can track."
            }
          >
            <Suspense fallback={<BudgetCardSkeleton />}>
              <BudgetCard />
            </Suspense>
          </SettingsSection>
        ) : null}

        <SettingsSection
          id="alerts"
          title={locale === "zh-CN" ? "提醒" : "Alerts"}
          description={
            locale === "zh-CN"
              ? "设置 AsoBeast 在内容发生变化时如何通知你。"
              : "When AsoBeast tells you something changed, and where it sends that."
          }
        >
          <Suspense fallback={<DeliveryCardSkeleton />}>
            <DeliveryCard />
          </Suspense>
          <div id="webhooks" className="scroll-mt-20">
            <Suspense fallback={<WebhooksCardSkeleton />}>
              <WebhooksCard />
            </Suspense>
          </div>
          <div id="email-alerts" className="scroll-mt-20">
            <Suspense fallback={<EmailAlertsCardSkeleton />}>
              <EmailAlertsCard />
            </Suspense>
          </div>
        </SettingsSection>

        <SettingsSection
          id="team"
          title={locale === "zh-CN" ? "团队" : "Team"}
          description={
            locale === "zh-CN"
              ? "管理可以登录此工作区的成员并邀请其他人。"
              : "Who can sign in to this workspace, and how to invite someone else."
          }
        >
          <TeamCard />
        </SettingsSection>

        <SettingsSection
          id="workspace"
          title={locale === "zh-CN" ? "工作区" : "Workspace"}
          description={
            locale === "zh-CN"
              ? "删除此工作区及其全部内容，或取消尚未执行的删除。"
              : "Delete this workspace and everything in it, or cancel a deletion that is pending."
          }
        >
          <WorkspaceDeletionCard />
        </SettingsSection>
      </div>
    </HydrationBoundary>
  );
}
