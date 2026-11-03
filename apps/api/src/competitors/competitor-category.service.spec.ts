import { Store } from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service';
import type { ProxyEgress } from '../store-providers/egress/proxy-egress.service';
import type { StoreProviderRegistry } from '../store-providers/store-provider.registry';
import { CompetitorCategoryService } from './competitor-category.service';

const app = {
  id: 'primary',
  store: Store.APP_STORE,
  storeAppId: '1',
  country: 'us',
};

const candidate = (storeAppId: string, genreId?: string) => ({
  storeAppId,
  title: storeAppId,
  ...(genreId ? { genreId } : {}),
});

function setup(genre: unknown = { primaryGenreId: 6011 }) {
  const findFirst = jest.fn().mockResolvedValue({ raw: genre });
  const primaryGenres = jest.fn().mockImplementation((ids: string[]) =>
    Promise.resolve(
      new Map(
        ids.flatMap((id) => {
          const genres: Record<string, string> = {
            '2': '6011',
            '3': '6007',
            '4': '6011',
          };
          return genres[id] ? [[id, genres[id]]] : [];
        }),
      ),
    ),
  );
  const releaseDates = jest
    .fn()
    .mockResolvedValue(new Map([['2', new Date('2020-07-04')]]));
  const provider = { primaryGenres, releaseDates };
  const egress = {
    through: jest.fn(
      (_store, _country, work: () => Promise<Map<string, string>>) => work(),
    ),
  };
  const service = new CompetitorCategoryService(
    { appSnapshot: { findFirst } } as unknown as PrismaService,
    { get: () => provider } as unknown as StoreProviderRegistry,
    egress as unknown as ProxyEgress,
  );
  return { service, findFirst, primaryGenres, releaseDates, egress };
}

describe('untracked competitor category restriction', () => {
  it('shows only the same primary genre as the current app', async () => {
    const { service, primaryGenres } = setup();
    const result = await service.filter(app, [
      candidate('2'),
      candidate('3'),
      candidate('4', '6011'),
      candidate('5'),
    ]);
    expect(result.map((row) => row.storeAppId)).toEqual(['2', '4']);
    expect(primaryGenres).toHaveBeenCalledWith(['2', '3', '5'], 'us');
  });

  it('does not trust keyword overlap or the store similar list as proof of category', async () => {
    const { service } = setup();
    expect(
      await service.filter(app, [
        candidate('random', '6007'),
        candidate('other'),
      ]),
    ).toEqual([]);
  });

  it('hides unverified candidates if the primary app genre is unknown', async () => {
    const { service } = setup({});
    expect(await service.filter(app, [candidate('4', '6011')])).toEqual([]);
  });

  it('keeps verified candidates when the provider cannot resolve other categories', async () => {
    const { service, primaryGenres } = setup();
    primaryGenres.mockRejectedValue(new Error('lookup refused'));
    expect(
      await service.filter(app, [
        candidate('verified', '6011'),
        candidate('unknown'),
      ]),
    ).toEqual([candidate('verified', '6011')]);
  });

  it('enriches discovered apps with verified release dates and preserves missing dates', async () => {
    const { service, releaseDates } = setup();
    const input = [candidate('2'), candidate('3')];
    expect(await service.withReleaseDates(app, input)).toEqual([
      { ...input[0], releasedAt: '2020-07-04' },
      input[1],
    ]);
    await service.withReleaseDates(app, input);
    expect(releaseDates).toHaveBeenCalledTimes(1);
  });

  it('caches verified category lookups for repeat requests', async () => {
    const { service, primaryGenres } = setup();
    await service.filter(app, [candidate('2')]);
    await service.filter(app, [candidate('2')]);
    expect(primaryGenres).toHaveBeenCalledTimes(1);
  });
});
