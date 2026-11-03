import { countChars } from './limits';

const LABELS: Record<string, [string, string]> = {
  'zh-Hans': ['使用条款', '隐私政策'],
  'zh-Hant': ['使用條款', '隱私權政策'],
  ja: ['利用規約', 'プライバシーポリシー'],
  ko: ['이용약관', '개인정보 처리방침'],
  fr: ["Conditions d'utilisation", 'Politique de confidentialité'],
  de: ['Nutzungsbedingungen', 'Datenschutzrichtlinie'],
  es: ['Términos de uso', 'Política de privacidad'],
  pt: ['Termos de uso', 'Política de privacidade'],
  it: ["Termini d'uso", 'Informativa sulla privacy'],
};

const DEFAULT_NOTES: Record<string, string> = {
  'zh-Hans': '本次更新包含性能改进和问题修复。',
  'zh-Hant': '本次更新包含效能改善和問題修正。',
  ja: 'パフォーマンスの改善と不具合の修正を行いました。',
  ko: '성능을 개선하고 버그를 수정했습니다.',
  fr: 'Cette mise à jour apporte des améliorations de performance et des corrections de bugs.',
  de: 'Dieses Update enthält Leistungsverbesserungen und Fehlerbehebungen.',
  es: 'Esta actualización incluye mejoras de rendimiento y correcciones de errores.',
  pt: 'Esta atualização inclui melhorias de desempenho e correções de erros.',
  it: 'Questo aggiornamento include miglioramenti delle prestazioni e correzioni di errori.',
};

function root(locale: string): string {
  return locale.startsWith('zh-Hans')
    ? 'zh-Hans'
    : locale.startsWith('zh-Hant')
      ? 'zh-Hant'
      : locale.split('-')[0];
}

export function defaultReleaseNotes(locale: string): string {
  return (
    DEFAULT_NOTES[root(locale)] ??
    'This update includes performance improvements and bug fixes.'
  );
}

export interface LegalFooterOptions {
  enabled: boolean;
  eulaUrl?: string | null;
  privacyUrl?: string | null;
}

export function applyLegalFooter(
  description: string,
  locale: string,
  options: LegalFooterOptions,
): string {
  if (!options.enabled) return description;
  const labels = LABELS[root(locale)] ?? ['Terms of Use', 'Privacy Policy'];
  const links = [
    options.eulaUrl?.trim() ? `${labels[0]}: ${options.eulaUrl.trim()}` : null,
    options.privacyUrl?.trim()
      ? `${labels[1]}: ${options.privacyUrl.trim()}`
      : null,
  ].filter((value): value is string => Boolean(value));
  if (links.length === 0) return description;
  for (const url of [options.eulaUrl, options.privacyUrl]) {
    if (url && !/^https:\/\/[^\s]+$/i.test(url.trim())) {
      throw new Error('Legal links must use HTTPS');
    }
  }
  const footer = links.join('\n');
  const content = description.trimEnd();
  if (content.endsWith(footer)) return content;
  const combined = content ? `${content}\n\n${footer}` : footer;
  if (countChars(combined) > 4000) {
    throw new RangeError('Description and legal footer exceed 4000 characters');
  }
  return combined;
}
