import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  lintTitle,
  lintSubtitle,
  lintKeywordField,
  lintDescription,
  tokenize,
  countChars,
} from '@asobeast/shared';
import { WorkspaceContext } from '../common/tenancy/workspace-context';
import { StoreConnectionService } from '../store-connect/store-connection.service';
import { AscError } from '../store-connect/asc-errors';
import {
  AscListingFields,
  metadataHash,
} from '../store-connect/asc-metadata-api';

const ALLOWED = [
  'name',
  'subtitle',
  'keywords',
  'description',
  'promotionalText',
  'whatsNew',
] as const;
type EditableField = (typeof ALLOWED)[number];

function validate(fields: Record<string, unknown>): AscListingFields {
  if (
    !fields ||
    typeof fields !== 'object' ||
    Array.isArray(fields) ||
    Object.keys(fields).some((key) => !ALLOWED.includes(key as EditableField))
  ) {
    throw new BadRequestException('Unsupported metadata field');
  }
  const limits: Partial<Record<EditableField, number>> = {
    name: 30,
    subtitle: 30,
    keywords: 100,
    description: 4000,
    promotionalText: 170,
    whatsNew: 4000,
  };
  for (const [field, value] of Object.entries(fields)) {
    if (
      typeof value !== 'string' ||
      countChars(value) > (limits[field as EditableField] ?? 0)
    ) {
      throw new BadRequestException(`Invalid metadata field: ${field}`);
    }
  }
  const fieldSet = fields as AscListingFields;
  const context = {
    titleWords: tokenize(fieldSet.name ?? ''),
    subtitleWords: tokenize(fieldSet.subtitle ?? ''),
  };
  const errors = [
    ...(fieldSet.name === undefined ? [] : lintTitle(fieldSet.name)),
    ...(fieldSet.subtitle === undefined
      ? []
      : lintSubtitle(fieldSet.subtitle, context)),
    ...(fieldSet.keywords === undefined
      ? []
      : lintKeywordField(fieldSet.keywords, context)),
    ...(fieldSet.description === undefined
      ? []
      : lintDescription(fieldSet.description)),
  ].filter((issue) => issue.severity === 'error');
  if (errors.length) {
    throw new BadRequestException(
      errors.map((issue) => issue.message).join('; '),
    );
  }
  return fieldSet;
}

@Injectable()
export class MetadataPublishService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspace: WorkspaceContext,
    private readonly connections: StoreConnectionService,
  ) {}

  private async app(appId: string) {
    const app = await this.prisma.app.findFirst({
      where: { id: appId, store: 'APP_STORE', isCompetitor: false },
      select: { id: true, workspaceId: true, storeAppId: true },
    });
    if (!app) throw new NotFoundException('Owned App Store app not found');
    return app;
  }

  private async enabled() {
    const row = await this.prisma.storeConnection.findFirst({
      where: { store: 'APP_STORE' },
      select: { metadataPublishEnabled: true },
    });
    if (!row?.metadataPublishEnabled) {
      throw new ForbiddenException(
        'Enable metadata publishing in Store Connections settings first',
      );
    }
  }

  async setting() {
    const row = await this.prisma.storeConnection.findFirst({
      where: { store: 'APP_STORE' },
      select: { metadataPublishEnabled: true, metadataPublishAccess: true },
    });
    return {
      enabled: row?.metadataPublishEnabled ?? false,
      access: row?.metadataPublishAccess ?? 'unknown',
    };
  }

  async setEnabled(enabled: boolean) {
    await this.connections.setMetadataPublishEnabled(enabled);
    return this.setting();
  }

  async preview(appId: string, locale: string, raw: Record<string, unknown>) {
    const app = await this.app(appId);
    const fields = validate(raw);
    const connection = await this.connections.openAppStoreMetadata();
    if (!connection || connection.status !== 'active')
      throw new ConflictException('Connect App Store Connect first');
    const current = await connection.api.read(app.storeAppId, locale);
    const diff = Object.fromEntries(
      Object.entries(fields).filter(
        ([key, value]) => current.fields[key as EditableField] !== value,
      ),
    ) as AscListingFields;
    await this.prisma.metadataPublishDraft.upsert({
      where: { appId_locale: { appId, locale } },
      create: {
        appId,
        workspaceId: app.workspaceId,
        locale,
        fields,
        baselineHash: current.hash,
      },
      update: { fields, baselineHash: current.hash },
    });
    return { baselineHash: current.hash, current: current.fields, diff };
  }

  async apply(
    appId: string,
    locale: string,
    baselineHash: string,
    confirmation: Record<string, unknown>,
  ) {
    await this.enabled();
    const app = await this.app(appId);
    const draft = await this.prisma.metadataPublishDraft.findUnique({
      where: { appId_locale: { appId, locale } },
    });
    if (!draft || draft.baselineHash !== baselineHash)
      throw new ConflictException('Draft baseline changed; preview again');
    const fields = validate(draft.fields as Record<string, unknown>);
    const confirmed = validate(confirmation);
    if (metadataHash(confirmed) !== metadataHash(fields)) {
      throw new ConflictException('Confirmed fields do not match saved draft');
    }
    const connection = await this.connections.openAppStoreMetadata();
    if (!connection || connection.status !== 'active')
      throw new ConflictException('App Store Connect unavailable');
    const current = await connection.api.read(app.storeAppId, locale);
    if (current.hash !== baselineHash) {
      throw new ConflictException(
        'Store metadata changed; preview again before publishing',
      );
    }
    const diff = Object.fromEntries(
      Object.entries(fields).filter(
        ([key, value]) => current.fields[key as EditableField] !== value,
      ),
    ) as AscListingFields;
    if (!Object.keys(diff).length)
      throw new BadRequestException('No metadata changes');
    const record = await this.prisma.metadataPublishRecord.create({
      data: {
        appId,
        workspaceId: this.workspace.require('metadata publish'),
        locale,
        fields: diff,
        beforeHash: current.hash,
        status: 'pending',
      },
    });
    let failure: unknown = null;
    try {
      await connection.api.patch(current, diff);
      await this.connections.markMetadataPublishAccess('allowed');
    } catch (error) {
      failure = error;
      if (error instanceof AscError && error.status === 403) {
        await this.connections.markMetadataPublishAccess('forbidden');
      }
    }
    // A failed or timed-out write may have reached Apple: always read back before deciding.
    let latest;
    try {
      latest = await connection.api.read(app.storeAppId, locale);
    } catch {
      await this.prisma.metadataPublishRecord.update({
        where: { id: record.id },
        data: { status: 'unknown' },
      });
      if (failure instanceof AscError && failure.status === 403) {
        throw new ForbiddenException(
          'App Manager or Admin role is required to publish metadata',
        );
      }
      throw new ConflictException(
        'Write result unknown; check the store before retrying',
      );
    }
    const matched = Object.entries(diff).filter(
      ([key, value]) => latest.fields[key as EditableField] === value,
    ).length;
    const status =
      matched === Object.keys(diff).length
        ? 'success'
        : matched > 0
          ? 'partial'
          : failure
            ? 'failed'
            : 'partial';
    await this.prisma.metadataPublishRecord.update({
      where: { id: record.id },
      data: { status, afterHash: latest.hash },
    });
    if (failure instanceof AscError && failure.status === 403) {
      throw new ForbiddenException(
        'App Manager or Admin role is required to publish metadata',
      );
    }
    return { id: record.id, status, current: latest.fields };
  }
}
