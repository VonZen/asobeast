"use client";

import { useSearchParams } from "next/navigation";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { confirmEmailAlert } from "@/lib/api";
import {
  AlertLinkCard,
  AlertSettingsLink,
  hasStatus,
  INVALID_LINK_STATUSES,
} from "./AlertLinkCard";

const EXPIRED_STATUS = 410;

export function ConfirmAlertContent() {
  const language = useInterfaceLanguage();
  const params = useSearchParams();
  const alertId = params.get("alert") ?? "";
  const token = params.get("token") ?? "";
  const mutation = useMutation({
    mutationFn: () => confirmEmailAlert(alertId, token),
  });

  if (alertId === "" || token === "") {
    return (
      <AlertLinkCard
        title={language === "zh-CN" ? "确认链接不完整" : "Confirmation link incomplete"}
        description={language === "zh-CN" ? "请打开确认邮件中的链接。" : "Open the link from your confirmation email."}
      >
        <AlertSettingsLink>{language === "zh-CN" ? "在设置中管理提醒" : "Manage alerts in Settings"}</AlertSettingsLink>
      </AlertLinkCard>
    );
  }

  if (mutation.isSuccess) {
    return (
      <AlertLinkCard
        title={language === "zh-CN" ? "提醒邮件已确认" : "Alert emails confirmed"}
        description={language === "zh-CN" ? "此地址现在会收到所订阅的提醒。每封提醒邮件都包含退订链接。" : "This address will now receive the alerts it was added for. Every alert email has an unsubscribe link."}
      >
        <AlertSettingsLink>{language === "zh-CN" ? "打开设置" : "Open settings"}</AlertSettingsLink>
      </AlertLinkCard>
    );
  }

  if (mutation.isError && hasStatus(mutation.error, INVALID_LINK_STATUSES)) {
    return (
      <AlertLinkCard
        title={language === "zh-CN" ? "此确认链接无效" : "This confirmation link is not valid"}
        description={language === "zh-CN" ? "提醒可能已删除、更换地址或发送了新链接。请联系添加此地址的人重新发送确认邮件。" : "The alert may have been deleted, moved to another address or sent a newer link. Ask whoever added this address to resend the confirmation."}
      >
        <AlertSettingsLink>{language === "zh-CN" ? "在设置中管理提醒" : "Manage alerts in Settings"}</AlertSettingsLink>
      </AlertLinkCard>
    );
  }

  if (mutation.isError && hasStatus(mutation.error, [EXPIRED_STATUS])) {
    return (
      <AlertLinkCard
        title={language === "zh-CN" ? "此确认链接已过期" : "This confirmation link has expired"}
        description={language === "zh-CN" ? "请联系添加此地址的人，在设置中重新发送确认邮件。" : "Ask whoever added this address to resend the confirmation from Settings."}
      >
        <AlertSettingsLink>{language === "zh-CN" ? "在设置中管理提醒" : "Manage alerts in Settings"}</AlertSettingsLink>
      </AlertLinkCard>
    );
  }

  return (
    <AlertLinkCard
      title={language === "zh-CN" ? (mutation.isError ? "无法确认" : "确认接收提醒邮件？") : (mutation.isError ? "Could not confirm" : "Confirm alert emails?")}
      description={
        language === "zh-CN" ? (mutation.isError ? "请稍后重试。" : "AsoBeast 将开始向此地址发送有关排名、商品页和评论变化的提醒。每封邮件都包含退订链接。") : mutation.isError
          ? "Try again in a moment."
          : "AsoBeast will start emailing this address about rank, listing and review changes. Every email has an unsubscribe link."
      }
    >
      <Button disabled={mutation.isPending} onClick={() => mutation.mutate()}>
        {mutation.isPending ? <Loader2 className="animate-spin" /> : null}
        {language === "zh-CN" ? "确认邮箱地址" : "Confirm email address"}
      </Button>
    </AlertLinkCard>
  );
}
