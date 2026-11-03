import {
  type AppleAdsApi,
  type AppsKeywordReportRow,
  AppsReportingRequestGroupByEnum,
  TimeRangeGranularityEnum,
  TimeRangeTimeZoneEnum,
  createAppleAdsApi,
} from '@apple/apple-ads-platform';
import { normalizeText } from '@asobeast/shared';
import type { Env } from '../config/env';
import { retryRateLimitedOnce } from './apple-popularity.client';

export interface CampaignKeywordStat {
  campaignId: string;
  keywordId: string;
  keyword: string;
  country: string;
  currency: string;
  impressions: number;
  taps: number;
  installs: number;
  spend: number;
}

const PAGE = 1000;
const MAX_PAGES = 20;

export function parseCampaignKeywordReport(
  rows: AppsKeywordReportRow[],
  campaignIds: Set<string>,
): CampaignKeywordStat[] {
  const result = new Map<string, CampaignKeywordStat>();
  for (const row of rows) {
    const campaignId = String(row.metadata?.campaignId ?? '');
    const keywordId = String(row.metadata?.id ?? '');
    const keyword = normalizeText(row.metadata?.text ?? '');
    const country = row.metadata?.countryOrRegion?.toLowerCase() ?? '';
    const total = row.totalMetrics;
    const spend = Number(total?.localSpend?.amount ?? 0);
    if (
      !campaignIds.has(campaignId) ||
      !keywordId ||
      !keyword ||
      !/^[a-z]{2}$/.test(country) ||
      !Number.isFinite(spend) ||
      spend < 0 ||
      !total
    )
      continue;
    const currency =
      total.localSpend?.currency ?? row.metadata?.bid?.currency ?? '';
    const key = [campaignId, keywordId, country].join(':');
    const prev = result.get(key);
    // A report may include multiple grouped rows for one keyword/country.
    result.set(key, {
      campaignId,
      keywordId,
      keyword,
      country,
      currency: currency || '',
      impressions: (prev?.impressions ?? 0) + (total.impressions ?? 0),
      taps: (prev?.taps ?? 0) + (total.taps ?? 0),
      installs:
        (prev?.installs ?? 0) + (total.totalInstalls ?? total.tapInstalls ?? 0),
      spend:
        (Math.round((prev?.spend ?? 0) * 100) + Math.round(spend * 100)) / 100,
    });
  }
  return [...result.values()];
}

export class AppleAdsCampaignClient {
  constructor(
    private readonly connect: () => Promise<
      Pick<
        AppleAdsApi,
        'getUserAcls' | 'campaignsQueryPost' | 'appsKeywordReports'
      >
    >,
    private readonly accountId?: string,
  ) {}

  async report(
    appStoreId: string,
    start: string,
    end: string,
  ): Promise<CampaignKeywordStat[]> {
    const api = await this.connect();
    const accountId =
      this.accountId ??
      String(
        (await api.getUserAcls()).data.result?.acls?.[0]?.adAccount?.id ?? '',
      );
    if (!accountId) throw new Error('Apple Ads returned no ad account');
    const context = `adAccountId=${accountId}`;
    const campaignIds = new Set<string>();
    for (let page = 0; page < MAX_PAGES; page++) {
      const response = await api.campaignsQueryPost(context, {
        pagination: { offset: page * PAGE, pageSize: PAGE },
      });
      const found = response.data.result ?? [];
      for (const campaign of found) {
        if (campaign.id != null && campaign.promotedObjectId === appStoreId) {
          campaignIds.add(String(campaign.id));
        }
      }
      if (found.length < PAGE) break;
      if (page === MAX_PAGES - 1)
        throw new Error('Apple Ads campaign pagination exceeded safety limit');
    }
    if (!campaignIds.size) return [];
    const rows: AppsKeywordReportRow[] = [];
    for (let page = 0; page < MAX_PAGES; page++) {
      const response = await api.appsKeywordReports(context, {
        groupBy: [AppsReportingRequestGroupByEnum.CountryOrRegion],
        timeRange: {
          start,
          end,
          timeZone: TimeRangeTimeZoneEnum.Utc,
          granularity: TimeRangeGranularityEnum.Daily,
        },
        pagination: { offset: page * PAGE, pageSize: PAGE },
      });
      const found = response.data.result?.rows ?? [];
      rows.push(...found);
      if (found.length < PAGE) break;
      if (page === MAX_PAGES - 1)
        throw new Error('Apple Ads report pagination exceeded safety limit');
    }
    return parseCampaignKeywordReport(rows, campaignIds);
  }
}

export function createCampaignClient(
  config: Pick<
    Env,
    | 'APPLE_ADS_CLIENT_ID'
    | 'APPLE_ADS_TEAM_ID'
    | 'APPLE_ADS_KEY_ID'
    | 'APPLE_ADS_PRIVATE_KEY_PATH'
    | 'APPLE_ADS_AD_ACCOUNT_ID'
  >,
): AppleAdsCampaignClient {
  return new AppleAdsCampaignClient(
    () =>
      createAppleAdsApi({
        authMode: 'key',
        clientId: config.APPLE_ADS_CLIENT_ID ?? '',
        teamId: config.APPLE_ADS_TEAM_ID ?? '',
        keyId: config.APPLE_ADS_KEY_ID ?? '',
        privateKeyPath: config.APPLE_ADS_PRIVATE_KEY_PATH ?? '',
        apiTimeout: 30_000,
        apiAxiosCustomizer: (instance) => retryRateLimitedOnce(instance),
        logger: null,
      }),
    config.APPLE_ADS_AD_ACCOUNT_ID,
  );
}
