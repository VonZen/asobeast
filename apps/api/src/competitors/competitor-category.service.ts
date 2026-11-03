import { Injectable, Logger } from '@nestjs/common';
import { Store } from '@prisma/client';
import { HOME_LISTING, NEWEST_FIRST } from '../apps/listing';
import { PrismaService } from '../prisma/prisma.service';
import { ProxyEgress } from '../store-providers/egress/proxy-egress.service';
import { primaryGenreKey } from '../store-providers/raw-facts';
import { StoreProviderRegistry } from '../store-providers/store-provider.registry';

export interface CategoryPrimaryApp {
  id: string;
  store: Store;
  storeAppId: string;
  country: string;
}

export interface CategoryCandidate {
  storeAppId: string;
  genreId?: string;
}

interface CachedGenre {
  genre: string | null;
  expiresAt: number;
}

const VALID_GENRE = /^[-_a-z0-9]+$/i;
const GOOD_TTL = 6 * 60 * 60 * 1000;
const UNKNOWN_TTL = 60 * 1000;

/** Only verified primary-category matches may enter untracked competitor lists. */
@Injectable()
export class CompetitorCategoryService {
  private readonly logger = new Logger(CompetitorCategoryService.name);
  private readonly cache = new Map<string, CachedGenre>();
  private readonly releaseCache = new Map<
    string,
    { value: string | null; expiresAt: number }
  >();

  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: StoreProviderRegistry,
    private readonly egress: ProxyEgress,
  ) {}

  async filter<T extends CategoryCandidate>(
    app: CategoryPrimaryApp,
    candidates: readonly T[],
  ): Promise<T[]> {
    if (candidates.length === 0) return [];
    const snapshot = await this.prisma.appSnapshot.findFirst({
      where: { appId: app.id, ...HOME_LISTING },
      orderBy: NEWEST_FIRST,
      select: { raw: true },
    });
    const reference =
      primaryGenreKey(app.store, snapshot?.raw) ??
      (await this.lookup(app, [app.storeAppId])).get(app.storeAppId) ??
      null;
    if (!reference) {
      this.logger.warn(
        `Cannot verify primary genre for ${app.id}; suppressing untracked competitor recommendations`,
      );
      return [];
    }

    const unknown: string[] = [];
    const genres = new Map<string, string>();
    for (const candidate of candidates) {
      const declared = candidate.genreId;
      if (declared && VALID_GENRE.test(declared)) {
        genres.set(candidate.storeAppId, declared);
      } else {
        unknown.push(candidate.storeAppId);
      }
    }
    const fetched = await this.lookup(app, unknown);
    for (const [id, genre] of fetched) genres.set(id, genre);
    return candidates.filter(
      (candidate) => genres.get(candidate.storeAppId) === reference,
    );
  }

  async withReleaseDates<T extends CategoryCandidate>(
    app: CategoryPrimaryApp,
    candidates: readonly T[],
  ): Promise<(T & { releasedAt?: string | null })[]> {
    if (candidates.length === 0) return [];
    const now = Date.now();
    const dates = new Map<string, string>();
    const missing: string[] = [];
    for (const id of new Set(candidates.map((item) => item.storeAppId))) {
      const key = `${app.store}:${app.country}:${id}`;
      const saved = this.releaseCache.get(key);
      if (saved && saved.expiresAt > now) {
        if (saved.value) dates.set(id, saved.value);
      } else {
        missing.push(id);
      }
    }
    if (missing.length) {
      try {
        const provider = this.registry.get(app.store);
        if (provider.releaseDates) {
          const found = await this.egress.through(
            app.store,
            app.country,
            () => provider.releaseDates!(missing, app.country),
            { waitForLocal: false },
          );
          if (this.releaseCache.size > 3000) this.releaseCache.clear();
          for (const id of missing) {
            const date = found.get(id);
            const value =
              date instanceof Date && Number.isFinite(date.getTime())
                ? date.toISOString().slice(0, 10)
                : null;
            this.releaseCache.set(`${app.store}:${app.country}:${id}`, {
              value,
              expiresAt: now + (value ? GOOD_TTL : UNKNOWN_TTL),
            });
            if (value) dates.set(id, value);
          }
        }
      } catch (error) {
        this.logger.warn(
          `Release date lookup unavailable for ${app.store}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
    return candidates.map((item) => ({
      ...item,
      ...(dates.has(item.storeAppId)
        ? { releasedAt: dates.get(item.storeAppId) }
        : {}),
    }));
  }

  private async lookup(
    app: CategoryPrimaryApp,
    ids: readonly string[],
  ): Promise<Map<string, string>> {
    const result = new Map<string, string>();
    const missing: string[] = [];
    const now = Date.now();
    for (const id of new Set(ids)) {
      const key = `${app.store}:${app.country}:${id}`;
      const cached = this.cache.get(key);
      if (cached && cached.expiresAt > now) {
        if (cached.genre) result.set(id, cached.genre);
      } else {
        missing.push(id);
      }
    }
    if (!missing.length) return result;
    try {
      const provider = this.registry.get(app.store);
      if (!provider.primaryGenres)
        throw new Error('Store provider cannot verify primary genres');
      const fetched = await this.egress.through(
        app.store,
        app.country,
        () => provider.primaryGenres!(missing, app.country),
        { waitForLocal: false },
      );
      if (this.cache.size > 3000) this.cache.clear();
      for (const id of missing) {
        const genre = fetched.get(id) ?? null;
        this.cache.set(`${app.store}:${app.country}:${id}`, {
          genre,
          expiresAt: now + (genre ? GOOD_TTL : UNKNOWN_TTL),
        });
        if (genre) result.set(id, genre);
      }
    } catch (error) {
      this.logger.warn(
        `Primary genre lookup unavailable for ${app.store}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    return result;
  }
}
