import { Store } from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service';
import type { KeywordsService } from '../keywords/keywords.service';
import type { AppCaptureService } from '../apps/app-capture.service';
import type { QuotaService } from '../auth/quota.service';
import type { CompetitorCategoryService } from './competitor-category.service';
import { CompetitorsService } from './competitors.service';

describe('untracked SERP competitor discovery', () => {
  it('returns only candidates that pass primary-category verification', async () => {
    const app = {
      id: 'primary',
      store: Store.APP_STORE,
      storeAppId: '1',
      country: 'us',
      competitors: [],
      tracked: [{ keywordId: 'keyword' }],
    };
    const prisma = {
      app: { findFirst: jest.fn().mockResolvedValue(app) },
      serpEntry: {
        findMany: jest.fn().mockResolvedValue([
          {
            storeAppId: '2',
            title: 'Music',
            developer: 'A',
            iconUrl: null,
            ratingAvg: null,
            ratingCount: null,
            position: 1,
            date: new Date('2026-11-01'),
            keyword: { text: 'radio', country: 'us' },
          },
          {
            storeAppId: '3',
            title: 'Productivity',
            developer: 'B',
            iconUrl: null,
            ratingAvg: null,
            ratingCount: null,
            position: 2,
            date: new Date('2026-11-01'),
            keyword: { text: 'radio', country: 'us' },
          },
        ]),
      },
    };
    const categories = {
      withReleaseDates: jest
        .fn()
        .mockImplementation((_app, rows: unknown[]) => Promise.resolve(rows)),
      filter: jest
        .fn()
        .mockImplementation((_app, items: { storeAppId: string }[]) =>
          Promise.resolve(items.filter((item) => item.storeAppId === '2')),
        ),
    };
    const service = new CompetitorsService(
      prisma as unknown as PrismaService,
      {} as KeywordsService,
      {} as AppCaptureService,
      {} as QuotaService,
      categories as unknown as CompetitorCategoryService,
    );
    const result = await service.discovery('primary', { days: 30 });
    expect(result.items.map((item) => item.storeAppId)).toEqual(['2']);
    expect(categories.filter).toHaveBeenCalledWith(
      app,
      expect.arrayContaining([
        expect.objectContaining({ storeAppId: '2' }),
        expect.objectContaining({ storeAppId: '3' }),
      ]),
    );
  });
});
