import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Store } from '@prisma/client';
import {
  AppStoreLocalization,
  assertStorefront,
  countChars,
  KEYWORD_FIELD_CHAR_LIMIT,
  KeywordCoverageRow,
  lintDescription,
  lintKeywordField,
  lintShortDescription,
  lintSubtitle,
  lintTitle,
  LintContext,
  MetadataAuditResult,
  MetadataField,
  MetadataFieldAudit,
  keywordFieldLocalizations,
  ScreenshotItem,
  STORE_FIELD_LIMITS,
  tokenize,
  TrackedKeywordItem,
} from '@asobeast/shared';
import { storedKeywordFields } from '../keywords/keyword-field-index';
import { KeywordsService } from '../keywords/keywords.service';
import { PrismaService } from '../prisma/prisma.service';
import { suggestKeywordField } from './keyword-field-suggestion';
import {
  FieldPhrases,
  fieldPhrases,
  judgingSurfaces,
  keywordFieldOf,
} from './listing-surfaces';
import { judgeFields, LocalizedSurfaces, Surface } from './localized-coverage';
import {
  latestListingTexts,
  latestLocalizedTexts,
  ListingTexts,
  LocalizedTexts,
} from '../apps/listing-texts';
import { missingListing } from '../apps/missing-listing';
import { ScreenshotsService } from '../screenshots/screenshots.service';
import { StoreConnectionService } from '../store-connect/store-connection.service';
import type {
  AscMetadataListing,
  AscListingFields,
} from '../store-connect/asc-metadata-api';
import {
  screenshotTextCoverage,
  screenshotTextState,
} from './screenshot-coverage';

type JudgedCoverageRow = KeywordCoverageRow & { listingCountry: string };

interface AuditListings {
  listings: Map<string, ListingTexts>;
  localized: Map<string, LocalizedTexts[]>;
  view: ListingTexts | undefined;
}

@Injectable()
export class MetadataService {
  private readonly logger = new Logger(MetadataService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly keywords: KeywordsService,
    private readonly screenshots: ScreenshotsService,
    private readonly connections: StoreConnectionService,
  ) {}

  /**
   * Read-only: the keyword field App Store Connect holds for each localization.
   * Never throws for a missing or failing connection; the editor then stays empty.
   */
  async onlineKeywordFields(
    appId: string,
  ): Promise<{ connected: boolean; items: Record<string, string> }> {
    const app = await this.ensureApp(appId);
    if (app.store !== Store.APP_STORE || app.isCompetitor) {
      return { connected: false, items: {} };
    }
    try {
      const connection = await this.connections.openAppStoreMetadata();
      if (!connection || connection.status !== 'active') {
        return { connected: false, items: {} };
      }
      const all = await connection.api.snapshots(app.storeAppId);
      return {
        connected: true,
        items: Object.fromEntries(
          all
            .filter((entry) => entry.fields.keywords?.trim())
            .map((entry) => [entry.locale, entry.fields.keywords!.trim()]),
        ),
      };
    } catch (error) {
      this.logger.warn(
        `Could not read online keyword fields: ${error instanceof Error ? error.message : 'unknown'}`,
      );
      return { connected: false, items: {} };
    }
  }

  async audit(
    appId: string,
    country?: string,
    localization: AppStoreLocalization | null = null,
  ): Promise<MetadataAuditResult> {
    const app = await this.ensureApp(appId);
    const market = country ?? app.country;
    if (market !== app.country) {
      assertStorefront(app.store, market);
    }
    const [tracked, competitors, stored] = await Promise.all([
      this.keywords.listTracked(appId, undefined, country),
      this.prisma.app.findMany({
        where: { primaryAppId: appId },
        select: { name: true },
      }),
      storedKeywordFields(this.prisma, appId),
    ]);
    const active = tracked.filter((item) => item.active);
    const read = await this.readListings(app, market, localization, active);
    const { source, warning, keywords, extraFields } =
      await this.preferConnectedMetadata(app, market, localization, read);
    const { listings, view } = read;
    if (localization !== null && !view)
      throw missingListing(market, localization);
    if (market !== app.country && !view) throw missingListing(market);
    const keywordFields = new Map(fieldPhrases(stored));
    const viewLocalization =
      localization ?? keywordFieldLocalizations(market)[0];
    if (keywords !== undefined && viewLocalization) {
      keywordFields.set(
        viewLocalization,
        keywords
          .split(',')
          .map((part) => part.trim())
          .filter(Boolean),
      );
    }

    const keywordFieldValue =
      app.store === Store.APP_STORE
        ? (keywords ?? keywordFieldOf(keywordFields, viewLocalization))
        : '';
    const context: LintContext = {
      titleWords: tokenize(view?.title ?? ''),
      subtitleWords: tokenize(view?.subtitle ?? ''),
      brandTokens: tokenize(app.name ?? ''),
      competitorNames: competitors
        .map((competitor) => competitor.name)
        .filter((name): name is string => Boolean(name)),
      trackedKeywords: active.map((item) => item.text),
    };
    const fields =
      app.store === Store.GOOGLE_PLAY
        ? this.playFields(view, context)
        : this.appStoreFields(view, context, keywordFieldValue, extraFields);

    const coverage = this.judgeCoverage(app, active, read, keywordFields);
    const shots = await this.screenshotsOf(app.store, listings, [
      market,
      ...coverage.map((row) => row.listingCountry),
    ]);
    const reading = this.screenshots.reading(app.store);
    const textOf = (listing: string) =>
      screenshotTextState(shots(listing), reading);
    const screenshotText = textOf(market);

    return {
      appId,
      store: app.store,
      metadataSource: source,
      ...(warning ? { metadataSourceWarning: warning } : {}),
      fields,
      coverage: coverage.map((row) =>
        textOf(row.listingCountry)?.status === 'ready'
          ? {
              ...row,
              screenshotText: screenshotTextCoverage(
                shots(row.listingCountry),
                row.text,
              ),
            }
          : row,
      ),
      keywordFieldSuggestion:
        app.store === Store.APP_STORE
          ? suggestKeywordField(
              active.filter((item) => item.country === market),
              coverage.filter((row) => row.country === market),
              viewLocalization,
            )
          : null,
      ...(screenshotText ? { screenshotText } : {}),
      country: market,
      ...(localization === null ? {} : { localization }),
    };
  }

  private async readListings(
    app: { id: string; store: Store; country: string },
    market: string,
    localization: AppStoreLocalization | null,
    active: TrackedKeywordItem[],
  ): Promise<AuditListings> {
    const listings = await latestListingTexts(
      this.prisma,
      app.id,
      app.country,
      [app.country, market, ...active.map((item) => item.country)],
    );
    const localized =
      app.store === Store.APP_STORE
        ? await latestLocalizedTexts(this.prisma, app.id, app.country, [
            ...listings.keys(),
          ])
        : new Map<string, LocalizedTexts[]>();
    const view =
      localization === null
        ? listings.get(market)
        : localized
            .get(market)
            ?.find((entry) => entry.localization === localization)?.texts;
    return { listings, localized, view };
  }

  private async preferConnectedMetadata(
    app: {
      id: string;
      store: Store;
      country: string;
      storeAppId: string;
      isCompetitor: boolean;
    },
    market: string,
    localization: AppStoreLocalization | null,
    read: AuditListings,
  ): Promise<{
    source: 'app-store-connect' | 'storefront-snapshot';
    warning?: string;
    keywords?: string;
    extraFields?: Pick<AscListingFields, 'promotionalText' | 'whatsNew'>;
  }> {
    if (app.store !== Store.APP_STORE || app.isCompetitor) {
      return { source: 'storefront-snapshot' };
    }
    try {
      const connection = await this.connections.openAppStoreMetadata();
      if (!connection || connection.status !== 'active') {
        return { source: 'storefront-snapshot' };
      }
      const all: AscMetadataListing[] = await connection.api.snapshots(
        app.storeAppId,
      );
      const byLocale = new Map(all.map((entry) => [entry.locale, entry]));
      const requestedLocale =
        localization ?? keywordFieldLocalizations(market)[0];
      const selected = requestedLocale
        ? byLocale.get(requestedLocale)
        : undefined;
      if (!selected) {
        return {
          source: 'storefront-snapshot',
          warning:
            'The selected locale is not available in App Store Connect; showing stored storefront metadata.',
        };
      }
      // Read all applicable ASC localizations for the market, so keyword
      // coverage uses the same authoritative metadata as the visible fields.
      for (const [locale, entry] of byLocale) {
        if (
          !keywordFieldLocalizations(market).includes(
            locale as AppStoreLocalization,
          )
        )
          continue;
        const known = (read.localized.get(market) ?? []).find(
          (row) => row.localization === locale,
        )?.texts;
        const base = known ?? read.listings.get(market);
        if (!base) continue;
        const localized: ListingTexts = {
          ...base,
          title: entry.fields.name ?? base.title,
          subtitle: entry.fields.subtitle ?? base.subtitle,
          description: entry.fields.description ?? base.description,
        };
        read.localized.set(market, [
          ...(read.localized.get(market) ?? []).filter(
            (row) => row.localization !== locale,
          ),
          { localization: locale, texts: localized },
        ]);
      }
      const original = read.view ?? read.listings.get(market);
      const replacement: ListingTexts = {
        id: original?.id ?? '',
        title: selected.fields.name ?? original?.title ?? '',
        subtitle: selected.fields.subtitle ?? original?.subtitle ?? null,
        summary: original?.summary ?? null,
        description: selected.fields.description ?? original?.description ?? '',
      };
      read.view = replacement;
      if (localization === null) {
        read.listings.set(market, replacement);
      } else {
        const entries = read.localized.get(market) ?? [];
        read.localized.set(market, [
          ...entries.filter((entry) => entry.localization !== localization),
          { localization, texts: replacement },
        ]);
      }
      return {
        source: 'app-store-connect',
        keywords: selected.fields.keywords,
        extraFields: {
          promotionalText: selected.fields.promotionalText,
          whatsNew: selected.fields.whatsNew,
        },
      };
    } catch (error) {
      this.logger.warn(
        `App Store Connect metadata read failed for ${app.id}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        source: 'storefront-snapshot',
        warning:
          'App Store Connect metadata could not be read; showing stored storefront metadata.',
      };
    }
  }

  private async screenshotsOf(
    store: Store,
    listings: Map<string, ListingTexts>,
    markets: readonly string[],
  ): Promise<(market: string) => ScreenshotItem[]> {
    const snapshotIds = new Map(
      markets.flatMap((market) => {
        const listing = listings.get(market);
        return listing ? [[market, listing.id] as const] : [];
      }),
    );
    const screenshots = await this.screenshots.ofSnapshots(store, [
      ...new Set(snapshotIds.values()),
    ]);
    return (market) => {
      const snapshotId = snapshotIds.get(market);
      return snapshotId === undefined
        ? []
        : (screenshots.get(snapshotId) ?? []);
    };
  }

  private playFields(
    view: ListingTexts | undefined,
    context: LintContext,
  ): MetadataFieldAudit[] {
    const store = Store.GOOGLE_PLAY;
    const title = view?.title ?? '';
    const summary = view?.summary ?? '';
    const description = view?.description ?? '';
    return [
      this.field(store, 'title', title, lintTitle(title, 30, store)),
      this.field(
        store,
        'shortDescription',
        summary,
        lintShortDescription(summary, context, 80),
      ),
      this.field(
        store,
        'description',
        description,
        lintDescription(
          description,
          STORE_FIELD_LIMITS.GOOGLE_PLAY.description!.limit,
        ),
      ),
    ];
  }

  private appStoreFields(
    view: ListingTexts | undefined,
    context: LintContext,
    keywordFieldValue: string,
    extraFields?: Pick<AscListingFields, 'promotionalText' | 'whatsNew'>,
  ): MetadataFieldAudit[] {
    const store = Store.APP_STORE;
    const title = view?.title ?? '';
    const subtitle = view?.subtitle ?? '';
    const description = view?.description ?? '';
    const keywordField =
      keywordFieldValue.length > 0
        ? [
            this.field(
              store,
              'keywordField',
              keywordFieldValue,
              lintKeywordField(
                keywordFieldValue,
                context,
                KEYWORD_FIELD_CHAR_LIMIT,
              ),
            ),
          ]
        : [];
    return [
      this.field(store, 'title', title, lintTitle(title, 30, store)),
      this.field(
        store,
        'subtitle',
        subtitle,
        lintSubtitle(subtitle, context, 30),
      ),
      ...keywordField,
      this.field(
        store,
        'description',
        description,
        lintDescription(
          description,
          STORE_FIELD_LIMITS.APP_STORE.description!.limit,
        ),
      ),
      ...(extraFields
        ? (['promotionalText', 'whatsNew'] as const).map((field) => {
            const text = extraFields[field] ?? '';
            const limit = STORE_FIELD_LIMITS.APP_STORE[field]!.limit;
            const chars = countChars(text);
            return this.field(
              store,
              field,
              text,
              chars > limit
                ? [
                    {
                      rule: 'over-limit',
                      severity: 'error' as const,
                      message: `Exceeds the ${limit} character limit (${chars}).`,
                    },
                  ]
                : [],
            );
          })
        : []),
    ];
  }

  private judgeCoverage(
    app: { store: Store; country: string },
    active: TrackedKeywordItem[],
    { listings, localized }: AuditListings,
    keywordFields: FieldPhrases,
  ): JudgedCoverageRow[] {
    return active.map((item) => {
      const judging = listings.has(item.country) ? item.country : app.country;
      const { surfaces, localized: localizedSurfaces } = judgingSurfaces(
        {
          store: app.store,
          country: judging,
          home: judging === app.country,
          listing: listings.get(judging),
          captured: localized.get(judging) ?? [],
        },
        keywordFields,
      );
      return this.coverageRow(item, surfaces, localizedSurfaces, judging);
    });
  }

  private field(
    store: Store,
    field: MetadataField,
    value: string,
    issues: MetadataFieldAudit['issues'],
  ): MetadataFieldAudit {
    const limit = STORE_FIELD_LIMITS[store][field]!;
    return {
      field,
      value,
      chars: countChars(value),
      limit: limit.limit,
      indexed: limit.indexed,
      issues,
    };
  }

  private coverageRow(
    item: TrackedKeywordItem,
    surfaces: Surface[],
    localized: LocalizedSurfaces[],
    listingCountry: string,
  ): JudgedCoverageRow {
    const fields = judgeFields(item.text, surfaces, localized);
    return {
      keywordId: item.keywordId,
      text: item.text,
      bucket: item.bucket,
      fields,
      uncovered: fields.every((field) => !field.covered),
      country: item.country,
      listingCountry,
    };
  }

  private async ensureApp(appId: string): Promise<{
    id: string;
    store: Store;
    name: string | null;
    country: string;
    storeAppId: string;
    isCompetitor: boolean;
  }> {
    const app = await this.prisma.app.findFirst({
      where: { id: appId },
      select: {
        id: true,
        store: true,
        name: true,
        country: true,
        storeAppId: true,
        isCompetitor: true,
      },
    });
    if (!app) {
      throw new NotFoundException(`App ${appId} not found`);
    }
    return app;
  }
}
