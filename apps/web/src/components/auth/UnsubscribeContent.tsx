"use client";

import { useSearchParams } from "next/navigation";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { unsubscribeEmailAlert } from "@/lib/api";
import {
  AlertLinkCard,
  AlertSettingsLink,
  hasStatus,
  INVALID_LINK_STATUSES,
} from "./AlertLinkCard";

export function UnsubscribeContent() {
  const language = useInterfaceLanguage();
  const params = useSearchParams();
  const alertId = params.get("alert") ?? "";
  const token = params.get("token") ?? "";
  const mutation = useMutation({
    mutationFn: () => unsubscribeEmailAlert(alertId, token),
  });

  if (alertId === "" || token === "") {
    return (
      <AlertLinkCard
        title={language === "zh-CN" ? "退订链接不完整" : "Unsubscribe link incomplete"}
        description={language === "zh-CN" ? "请打开提醒邮件中的链接。" : "Open the link from your alert email."}
      >
        <AlertSettingsLink>{language === "zh-CN" ? "在设置中管理提醒" : "Manage alerts in Settings"}</AlertSettingsLink>
      </AlertLinkCard>
    );
  }

  if (mutation.isSuccess) {
    return (
      <AlertLinkCard
        title={language === "zh-CN" ? "已退订" : "You are unsubscribed"}
        description={language === "zh-CN" ? "此地址将不再收到这些提醒。" : "This address will not receive these alerts any more."}
      >
        <AlertSettingsLink>{language === "zh-CN" ? "打开设置" : "Open settings"}</AlertSettingsLink>
      </AlertLinkCard>
    );
  }

  if (mutation.isError && hasStatus(mutation.error, INVALID_LINK_STATUSES)) {
    return (
      <AlertLinkCard
        title={language === "zh-CN" ? "此退订链接无效" : "This unsubscribe link is not valid"}
        description={language === "zh-CN" ? "提醒可能已删除或更换地址。请在设置中管理提醒。" : "The alert may have been deleted or moved to another address. Manage alerts in Settings instead."}
      >
        <AlertSettingsLink>{language === "zh-CN" ? "在设置中管理提醒" : "Manage alerts in Settings"}</AlertSettingsLink>
      </AlertLinkCard>
    );
  }

  return (
    <AlertLinkCard
      title={language === "zh-CN" ? (mutation.isError ? "无法退订" : "停止接收邮件提醒？") : (mutation.isError ? "Could not unsubscribe" : "Stop email alerts?")}
      description={
        language === "zh-CN" ? (mutation.isError ? "请稍后重试。" : "此地址将不再收到此 AsoBeast 邮件提醒，也不会再次收到确认请求。") : mutation.isError
          ? "Try again in a moment."
          : "This address will stop receiving this AsoBeast email alert and will not be asked to confirm it again."
      }
    >
      <Button disabled={mutation.isPending} onClick={() => mutation.mutate()}>
        {mutation.isPending ? <Loader2 className="animate-spin" /> : null}
        {language === "zh-CN" ? "退订" : "Unsubscribe"}
      </Button>
    </AlertLinkCard>
  );
}
