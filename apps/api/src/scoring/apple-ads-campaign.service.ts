import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { appleAdsEnabled } from '../config/apple-ads-config';
import type { Env } from '../config/env';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceContext } from '../common/tenancy/workspace-context';
import {
  createCampaignClient,
  type CampaignKeywordStat,
} from './apple-ads-campaign.client';

const DAY = 86_400_000;
const lastCompleteDay = (date: Date): Date =>
  new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - 1),
  );

@Injectable()
export class AppleAdsCampaignService {
  constructor(
    private readonly config: ConfigService<Env, true>,
    private readonly prisma: PrismaService,
    private readonly workspace: WorkspaceContext,
  ) {}

  private credentials() {
    return {
      APPLE_ADS_CLIENT_ID: this.config.get('APPLE_ADS_CLIENT_ID', {
        infer: true,
      }),
      APPLE_ADS_TEAM_ID: this.config.get('APPLE_ADS_TEAM_ID', { infer: true }),
      APPLE_ADS_KEY_ID: this.config.get('APPLE_ADS_KEY_ID', { infer: true }),
      APPLE_ADS_PRIVATE_KEY_PATH: this.config.get(
        'APPLE_ADS_PRIVATE_KEY_PATH',
        { infer: true },
      ),
      APPLE_ADS_AD_ACCOUNT_ID: this.config.get('APPLE_ADS_AD_ACCOUNT_ID', {
        infer: true,
      }),
    };
  }

  async app(appId: string) {
    const app = await this.prisma.app.findFirst({
      where: { id: appId, store: 'APP_STORE', isCompetitor: false },
      select: { id: true, workspaceId: true, storeAppId: true },
    });
    if (!app) throw new NotFoundException('Owned App Store app not found');
    return app;
  }

  async summary(appId: string, country?: string) {
    await this.app(appId);
    if (!appleAdsEnabled(this.credentials()))
      return { configured: false, rows: [], markets: [] };
    const records = await this.prisma.appleAdsKeywordStat.findMany({
      where: { appId, ...(country ? { country: country.toLowerCase() } : {}) },
      orderBy: [{ country: 'asc' }, { impressions: 'desc' }],
    });
    const rows = records.map((record) => ({
      campaignId: record.campaignId,
      keywordId: record.keywordId,
      keyword: record.keyword,
      country: record.country,
      currency: record.currency,
      impressions: record.impressions,
      taps: record.taps,
      installs: record.installs,
      spend: record.spend.toNumber(),
      rangeStart: record.rangeStart.toISOString().slice(0, 10),
      rangeEnd: record.rangeEnd.toISOString().slice(0, 10),
    }));
    const markets = [...new Set(rows.map((row) => row.country))];
    return { configured: true, rows, markets };
  }

  async sync(appId: string) {
    const app = await this.app(appId);
    const credentials = this.credentials();
    if (!appleAdsEnabled(credentials))
      throw new ConflictException('Apple Ads credentials are not configured');
    const end = lastCompleteDay(new Date());
    const start = new Date(end.getTime() - 29 * DAY);
    const stats = await createCampaignClient(credentials).report(
      app.storeAppId,
      start.toISOString().slice(0, 10),
      end.toISOString().slice(0, 10),
    );
    // All remote pages must succeed before replacing any persisted campaign rows.
    const normalized = stats.map((row: CampaignKeywordStat) => ({
      ...row,
      appId,
      workspaceId: this.workspace.require('Apple Ads reports'),
      spend: new Prisma.Decimal(row.spend.toFixed(4)),
      rangeStart: start,
      rangeEnd: end,
      syncedAt: new Date(),
    }));
    await this.prisma.withTransaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${appId}))`;
      await tx.appleAdsKeywordStat.deleteMany({ where: { appId } });
      if (normalized.length)
        await tx.appleAdsKeywordStat.createMany({ data: normalized });
    });
    return {
      campaigns: new Set(stats.map((row) => row.campaignId)).size,
      keywords: stats.length,
      from: start.toISOString().slice(0, 10),
      through: end.toISOString().slice(0, 10),
    };
  }
}
