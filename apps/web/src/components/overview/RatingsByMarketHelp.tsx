"use client";

import { InfoTip } from "@/components/ui/info-tip";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { PRODUCT_NAME } from "@/lib/brand";

export const RATINGS_BY_MARKET_GUIDE =
  "https://docs.asobeast.com/guides/reviews#compare-ratings-across-markets";

export function RatingsByMarketHelp() {
  const zh = useInterfaceLanguage() === "zh-CN";
  return (
    <InfoTip
      label={zh ? "了解各市场评分" : "About ratings by market"}
      title={zh ? "各市场评分如何统计" : "How ratings by market are read"}
      summary={
        zh
          ? `App Store 为每个商店市场单独记录评分。每行显示 ${PRODUCT_NAME} 在该市场最近一次采集的平均评分和评分数量。`
          : `The App Store keeps a separate rating for each storefront. Each row is the average and the number of ratings on the newest listing ${PRODUCT_NAME} captured in that market.`
      }
    >
      <p className="text-muted-foreground">
        {zh
          ? "最后一行是以上各市场的加权平均分，以每个市场的评分数量作为权重。它仅包含此处列出的市场，而非所有商店市场。各市场的采集日期见最后一列。"
          : "The last row averages the markets above it, each weighted by its number of ratings. It covers only the markets listed here, not every storefront, and each market was captured on the day in its last column."}
      </p>
      <a
        href={RATINGS_BY_MARKET_GUIDE}
        target="_blank"
        rel="noreferrer"
        className="font-medium text-foreground underline decoration-primary underline-offset-4 hover:decoration-2"
      >
        {zh ? "查看各市场评分统计方式" : "Read how ratings by market are read"}
      </a>
    </InfoTip>
  );
}
