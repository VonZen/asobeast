"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getStoreConnections, setMetadataPublishing } from "@/lib/api";
import { useAuth } from "@/components/auth/use-auth";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";

export function MetadataPublishSetting() {
  const locale = useInterfaceLanguage();
  const { isOwner } = useAuth();
  const queryClient = useQueryClient();
  const data = useQuery({
    queryKey: ["metadata-publish-store-connections"],
    queryFn: getStoreConnections,
  });
  const connection = data.data?.connections.find(
    (item) => item.store === "APP_STORE",
  );
  const mutate = useMutation({
    mutationFn: setMetadataPublishing,
    onSuccess: () => {
      void data.refetch();
      void queryClient.invalidateQueries({
        queryKey: ["metadata-publish-setting"],
      });
    },
  });
  const zh = locale === "zh-CN";
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <label className="flex items-center gap-3 text-sm font-medium">
        <input
          type="checkbox"
          checked={connection?.metadataPublishEnabled === true}
          disabled={
            !isOwner || !connection || mutate.isPending || data.isPending
          }
          onChange={(event) => mutate.mutate(event.target.checked)}
        />
        {zh
          ? "允许向 App Store Connect 发布元数据"
          : "Allow publishing metadata to App Store Connect"}
      </label>
      <p className="text-sm text-muted-foreground">
        {zh
          ? "默认关闭。需要 App Manager 或 Admin 角色。每次发布仍须逐字段确认，绝不提交审核。"
          : "Off by default. Requires App Manager or Admin. Every change requires confirmation; never submits for review."}
      </p>
      {connection ? (
        <p className="text-sm text-muted-foreground">
          {zh ? "发布权限：" : "Publish access: "}
          {connection.metadataPublishAccess ?? "unknown"}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          {zh
            ? "请先在集成页面连接 App Store Connect。"
            : "Connect App Store Connect in Integrations first."}
        </p>
      )}
      {mutate.error ? (
        <p role="alert" className="text-sm text-destructive">
          {String(mutate.error)}
        </p>
      ) : null}
    </div>
  );
}
