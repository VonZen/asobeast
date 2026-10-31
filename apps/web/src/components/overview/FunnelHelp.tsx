"use client";

import type { Store } from "@asobeast/shared";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { InfoTip } from "@/components/ui/info-tip";

export const STORE_FUNNEL_GUIDE =
  "https://docs.asobeast.com/guides/store-funnel";

const HELP: Record<Store, { summary: string; detail: string }> = {
  APP_STORE: {
    summary:
      "Impressions, product page views and Get taps come from Apple's App Store Discovery and Engagement report through the App Store Connect key connected in Integrations. Conversion is Get taps divided by unique impressions.",
    detail:
      "Apple drops rows under five users and adds small noise, and a day is final three days later. Totals add unique counts across markets and sources, so they read slightly high.",
  },
  GOOGLE_PLAY: {
    summary:
      "Store listing visitors and acquisitions come from the monthly store performance files Play Console writes to its Cloud Storage bucket, read through the Google Play connection in Integrations. Conversion is acquisitions divided by visitors.",
    detail:
      "A market reads the country file and All markets the traffic source file, so the two split sources differently. Google posts a day three to seven days later and changed how it counts visitors and acquisitions on July 10, 2026, so compare periods on the same side of that date.",
  },
};

const HELP_ZH: Record<Store, { summary: string; detail: string }> = {
  APP_STORE: {
    summary:
      "曝光量、产品页面浏览量和“获取”点击次数来自 App Store Connect 中连接的密钥所提供的 Apple App Store「发现」与「互动」报告。转化率等于“获取”点击次数除以去重曝光量。",
    detail:
      "Apple 会省略用户数少于 5 的记录并加入少量统计噪声，每日数据通常在三天后确定。跨市场和来源汇总时会叠加各自的去重计数，因此总数可能略高。",
  },
  GOOGLE_PLAY: {
    summary:
      "商品详情页访问人数与获客量来自 Google Play Console 每月存放在 Cloud Storage 中的商店表现文件，通过「集成」中的 Google Play 连接读取。转化率等于获客量除以访问人数。",
    detail:
      "单个市场使用国家文件，「所有市场」使用流量来源文件，因此划分口径不同。Google 通常延迟 3 至 7 天发布每日数据，并于 2026 年 7 月 10 日调整了访问人数和获客量的计算方式。比较时应选择该日期同侧的时间段。",
  },
};

export function FunnelHelp({ store }: { store: Store }) {
  const zh = useInterfaceLanguage() === "zh-CN";
  const help = (zh ? HELP_ZH : HELP)[store];
  return (
    <InfoTip
      label={zh ? "了解商店转化漏斗" : "About the store funnel"}
      title={zh ? "商店转化漏斗" : "Store funnel"}
      summary={help.summary}
    >
      <p className="text-muted-foreground">{help.detail}</p>
      <a
        href={STORE_FUNNEL_GUIDE}
        target="_blank"
        rel="noreferrer"
        className="font-medium text-foreground underline decoration-primary underline-offset-4 hover:decoration-2"
      >
        {zh ? "了解指标统计口径" : "Read how the numbers are read"}
      </a>
    </InfoTip>
  );
}
