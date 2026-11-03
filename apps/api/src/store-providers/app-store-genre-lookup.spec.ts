import { parseAppStorePrimaryGenres } from './app-store.lib';

describe('App Store primary genre lookup', () => {
  it('reads numeric primary categories and ignores invalid results', () => {
    const genres = parseAppStorePrimaryGenres({
      resultCount: 4,
      results: [
        { trackId: 1, primaryGenreId: 6011, primaryGenreName: 'Music' },
        { trackId: 2, primaryGenreId: 6007, primaryGenreName: 'Productivity' },
        { trackId: 3, primaryGenreId: null },
        { artistId: 99 },
      ],
    });
    expect([...genres]).toEqual([
      ['1', '6011'],
      ['2', '6007'],
    ]);
  });

  it('fails closed on invalid responses', () => {
    expect(parseAppStorePrimaryGenres(null).size).toBe(0);
    expect(parseAppStorePrimaryGenres({ results: null }).size).toBe(0);
  });
});
