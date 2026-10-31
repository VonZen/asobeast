"use client";

import { useState } from "react";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import type { FormEvent, ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/localized-toast";
import { REVIEW_SCORES } from "@asobeast/shared";
import type { WebhookEvent } from "@asobeast/shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, createEmailAlert } from "@/lib/api";
import { invalidateEmailAlertMutation } from "@/lib/queries";
import { useSingleFlight } from "@/lib/single-flight";
import { needsAStar, reviewScoresToSend } from "./alert-event-copy";
import { AlertSubscriptionFields } from "./alert-events";
import { ConfirmDropsField } from "./ConfirmDropsField";
import { AlertChannelDialog } from "./alert-channel/AlertChannelDialog";
import { awaitsConfirmation, recipientToast } from "./email-alert-recipient";

export function AddEmailAlertDialog({ trigger }: { trigger?: ReactNode }) {
  const language = useInterfaceLanguage();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [events, setEvents] = useState<WebhookEvent[]>(["metadata.changed"]);
  const [stars, setStars] = useState<number[]>([...REVIEW_SCORES]);
  const [confirmDrops, setConfirmDrops] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      createEmailAlert({
        email,
        events,
        reviewScores: reviewScoresToSend(events, stars),
        confirmDrops,
      }),
    onSuccess: (saved) => {
      invalidateEmailAlertMutation(queryClient);
      if (saved.confirmationSent === false) {
        toast.warning(
          language === "zh-CN"
            ? `邮件提醒已添加，但无法向 ${saved.email} 发送确认邮件，请使用“重新发送确认邮件”重试。`
            : `Email alert added. The confirmation email to ${saved.email} could not be sent, so use Resend confirmation to try again.`,
          recipientToast(saved),
        );
      } else {
        toast.success(
          awaitsConfirmation(saved)
            ? language === "zh-CN"
              ? `确认邮件已发送至 ${saved.email}`
              : `Confirmation email sent to ${saved.email}`
            : language === "zh-CN"
              ? "邮件提醒已添加"
              : "Email alert added",
          recipientToast(saved),
        );
      }
      onOpenChange(false);
    },
    onError: (err) => {
      setError(
        err instanceof ApiError
          ? err.envelope.message
          : language === "zh-CN"
            ? "无法添加邮件提醒"
            : "Could not add email alert",
      );
    },
  });
  const createOnce = useSingleFlight(mutation);

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) return;
    setEmail("");
    setEvents(["metadata.changed"]);
    setStars([...REVIEW_SCORES]);
    setConfirmDrops(true);
    setError(null);
  }

  function submit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setError(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(
        language === "zh-CN"
          ? "请输入有效的邮箱地址"
          : "Enter a valid email address",
      );
      return;
    }
    if (events.length === 0) {
      setError(
        language === "zh-CN"
          ? "请至少选择一个事件"
          : "Select at least one event",
      );
      return;
    }
    if (needsAStar(events, stars)) {
      setError(
        language === "zh-CN" ? "请至少选择一个星级" : "Pick at least one star",
      );
      return;
    }

    createOnce();
  }

  return (
    <AlertChannelDialog
      open={open}
      onOpenChange={onOpenChange}
      label={language === "zh-CN" ? "添加邮件提醒" : "Add email alert"}
      description={
        language === "zh-CN"
          ? "订阅的事件发生时，AsoBeast 会通过已配置的 SMTP 服务器向此收件人发送邮件。除非该地址是此工作区成员已验证的账号邮箱，否则收件人需要通过首封邮件中的链接确认地址。"
          : "AsoBeast emails this recipient when a subscribed event fires, using your configured SMTP server. Unless it is the verified account email of a member of this workspace, the recipient confirms the address from the link in a first email."
      }
      error={error}
      pending={mutation.isPending}
      onSubmit={submit}
      trigger={trigger}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="email-alert-address">
          {language === "zh-CN" ? "收件人邮箱" : "Recipient email"}
        </Label>
        <Input
          id="email-alert-address"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="alerts@example.com"
          aria-invalid={error !== null}
        />
      </div>

      <AlertSubscriptionFields
        events={events}
        stars={stars}
        onEventsChange={setEvents}
        onStarsChange={setStars}
      />

      <ConfirmDropsField checked={confirmDrops} onChange={setConfirmDrops} />
    </AlertChannelDialog>
  );
}
