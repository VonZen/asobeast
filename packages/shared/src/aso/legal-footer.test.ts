import { describe, expect, it } from 'vitest';
import { applyLegalFooter, defaultReleaseNotes } from './legal-footer';

describe('localized release notes and legal footer', () => {
  it('chooses a localized default note and falls back to English', () => {
    expect(defaultReleaseNotes('zh-Hans')).toContain('性能');
    expect(defaultReleaseNotes('ja')).toContain('改善');
    expect(defaultReleaseNotes('en-US')).toContain('performance');
  });

  it('adds localized legal labels and is idempotent', () => {
    const options = {
      enabled: true,
      eulaUrl: 'https://example.com/eula',
      privacyUrl: 'https://example.com/privacy',
    };
    const first = applyLegalFooter('说明', 'zh-Hans', options);
    expect(first).toContain('使用条款: https://example.com/eula');
    expect(first).toContain('隐私政策: https://example.com/privacy');
    expect(applyLegalFooter(first, 'zh-Hans', options)).toBe(first);
  });

  it('does not modify disabled footer and rejects non-HTTPS links', () => {
    expect(
      applyLegalFooter('Original', 'en-US', {
        enabled: false,
        eulaUrl: 'http://example.com',
      }),
    ).toBe('Original');
    expect(() =>
      applyLegalFooter('text', 'en-US', {
        enabled: true,
        eulaUrl: 'http://example.com',
      }),
    ).toThrow(/HTTPS/);
  });

  it('rejects over-length descriptions rather than truncating legal text', () => {
    expect(() =>
      applyLegalFooter('a'.repeat(3990), 'en-US', {
        enabled: true,
        eulaUrl: 'https://example.com/terms',
      }),
    ).toThrow(/4000/);
  });
});
