"use client";

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { KeyRound } from "lucide-react";
import { toast } from "@/lib/localized-toast";
import { webhookChannelOf, type WebhookItem } from "@asobeast/shared";
import { Badge } from "@/components/ui/badge";
import { deleteWebhook, testWebhook, updateWebhook } from "@/lib/api";
import {
  invalidateWebhookMutation,
  seedWebhook,
  webhooksOptions,
} from "@/lib/queries";
import {
  AlertChannelCard,
  AlertChannelEmpty,
  AlertChannelList,
} from "./alert-channel/AlertChannelCard";
import { AddWebhookDialog } from "./AddWebhookDialog";
import type { AlertSubscriptionChange } from "./alert-event-copy";
import { AlertChannelRow } from "./alert-channel/AlertChannelRow";
import { useSharedFlight, useSingleFlight } from "@/lib/single-flight";
import { WEBHOOK_CHANNEL_NAMES, webhookRowLabel } from "./webhook-channel-copy";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";

function WebhookRow({ webhook }: { webhook: WebhookItem }) {
  const chinese = useInterfaceLanguage() === "zh-CN";
  const queryClient = useQueryClient();
  const channel = webhook.channel ?? webhookChannelOf(webhook.url);
  const label = webhookRowLabel(webhook.url, channel);

  const toggle = useMutation({
    mutationFn: (active: boolean) => updateWebhook(webhook.id, { active }),
    onSuccess: () => invalidateWebhookMutation(queryClient),
    onError: () =>
      toast.error(chinese ? "无法更新 Webhook" : "Could not update webhook"),
  });

  const editEvents = useMutation({
    mutationFn: (change: AlertSubscriptionChange) =>
      updateWebhook(webhook.id, change),
    onSuccess: (saved) => {
      seedWebhook(queryClient, saved);
      invalidateWebhookMutation(queryClient);
      toast.success(chinese ? "Webhook 事件已保存" : "Webhook events saved");
    },
    onError: () =>
      toast.error(
        chinese ? "无法保存 Webhook 事件" : "Could not save the webhook events",
      ),
  });
  const saveEvents = useSharedFlight(editEvents.mutateAsync);

  const test = useMutation({
    mutationFn: () => testWebhook(webhook.id),
    onSuccess: (result) => {
      if (result.delivered) {
        toast.success(
          chinese
            ? `已发送（状态 ${result.status ?? "—"}）`
            : `Delivered (status ${result.status ?? "—"})`,
        );
      } else {
        toast.error(
          chinese
            ? `未发送${result.status !== null ? `（状态 ${result.status}）` : ""}`
            : `Not delivered${result.status !== null ? ` (status ${result.status})` : ""}`,
        );
      }
    },
    onError: () =>
      toast.error(chinese ? "无法连接 Webhook" : "Could not reach the webhook"),
  });

  const testOnce = useSingleFlight(test);

  const remove = useMutation({
    mutationFn: () => deleteWebhook(webhook.id),
    onSuccess: () => {
      invalidateWebhookMutation(queryClient);
      toast.success(chinese ? "Webhook 已删除" : "Webhook removed");
    },
    onError: () =>
      toast.error(chinese ? "无法删除 Webhook" : "Could not remove webhook"),
  });
  const removeOnce = useSharedFlight(remove.mutateAsync);

  return (
    <AlertChannelRow
      label={label}
      channel="webhook"
      id={webhook.id}
      events={webhook.events}
      confirmDrops={webhook.confirmDrops === true}
      reviewScores={webhook.reviewScores}
      tag={
        <>
          {channel !== "generic" && (
            <Badge variant="outline">{WEBHOOK_CHANNEL_NAMES[channel]}</Badge>
          )}
          {webhook.hasSecret && (
            <Badge variant="secondary">
              <KeyRound />
              {chinese ? "已签名" : "Signed"}
            </Badge>
          )}
        </>
      }
      active={webhook.active}
      activePending={toggle.isPending}
      onActiveChange={(active) => toggle.mutate(active)}
      confirmTitle={chinese ? "删除此 Webhook？" : "Delete this webhook?"}
      confirmDescription={
        chinese
          ? `AsoBeast 将停止向 ${label} 发送提醒。此操作无法撤销。`
          : `AsoBeast will stop delivering alerts to ${label}. This cannot be undone.`
      }
      testPending={test.isPending}
      onTest={testOnce}
      deletePending={remove.isPending}
      onDelete={removeOnce}
      eventsPending={editEvents.isPending}
      onEventsSave={saveEvents}
    />
  );
}

export function WebhooksCard() {
  const chinese = useInterfaceLanguage() === "zh-CN";
  const { data } = useSuspenseQuery(webhooksOptions);

  return (
    <AlertChannelCard title="Webhooks" action={<AddWebhookDialog />}>
      {data.length === 0 ? (
        <AlertChannelEmpty>
          {chinese
            ? "尚未添加 Webhook。添加后可在 Discord、Slack、Microsoft Teams、Telegram、Google Chat 或你自己的服务中接收元数据和排名提醒。"
            : "No webhooks yet. Add one to receive metadata and rank alerts in Discord, Slack, Microsoft Teams, Telegram, Google Chat or your own endpoint."}
        </AlertChannelEmpty>
      ) : (
        <AlertChannelList
          label={
            chinese
              ? "已配置的提醒 Webhook 及其订阅事件。"
              : "Configured alert webhooks and their subscribed events."
          }
        >
          {data.map((webhook) => (
            <WebhookRow key={webhook.id} webhook={webhook} />
          ))}
        </AlertChannelList>
      )}
    </AlertChannelCard>
  );
}
