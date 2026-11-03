import { Store } from '@prisma/client';
import type { TrackedKeywordItem } from '@asobeast/shared';
import { KeywordsService } from '../keywords/keywords.service';
import { PrismaService } from '../prisma/prisma.service';
import type { ScreenshotPolicy } from '../screenshots/screenshot-policy';
import { ScreenshotsService } from '../screenshots/screenshots.service';
import { MetadataService } from './metadata.service';
import type { StoreConnectionService } from '../store-connect/store-connection.service';

const tracked = (text: string, country: string): TrackedKeywordItem => ({
  keywordId: `kw_${text}_${country}`,
  text,
  country,
  source: 'MANUAL',
  active: true,
  latestPosition: null,
  latestDepth: null,
  previousPosition: null,
  positionDelta1d: null,
  positionDelta7d: null,
  traffic: null,
  difficulty: null,
  volume: null,
  relevance: null,
  opportunity: null,
  bucket: null,
  scoredAt: null,
  scoreProvenance: null,
  serpVolatility7d: null,
});

const listing = (id: string, title: string) => ({
  id,
  title,
  subtitle: null,
  summary: null,
  description: '',
});

const shot = (snapshotId: string, position: number, caption: string) => ({
  snapshotId,
  workspaceId: 'ws_1',
  position,
  url: `https://is1-ssl.mzstatic.com/image/thumb/${snapshotId}/${position}.jpg`,
  assetKey: `${snapshotId}/${position}`,
  status: 'read',
  caption,
  recipe: null,
  readAt: null,
});

const build = (
  store: Store,
  options: {
    listings?: Record<string, ReturnType<typeof listing>>;
    tracked?: TrackedKeywordItem[];
    country?: string;
  } = {},
) => {
  const listings = options.listings ?? {
    home: listing('snap_us', 'Focus Timer'),
    de: listing('snap_de', 'Fokus Timer'),
  };
  const appSnapshot = {
    findMany: jest.fn(
      ({
        where,
      }: {
        where: { country: string | null; localization: { in: string[] } };
      }) =>
        Promise.resolve(
          where.localization.in.flatMap((tag) => {
            const found = listings[`${where.country ?? 'home'}:${tag}`];
            return found ? [{ ...found, localization: tag }] : [];
          }),
        ),
    ),
    findFirst: jest.fn(
      ({
        where,
      }: {
        where: { country: string | null; localization: string | null };
      }) =>
        Promise.resolve(
          listings[
            [where.country ?? 'home', where.localization]
              .filter(Boolean)
              .join(':')
          ] ?? null,
        ),
    ),
  };
  const snapshotScreenshot = {
    findMany: jest
      .fn()
      .mockResolvedValue([
        shot('snap_us', 1, 'Track every habit'),
        shot('snap_de', 1, 'Gewohnheiten verfolgen'),
      ]),
  };
  const prisma = {
    app: {
      findFirst: jest.fn().mockResolvedValue({
        id: 'app_1',
        store,
        name: 'Focus Timer',
        country: options.country ?? 'us',
        storeAppId: '123',
        isCompetitor: false,
      }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    appSnapshot,
    snapshotScreenshot,
    keywordField: { findMany: jest.fn().mockResolvedValue([]) },
    appLocalization: { findMany: jest.fn().mockResolvedValue([]) },
  } as unknown as PrismaService;
  const keywords = {
    listTracked: jest
      .fn()
      .mockResolvedValue(
        options.tracked ?? [
          tracked('habit', 'us'),
          tracked('gewohnheiten', 'de'),
          tracked('habit', 'de'),
        ],
      ),
  } as unknown as KeywordsService;
  const policy = {
    state: jest
      .fn()
      .mockReturnValue(store === Store.GOOGLE_PLAY ? 'unsupported' : 'on'),
  } as unknown as ScreenshotPolicy;
  const connection = {
    openAppStoreMetadata: jest.fn().mockResolvedValue(null),
  };
  const service = new MetadataService(
    prisma,
    keywords,
    new ScreenshotsService(prisma, policy),
    connection as unknown as StoreConnectionService,
  );
  return { service, appSnapshot, snapshotScreenshot, connection };
};

describe('MetadataService.audit', () => {
  it('reads each listing once and takes its screenshots from that snapshot', async () => {
    const { service, appSnapshot, snapshotScreenshot } = build(Store.APP_STORE);

    const result = await service.audit('app_1');

    expect(appSnapshot.findFirst).toHaveBeenCalledTimes(2);
    expect(snapshotScreenshot.findMany).toHaveBeenCalledTimes(1);
    expect(snapshotScreenshot.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { snapshotId: { in: ['snap_us', 'snap_de'] } },
      }),
    );
    expect(
      result.coverage.map((row) => [row.text, row.screenshotText]),
    ).toEqual([
      ['habit', { covered: true, positions: [1] }],
      ['gewohnheiten', { covered: true, positions: [1] }],
      ['habit', { covered: false, positions: [] }],
    ]);
  });

  it('covers a keyword of a market through the native localization of that market', async () => {
    const { service } = build(Store.APP_STORE, {
      listings: {
        home: listing('snap_us', 'Where Am I? GeoGuess Map Quiz'),
        pl: listing('snap_pl', 'Where Am I? GeoGuess Map Quiz'),
        'pl:pl': listing('snap_pl_pl', 'Where Am I? Quiz Geograficzny'),
      },
      tracked: [tracked('quiz geograficzny', 'pl')],
    });

    const result = await service.audit('app_1');

    expect(result.coverage[0]).toMatchObject({
      uncovered: false,
      listingCountry: 'pl',
      fields: [
        { field: 'title', covered: true, localization: 'pl' },
        { field: 'subtitle', covered: false },
      ],
    });
  });

  it('suggests a keyword field for the localization being read', async () => {
    const { service } = build(Store.APP_STORE, {
      listings: {
        home: listing('snap_us', 'Where Am I? GeoGuess Map Quiz'),
        'home:pl': listing('snap_us_pl', 'Where Am I? Quiz Geograficzny'),
      },
      tracked: [tracked('quiz geograficzny', 'pl')],
      country: 'pl',
    });

    const result = await service.audit('app_1', undefined, 'pl');

    expect(result.localization).toBe('pl');

    expect(result.keywordFieldSuggestion).toMatchObject({
      localization: 'pl',
    });
  });

  it('prefers connected App Store Connect metadata and its keyword field', async () => {
    const { service, connection } = build(Store.APP_STORE);
    const api = {
      snapshots: jest.fn().mockResolvedValue([
        {
          locale: 'en-US',
          fields: {
            name: 'TuneRadar: Music Radio',
            subtitle: 'Lofi, Jazz & World Stations',
            keywords: 'radio,lofi,jazz',
            description: 'Official description',
            promotionalText: 'Browse stations',
            whatsNew: 'Discover more music',
          },
          versionState: 'PREPARE_FOR_SUBMISSION',
          versionString: '3.0',
        },
      ]),
    };
    connection.openAppStoreMetadata.mockResolvedValue({
      status: 'active',
      api,
    });
    const result = await service.audit('app_1');
    expect(result.metadataSource).toBe('app-store-connect');
    expect(result.fields.find((field) => field.field === 'title')?.value).toBe(
      'TuneRadar: Music Radio',
    );
    expect(
      result.fields.find((field) => field.field === 'subtitle')?.value,
    ).toBe('Lofi, Jazz & World Stations');
    expect(
      result.fields.find((field) => field.field === 'keywordField')?.value,
    ).toBe('radio,lofi,jazz');
    expect(
      result.fields.find((field) => field.field === 'promotionalText')?.value,
    ).toBe('Browse stations');
    expect(
      result.fields.find((field) => field.field === 'whatsNew')?.value,
    ).toBe('Discover more music');
    expect(api.snapshots).toHaveBeenCalledWith('123');
  });

  it('reports ASC errors and falls back without erasing stored metadata', async () => {
    const { service, connection } = build(Store.APP_STORE);
    connection.openAppStoreMetadata.mockResolvedValue({
      status: 'active',
      api: {
        snapshots: jest.fn().mockRejectedValue(new Error('ASC unavailable')),
      },
    });
    const result = await service.audit('app_1');
    expect(result.metadataSource).toBe('storefront-snapshot');
    expect(result.metadataSourceWarning).toContain('could not be read');
    expect(result.fields.find((field) => field.field === 'title')?.value).toBe(
      'Focus Timer',
    );
  });

  it('never reads screenshots for a google play audit', async () => {
    const { service, appSnapshot, snapshotScreenshot } = build(
      Store.GOOGLE_PLAY,
    );

    const result = await service.audit('app_1');

    expect(appSnapshot.findFirst).toHaveBeenCalledTimes(2);
    expect(snapshotScreenshot.findMany).not.toHaveBeenCalled();
    expect('screenshotText' in result).toBe(false);
  });
});
