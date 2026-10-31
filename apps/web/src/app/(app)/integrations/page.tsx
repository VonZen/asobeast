import { Suspense } from "react";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ApiTokensCard } from "@/components/integrations/ApiTokensCard";
import { McpServerCard } from "@/components/integrations/McpServerCard";
import { StoreConnectionsCard } from "@/components/integrations/StoreConnectionsCard";
import { StoreConnectionsSkeleton } from "@/components/integrations/skeletons";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { getQueryClient } from "@/lib/get-query-client";
import { getInterfaceLanguage } from "@/lib/interface-language-server";
import { storeConnectionsOptions } from "@/lib/queries";
import { STORE_CONNECTIONS_SECTION_ID } from "@/lib/store-connection-copy";

export default async function IntegrationsPage() {
  const { locale } = await getInterfaceLanguage();
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(storeConnectionsOptions);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="page-reading flex flex-col gap-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-display tracking-tight text-balance">
            {locale === "zh-CN" ? "集成" : "Integrations"}
          </h1>
          <p className="text-body text-muted-foreground">
            {locale === "zh-CN"
              ? "管理商店控制台、个人 API token 和 MCP 服务器。"
              : "Your store consoles, personal API tokens and the MCP server."}
          </p>
        </div>

        <SettingsSection
          id={STORE_CONNECTIONS_SECTION_ID}
          title={locale === "zh-CN" ? "商店连接" : "Store connections"}
          description={
            locale === "zh-CN"
              ? "连接 App Store Connect 或 Google Play Console，在排名旁查看商品页访问量、下载量和转化率。"
              : "Connect App Store Connect or the Google Play Console so store listing visits, downloads and conversion appear beside your rankings."
          }
        >
          <Suspense fallback={<StoreConnectionsSkeleton />}>
            <StoreConnectionsCard />
          </Suspense>
        </SettingsSection>

        <SettingsSection
          id="api-and-mcp"
          title="API and MCP"
          description={
            locale === "zh-CN"
              ? "供编辑器或 agent 使用的个人 token 和 MCP 服务器。"
              : "Personal tokens and the MCP server for your editor or agent."
          }
        >
          <ApiTokensCard />
          <McpServerCard />
        </SettingsSection>
      </div>
    </HydrationBoundary>
  );
}
