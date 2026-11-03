import { apiFetch, withQuery } from "./client";

export interface AppleAdsKeywordStat {
  campaignId: string;
  keywordId: string;
  keyword: string;
  country: string;
  currency: string;
  impressions: number;
  taps: number;
  installs: number;
  spend: number;
  rangeStart: string;
  rangeEnd: string;
}
export interface AppleAdsCampaignSummary {
  configured: boolean;
  rows: AppleAdsKeywordStat[];
  markets: string[];
}

export function getAppleAdsCampaignStats(
  appId: string,
  country?: string,
): Promise<AppleAdsCampaignSummary> {
  return apiFetch(
    withQuery(
      `/apps/${appId}/apple-ads`,
      new URLSearchParams(country ? { country } : {}),
    ),
  );
}
export function syncAppleAdsCampaigns(appId: string): Promise<{
  campaigns: number;
  keywords: number;
  from: string;
  through: string;
}> {
  return apiFetch(`/apps/${appId}/apple-ads/sync`, { method: "POST" });
}
