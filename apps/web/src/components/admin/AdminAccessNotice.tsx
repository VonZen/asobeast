"use client";

import Link from "next/link";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { Button } from "@/components/ui/button";
import type { ClosedAdminAccess } from "@/lib/admin-access";

const GUIDE_URL =
  "https://docs.asobeast.com/security/admin-surfaces#when-the-operators-workspace-has-no-plan";

const NOTICES: Record<
  ClosedAdminAccess,
  { title: string; body: string; offersPlans: boolean }
> = {
  "needs-plan": {
    title: "Your workspace needs a plan to open the admin area",
    body: "The admin pages, the queue dashboard, the API docs and the metrics endpoint open only while the operator's own workspace has a plan in force. Yours has none, so each of them answers not found. On a self hosted instance with billing on, you can also set plan on the bootstrap workspace in the database.",
    offersPlans: true,
  },
  "awaits-confirmation": {
    title: "Confirm your email to open the admin area",
    body: "Your workspace's free trial starts when you confirm your address, and the admin area opens with it. Use the link we emailed you, or send a new one from the banner above.",
    offersPlans: false,
  },
};

export function AdminAccessNotice({ access }: { access: ClosedAdminAccess }) {
  const { title, body, offersPlans } = NOTICES[access];
  const locale = useInterfaceLanguage();
  const zh = locale === "zh-CN";
  const translated = access === "needs-plan"
    ? {
        title: "工作区需要有效套餐才能访问管理后台",
        body: "只有管理员所属工作区拥有有效套餐时，才能访问管理页面、队列面板、API 文档和指标接口。当前工作区没有有效套餐，因此这些地址会返回未找到。自托管且启用计费的实例也可以在数据库中为初始工作区设置套餐。",
      }
    : {
        title: "验证邮箱后即可访问管理后台",
        body: "验证邮箱后，工作区的免费试用将开始，同时开放管理后台。请使用邮件中的验证链接，或通过上方横幅重新发送验证邮件。",
      };

  return (
    <section
      aria-labelledby="admin-access-title"
      className="flex flex-col items-center gap-4 rounded-xl border border-dashed py-16 text-center"
    >
      <div className="flex flex-col gap-1">
        <h2 id="admin-access-title" className="font-medium">
          {zh ? translated.title : title}
        </h2>
        <p className="max-w-lg text-body text-muted-foreground">{zh ? translated.body : body}</p>
      </div>
      {offersPlans ? (
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link href="/upgrade">{zh ? "选择套餐" : "Choose a plan"}</Link>
          </Button>
          <Button asChild variant="outline">
            <a href={GUIDE_URL} target="_blank" rel="noreferrer">
              {zh ? "阅读指南" : "Read the guide"}
              <span className="sr-only">{zh ? "（在新标签页打开）" : " (opens in a new tab)"}</span>
            </a>
          </Button>
        </div>
      ) : null}
    </section>
  );
}
