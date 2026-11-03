import { ConflictException, ForbiddenException } from '@nestjs/common';
import { MetadataPublishService } from './metadata-publish.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { WorkspaceContext } from '../common/tenancy/workspace-context';
import type { StoreConnectionService } from '../store-connect/store-connection.service';

const app = { id: 'app', storeAppId: '123', workspaceId: 'workspace' };
const snapshot = {
  appId: '123',
  appInfoId: 'info',
  versionId: 'version',
  appInfoLocalizationId: 'info-en',
  versionLocalizationId: 'version-en',
  locale: 'en-US',
  fields: { name: 'Original' },
  hash: 'base',
};

function harness(enabled = true) {
  const read = jest.fn().mockResolvedValue(snapshot);
  const patch = jest.fn().mockResolvedValue(undefined);
  const prisma = {
    app: { findFirst: jest.fn().mockResolvedValue(app) },
    storeConnection: {
      findFirst: jest
        .fn()
        .mockResolvedValue({ metadataPublishEnabled: enabled }),
    },
    metadataPublishDraft: {
      findUnique: jest.fn().mockResolvedValue({
        baselineHash: 'base',
        fields: { name: 'New title' },
      }),
      upsert: jest.fn().mockResolvedValue({}),
    },
    metadataPublishRecord: {
      create: jest.fn().mockResolvedValue({ id: 'record' }),
      update: jest.fn().mockResolvedValue({}),
    },
  };
  const connection = {
    openAppStoreMetadata: jest.fn().mockResolvedValue({
      status: 'active',
      api: { read, patch },
    }),
    markMetadataPublishAccess: jest.fn().mockResolvedValue(undefined),
  };
  const workspace = { require: () => 'workspace' };
  const service = new MetadataPublishService(
    prisma as unknown as PrismaService,
    workspace as unknown as WorkspaceContext,
    connection as unknown as StoreConnectionService,
  );
  return { service, prisma, read, patch, connection };
}

describe('metadata publishing safety', () => {
  it('refuses a write while the workspace switch is off', async () => {
    const { service, patch } = harness(false);
    await expect(
      service.apply('app', 'en-US', 'base', { name: 'New title' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(patch).not.toHaveBeenCalled();
  });

  it('refuses a stale baseline before writing', async () => {
    const { service, patch, read } = harness();
    read.mockResolvedValue({ ...snapshot, hash: 'new-baseline' });
    await expect(
      service.apply('app', 'en-US', 'base', { name: 'New title' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(patch).not.toHaveBeenCalled();
  });

  it('refuses confirmation which differs from the stored draft', async () => {
    const { service, patch } = harness();
    await expect(
      service.apply('app', 'en-US', 'base', { name: 'Different' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(patch).not.toHaveBeenCalled();
  });
});
