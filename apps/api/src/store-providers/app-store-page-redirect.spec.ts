import { isAppProductPage } from './app-store.lib';

describe('App Store product page redirect guard', () => {
  it('accepts the real product URL and its localized variant', () => {
    expect(
      isAppProductPage(
        'https://apps.apple.com/us/app/tuneradar-music-radio/id6451428572',
        6451428572,
      ),
    ).toBe(true);
    expect(
      isAppProductPage(
        'https://apps.apple.com/cn/app/some-name/id6451428572?l=zh',
        6451428572,
      ),
    ).toBe(true);
  });

  it('rejects a successful redirect to the Today page or another product', () => {
    expect(
      isAppProductPage('https://apps.apple.com/cn/iphone/today', 6451428572),
    ).toBe(false);
    expect(
      isAppProductPage(
        'https://apps.apple.com/us/app/other/id9999999',
        6451428572,
      ),
    ).toBe(false);
    expect(isAppProductPage('not a valid URL', 6451428572)).toBe(false);
  });
});
