import type { AppsKeywordReportRow } from '@apple/apple-ads-platform';
import { parseCampaignKeywordReport } from './apple-ads-campaign.client';

function row(
  campaignId: number,
  country: string,
  impressions: number,
  spend: string,
): AppsKeywordReportRow {
  return {
    metadata: { campaignId, id: 7, text: 'RADIO', countryOrRegion: country },
    totalMetrics: {
      impressions,
      taps: 12,
      totalInstalls: 3,
      localSpend: { amount: spend, currency: 'USD' },
    },
  };
}

describe('Apple Ads campaign report', () => {
  it('ignores unrelated campaigns and returns per-country metrics', () => {
    const rows = parseCampaignKeywordReport(
      [
        row(100, 'US', 100, '3.12'),
        row(100, 'US', 50, '1.10'),
        row(101, 'US', 500, '21.00'),
        row(100, 'JP', 12, '0.30'),
      ],
      new Set(['100']),
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      campaignId: '100',
      country: 'us',
      keyword: 'radio',
      impressions: 150,
      taps: 24,
      installs: 6,
      spend: 4.22,
      currency: 'USD',
    });
    expect(rows[1].country).toBe('jp');
  });

  it('drops invalid or non-attributed rows', () => {
    expect(
      parseCampaignKeywordReport(
        [row(100, '', 10, '1'), row(100, 'US', 10, 'NaN')],
        new Set(['100']),
      ),
    ).toEqual([]);
  });
});
