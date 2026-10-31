"use client";

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { toast } from "@/lib/localized-toast";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import type { EmailAlertItem } from "@asobeast/shared";
import {
  ApiError,
  deleteEmailAlert,
  resendEmailAlertConfirmation,
  testEmailAlert,
  updateEmailAlert,
} from "@/lib/api";
import {
  alertsConfigOptions,
  emailAlertsOptions,
  invalidateEmailAlertMutation,
  seedEmailAlert,
} from "@/lib/queries";
import { awaitsConfirmation, recipientToast } from "./email-alert-recipient";
import {
  AlertChannelCard,
  AlertChannelEmpty,
  AlertChannelList,
} from "./alert-channel/AlertChannelCard";
import { AddEmailAlertDialog } from "./AddEmailAlertDialog";
import type { AlertSubscriptionChange } from "./alert-event-copy";
import { AlertChannelRow } from "./alert-channel/AlertChannelRow";
import { useSharedFlight, useSingleFlight } from "@/lib/single-flight";

const SMTP_VARS = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_SECURE",
  "SMTP_USER",
  "SMTP_PASSWORD",
  "SMTP_FROM",
];

function EmailAlertRow({ alert }: { alert: EmailAlertItem }) {
  const language = useInterfaceLanguage();
  const queryClient = useQueryClient();

  const toggle = useMutation({
    mutationFn: (active: boolean) => updateEmailAlert(alert.id, { active }),
    onSuccess: () => invalidateEmailAlertMutation(queryClient),
    onError: () =>
      toast.error(
        language === "zh-CN"
          ? "无法更新邮件提醒"
          : "Could not update email alert",
      ),
  });

  const editEvents = useMutation({
    mutationFn: (change: AlertSubscriptionChange) =>
      updateEmailAlert(alert.id, change),
    onSuccess: (saved) => {
      seedEmailAlert(queryClient, saved);
      invalidateEmailAlertMutation(queryClient);
      toast.success(
        language === "zh-CN"
          ? "邮件提醒事件已保存"
          : "Email alert events saved",
      );
    },
    onError: () =>
      toast.error(
        language === "zh-CN"
          ? "无法保存邮件提醒事件"
          : "Could not save the email alert events",
      ),
  });
  const saveEvents = useSharedFlight(editEvents.mutateAsync);

  const test = useMutation({
    mutationFn: () => testEmailAlert(alert.id),
    onSuccess: (result) => {
      if (result.delivered) {
        toast.success(
          language === "zh-CN" ? "测试邮件已发送" : "Test email sent",
        );
      } else {
        toast.error(
          language === "zh-CN"
            ? "无法发送测试邮件"
            : "Could not send the test email",
        );
      }
    },
    onError: () =>
      toast.error(
        language === "zh-CN"
          ? "无法发送测试邮件"
          : "Could not send the test email",
      ),
  });

  const resend = useMutation({
    mutationFn: () => resendEmailAlertConfirmation(alert.id),
    onSuccess: () =>
      toast.success(
        language === "zh-CN"
          ? `确认邮件已发送至 ${alert.email}`
          : `Confirmation email sent to ${alert.email}`,
        recipientToast(alert),
      ),
    onSettled: () => invalidateEmailAlertMutation(queryClient),
    onError: (err) =>
      toast.error(
        err instanceof ApiError
          ? err.envelope.message
          : language === "zh-CN"
            ? "无法发送确认邮件"
            : "Could not send the confirmation email",
        recipientToast(alert),
      ),
  });

  const testOnce = useSingleFlight(test);
  const resendOnce = useSingleFlight(resend);

  const remove = useMutation({
    mutationFn: () => deleteEmailAlert(alert.id),
    onSuccess: () => {
      invalidateEmailAlertMutation(queryClient);
      toast.success(
        language === "zh-CN" ? "邮件提醒已移除" : "Email alert removed",
      );
    },
    onError: () =>
      toast.error(
        language === "zh-CN"
          ? "无法移除邮件提醒"
          : "Could not remove email alert",
      ),
  });
  const removeOnce = useSharedFlight(remove.mutateAsync);

  return (
    <AlertChannelRow
      label={alert.email}
      channel="email"
      id={alert.id}
      events={alert.events}
      confirmDrops={alert.confirmDrops === true}
      reviewScores={alert.reviewScores}
      awaiting={
        awaitsConfirmation(alert)
          ? {
              pending: resend.isPending,
              onResend: resendOnce,
              unsubscribed: alert.unsubscribed === true,
            }
          : undefined
      }
      active={alert.active}
      activePending={toggle.isPending}
      onActiveChange={(active) => toggle.mutate(active)}
      confirmTitle={
        language === "zh-CN" ? "删除此邮件提醒？" : "Delete this email alert?"
      }
      confirmDescription={
        language === "zh-CN"
          ? `AsoBeast 将停止向 ${alert.email} 发送邮件。此操作无法撤销。`
          : `AsoBeast will stop emailing ${alert.email}. This cannot be undone.`
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

function SetupHint() {
  const language = useInterfaceLanguage();
  return (
    <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
      <p className="font-medium text-foreground">
        {language === "zh-CN"
          ? "邮件提醒未启用。"
          : "Email alerts are disabled."}
      </p>
      <p className="mt-1">
        {language === "zh-CN"
          ? "在 API 中设置 SMTP 环境变量以启用："
          : "Set the SMTP environment variables on the API to enable them:"}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {SMTP_VARS.map((name) => (
          <code
            key={name}
            className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground"
          >
            {name}
          </code>
        ))}
      </div>
      <p className="mt-3">
        <code className="font-mono text-xs">SMTP_HOST</code>{" "}
        {language === "zh-CN" ? "和" : "and"}{" "}
        <code className="font-mono text-xs">SMTP_FROM</code>{" "}
        {language === "zh-CN" ? "为必填项。" : "are required."}
      </p>
    </div>
  );
}

export function EmailAlertsCard() {
  const language = useInterfaceLanguage();
  const { data: config } = useSuspenseQuery(alertsConfigOptions);
  const { data } = useSuspenseQuery(emailAlertsOptions);

  return (
    <AlertChannelCard
      title={language === "zh-CN" ? "邮件" : "Email"}
      action={config.emailEnabled ? <AddEmailAlertDialog /> : null}
    >
      {!config.emailEnabled ? (
        <SetupHint />
      ) : data.length === 0 ? (
        <AlertChannelEmpty>
          {language === "zh-CN"
            ? "暂无邮件提醒。添加收件人后，可通过邮件接收元数据和排名提醒。"
            : "No email alerts yet. Add a recipient to receive metadata and rank alerts by email."}
        </AlertChannelEmpty>
      ) : (
        <AlertChannelList label="Configured email alerts and their subscribed events.">
          {data.map((alert) => (
            <EmailAlertRow key={alert.id} alert={alert} />
          ))}
        </AlertChannelList>
      )}
    </AlertChannelCard>
  );
}
