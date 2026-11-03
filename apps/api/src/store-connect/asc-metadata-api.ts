import { createHash } from 'node:crypto';
import { AscError } from './asc-errors';
import type { AscRequester } from './asc-requester';

export interface AscListingFields {
  name?: string;
  subtitle?: string;
  keywords?: string;
  description?: string;
  promotionalText?: string;
  whatsNew?: string;
}

interface LocalizationAttributes extends AscListingFields {
  locale?: string;
}

interface AppInfoAttributes {
  appStoreState?: string;
  state?: string;
}

interface VersionAttributes {
  appVersionState?: string;
  appStoreState?: string;
  platform?: string;
  versionString?: string;
}

/** Read-only merged snapshot, usable for published apps with no editable version. */
export interface AscMetadataListing {
  locale: string;
  fields: AscListingFields;
  versionState: string | null;
  versionString: string | null;
}

export interface AscMetadataSnapshot {
  appId: string;
  appInfoId: string;
  versionId: string;
  locale: string;
  appInfoLocalizationId: string;
  versionLocalizationId: string;
  fields: AscListingFields;
  hash: string;
}

const EDITABLE_STATES = new Set([
  'PREPARE_FOR_SUBMISSION',
  'DEVELOPER_REJECTED',
  'REJECTED',
  'METADATA_REJECTED',
  'WAITING_FOR_REVIEW',
  'INVALID_BINARY',
]);

const FROZEN_INFO_STATES = new Set([
  'READY_FOR_SALE',
  'REPLACED_WITH_NEW_INFO',
  'READY_FOR_DISTRIBUTION',
]);

const FIELDS = [
  'name',
  'subtitle',
  'keywords',
  'description',
  'promotionalText',
  'whatsNew',
] as const;

export function metadataHash(fields: AscListingFields): string {
  return createHash('sha256')
    .update(
      JSON.stringify(
        Object.fromEntries(
          FIELDS.map((field) => [field, fields[field] ?? null]),
        ),
      ),
    )
    .digest('hex');
}

/**
 * Low-level ASC metadata operations. This class does not grant permission to publish:
 * the caller must enforce the workspace switch, baseline and confirmation.
 */
export class AscMetadataApi {
  constructor(private readonly requester: AscRequester) {}

  /**
   * Mirrors Workbench's snapshot lookup: read iOS version localizations and
   * appInfo localizations separately, then merge on locale. Publishing requires
   * an editable version; reading metadata does not.
   */
  async snapshots(appId: string): Promise<AscMetadataListing[]> {
    const id = encodeURIComponent(appId);
    const [infos, versions] = await Promise.all([
      this.requester.page<AppInfoAttributes>(
        `/v1/apps/${id}/appInfos?limit=200`,
      ),
      this.requester.page<VersionAttributes>(
        `/v1/apps/${id}/appStoreVersions?filter[platform]=IOS&limit=200`,
      ),
    ]);
    const iosVersions = versions.filter(
      (version) =>
        !version.attributes?.platform || version.attributes.platform === 'IOS',
    );
    const version =
      iosVersions.find((entry) =>
        EDITABLE_STATES.has(
          entry.attributes?.appStoreState ??
            entry.attributes?.appVersionState ??
            '',
        ),
      ) ?? iosVersions[0];
    const info =
      infos.find(
        (entry) =>
          !FROZEN_INFO_STATES.has(
            entry.attributes?.appStoreState ?? entry.attributes?.state ?? '',
          ),
      ) ?? infos[0];
    if (!info && !version) return [];
    const [versionLocs, infoLocs] = await Promise.all([
      version
        ? this.requester.page<LocalizationAttributes>(
            `/v1/appStoreVersions/${encodeURIComponent(version.id)}/appStoreVersionLocalizations?limit=200`,
          )
        : Promise.resolve([]),
      info
        ? this.requester.page<LocalizationAttributes>(
            `/v1/appInfos/${encodeURIComponent(info.id)}/appInfoLocalizations?limit=200`,
          )
        : Promise.resolve([]),
    ]);
    const merged = new Map<string, AscListingFields>();
    for (const item of versionLocs) {
      const locale = item.attributes?.locale;
      if (!locale) continue;
      merged.set(locale, {
        keywords: item.attributes?.keywords,
        description: item.attributes?.description,
        promotionalText: item.attributes?.promotionalText,
        whatsNew: item.attributes?.whatsNew,
      });
    }
    for (const item of infoLocs) {
      const locale = item.attributes?.locale;
      if (!locale) continue;
      merged.set(locale, {
        ...merged.get(locale),
        name: item.attributes?.name,
        subtitle: item.attributes?.subtitle,
      });
    }
    return [...merged.entries()]
      .map(([locale, fields]) => ({
        locale,
        fields,
        versionState:
          version?.attributes?.appStoreState ??
          version?.attributes?.appVersionState ??
          null,
        versionString: version?.attributes?.versionString ?? null,
      }))
      .sort((a, b) => a.locale.localeCompare(b.locale));
  }

  async read(appId: string, locale: string): Promise<AscMetadataSnapshot> {
    const id = encodeURIComponent(appId);
    const [infos, versions] = await Promise.all([
      this.requester.page<AppInfoAttributes>(
        `/v1/apps/${id}/appInfos?limit=200`,
      ),
      this.requester.page<VersionAttributes>(
        `/v1/apps/${id}/appStoreVersions?limit=200`,
      ),
    ]);
    const editableVersions = versions.filter(
      (v) =>
        EDITABLE_STATES.has(
          v.attributes?.appStoreState ?? v.attributes?.appVersionState ?? '',
        ) &&
        (!v.attributes?.platform || v.attributes.platform === 'IOS'),
    );
    if (editableVersions.length !== 1) {
      throw new AscError(
        'Expected exactly one editable iOS App Store version',
        409,
        null,
      );
    }
    if (infos.length === 0) {
      throw new AscError('No App Store appInfo found', 404, null);
    }
    // A live app can have multiple appInfos; select the editable resource by state.
    const editableInfos = infos.filter((info) => {
      const state = info.attributes;
      return !FROZEN_INFO_STATES.has(
        state?.appStoreState ?? state?.state ?? '',
      );
    });
    if (editableInfos.length !== 1) {
      throw new AscError('Expected exactly one editable appInfo', 409, null);
    }
    const infoMatches = await Promise.all(
      editableInfos.map(async (info) => ({
        info,
        localizations: await this.requester.page<LocalizationAttributes>(
          `/v1/appInfos/${encodeURIComponent(info.id)}/appInfoLocalizations?limit=200`,
        ),
      })),
    );
    const matched = infoMatches.flatMap(({ info, localizations }) =>
      localizations
        .filter((entry) => entry.attributes?.locale === locale)
        .map((entry) => ({ info, entry })),
    );
    if (matched.length !== 1) {
      throw new AscError(
        'Expected exactly one appInfo localization for requested locale',
        409,
        null,
      );
    }
    const version = editableVersions[0];
    const versionLocalizations =
      await this.requester.page<LocalizationAttributes>(
        `/v1/appStoreVersions/${encodeURIComponent(version.id)}/appStoreVersionLocalizations?limit=200`,
      );
    const localized = versionLocalizations.filter(
      (entry) => entry.attributes?.locale === locale,
    );
    if (localized.length !== 1) {
      throw new AscError(
        'Expected exactly one editable version localization',
        409,
        null,
      );
    }
    const infoFields = matched[0].entry.attributes ?? {};
    const versionFields = localized[0].attributes ?? {};
    const fields: AscListingFields = {
      name: infoFields.name,
      subtitle: infoFields.subtitle,
      keywords: versionFields.keywords,
      description: versionFields.description,
      promotionalText: versionFields.promotionalText,
      whatsNew: versionFields.whatsNew,
    };
    return {
      appId,
      appInfoId: matched[0].info.id,
      versionId: version.id,
      locale,
      appInfoLocalizationId: matched[0].entry.id,
      versionLocalizationId: localized[0].id,
      fields,
      hash: createHash('sha256')
        .update(
          JSON.stringify({
            appInfoLocalizationId: matched[0].entry.id,
            versionLocalizationId: localized[0].id,
            versionId: version.id,
            fields: metadataHash(fields),
          }),
        )
        .digest('hex'),
    };
  }

  async listLocales(appId: string): Promise<string[]> {
    const app = encodeURIComponent(appId);
    const versions = await this.requester.page<VersionAttributes>(
      `/v1/apps/${app}/appStoreVersions?filter[platform]=IOS&limit=200`,
    );
    const version = versions.find((row) =>
      EDITABLE_STATES.has(
        row.attributes?.appStoreState ?? row.attributes?.appVersionState ?? '',
      ),
    );
    if (!version) throw new AscError('No editable iOS version', 409, null);
    const infos = await this.requester.page<AppInfoAttributes>(
      `/v1/apps/${app}/appInfos?limit=200`,
    );
    const info = infos.find(
      (row) =>
        !FROZEN_INFO_STATES.has(
          row.attributes?.appStoreState ?? row.attributes?.state ?? '',
        ),
    );
    if (!info) throw new AscError('No editable appInfo', 409, null);
    const [versionLocales, infoLocales] = await Promise.all([
      this.requester.page<LocalizationAttributes>(
        `/v1/appStoreVersions/${encodeURIComponent(version.id)}/appStoreVersionLocalizations?limit=200`,
      ),
      this.requester.page<LocalizationAttributes>(
        `/v1/appInfos/${encodeURIComponent(info.id)}/appInfoLocalizations?limit=200`,
      ),
    ]);
    const infoSet = new Set(infoLocales.map((row) => row.attributes?.locale));
    return versionLocales.flatMap((row) =>
      row.attributes?.locale && infoSet.has(row.attributes.locale)
        ? [row.attributes.locale]
        : [],
    );
  }

  async privacyPolicyURL(appId: string): Promise<string | null> {
    const infos = await this.requester.page<AppInfoAttributes>(
      `/v1/apps/${encodeURIComponent(appId)}/appInfos?limit=200`,
    );
    const editable = infos.find(
      (row) =>
        !FROZEN_INFO_STATES.has(
          row.attributes?.appStoreState ?? row.attributes?.state ?? '',
        ),
    );
    if (!editable) return null;
    const locales = await this.requester.page<
      LocalizationAttributes & { privacyPolicyUrl?: string }
    >(
      `/v1/appInfos/${encodeURIComponent(editable.id)}/appInfoLocalizations?limit=200`,
    );
    return (
      locales.find(
        (row) =>
          row.attributes?.locale === 'en-US' &&
          row.attributes.privacyPolicyUrl?.trim(),
      )?.attributes?.privacyPolicyUrl ??
      locales.find((row) => row.attributes?.privacyPolicyUrl?.trim())
        ?.attributes?.privacyPolicyUrl ??
      null
    );
  }

  /**
   * Explicitly creates an absent localization on the existing editable version.
   * The caller confirms this separate write and checks the publish switch.
   */
  async ensureLocale(
    appId: string,
    locale: string,
    fallbackName: string,
  ): Promise<AscMetadataSnapshot> {
    const app = encodeURIComponent(appId);
    const [infos, versions] = await Promise.all([
      this.requester.page<AppInfoAttributes>(
        `/v1/apps/${app}/appInfos?limit=200`,
      ),
      this.requester.page<VersionAttributes>(
        `/v1/apps/${app}/appStoreVersions?limit=200`,
      ),
    ]);
    const info = infos.find(
      (row) =>
        !FROZEN_INFO_STATES.has(
          row.attributes?.appStoreState ?? row.attributes?.state ?? '',
        ),
    );
    const version = versions.find(
      (row) =>
        EDITABLE_STATES.has(
          row.attributes?.appStoreState ??
            row.attributes?.appVersionState ??
            '',
        ) &&
        (!row.attributes?.platform || row.attributes.platform === 'IOS'),
    );
    if (!info || !version)
      throw new AscError('No editable App Store metadata version', 409, null);
    const [infoLocales, versionLocales] = await Promise.all([
      this.requester.page<LocalizationAttributes>(
        `/v1/appInfos/${encodeURIComponent(info.id)}/appInfoLocalizations?limit=200`,
      ),
      this.requester.page<LocalizationAttributes>(
        `/v1/appStoreVersions/${encodeURIComponent(version.id)}/appStoreVersionLocalizations?limit=200`,
      ),
    ]);
    if (!infoLocales.some((row) => row.attributes?.locale === locale)) {
      await this.requester.send(
        {
          method: 'POST',
          path: '/v1/appInfoLocalizations',
          body: {
            data: {
              type: 'appInfoLocalizations',
              attributes: { locale, name: fallbackName },
              relationships: {
                appInfo: { data: { type: 'appInfos', id: info.id } },
              },
            },
          },
        },
        false,
      );
    }
    if (!versionLocales.some((row) => row.attributes?.locale === locale)) {
      await this.requester.send(
        {
          method: 'POST',
          path: '/v1/appStoreVersionLocalizations',
          body: {
            data: {
              type: 'appStoreVersionLocalizations',
              attributes: { locale },
              relationships: {
                appStoreVersion: {
                  data: { type: 'appStoreVersions', id: version.id },
                },
              },
            },
          },
        },
        false,
      );
    }
    return this.read(appId, locale);
  }

  async patch(
    snapshot: AscMetadataSnapshot,
    fields: Partial<AscListingFields>,
  ): Promise<void> {
    const info: Record<string, string> = {};
    const version: Record<string, string> = {};
    for (const field of ['name', 'subtitle'] as const) {
      if (fields[field] !== undefined) info[field] = fields[field];
    }
    for (const field of [
      'keywords',
      'description',
      'promotionalText',
      'whatsNew',
    ] as const) {
      if (fields[field] !== undefined) version[field] = fields[field];
    }
    if (Object.keys(info).length) {
      await this.patchLocalization(
        'appInfoLocalizations',
        snapshot.appInfoLocalizationId,
        info,
      );
    }
    if (Object.keys(version).length) {
      await this.patchLocalization(
        'appStoreVersionLocalizations',
        snapshot.versionLocalizationId,
        version,
      );
    }
  }

  private async patchLocalization(
    type: string,
    id: string,
    attributes: Record<string, string>,
  ): Promise<void> {
    await this.requester.send(
      {
        method: 'PATCH',
        path: `/v1/${type}/${encodeURIComponent(id)}`,
        body: { data: { type, id, attributes } },
      },
      false,
    );
  }
}
