import { AscMetadataApi, metadataHash } from './asc-metadata-api';
import type { AscRequester } from './asc-requester';

describe('ASC metadata transport', () => {
  it('produces a stable hash regardless of field insertion order', () => {
    expect(metadataHash({ name: 'App', subtitle: 'Radio' })).toBe(
      metadataHash({ subtitle: 'Radio', name: 'App' }),
    );
    expect(metadataHash({ name: 'Other' })).not.toBe(
      metadataHash({ name: 'App' }),
    );
  });

  it('merges App Store Connect metadata from distinct localization resources', async () => {
    const page = jest.fn().mockImplementation((path: string) => {
      if (path.includes('/appInfos?'))
        return Promise.resolve([
          { id: 'old-info', attributes: { appStoreState: 'READY_FOR_SALE' } },
          {
            id: 'draft-info',
            attributes: { appStoreState: 'PREPARE_FOR_SUBMISSION' },
          },
        ]);
      if (path.includes('/appStoreVersions?'))
        return Promise.resolve([
          {
            id: 'old-version',
            attributes: { platform: 'IOS', appStoreState: 'READY_FOR_SALE' },
          },
          {
            id: 'draft-version',
            attributes: {
              platform: 'IOS',
              appStoreState: 'PREPARE_FOR_SUBMISSION',
              versionString: '3.0.0',
            },
          },
        ]);
      if (path.includes('draft-info/appInfoLocalizations'))
        return Promise.resolve([
          {
            id: 'i1',
            attributes: {
              locale: 'en-US',
              name: 'TuneRadar: Music Radio',
              subtitle: 'Lofi, Jazz & World Stations',
            },
          },
        ]);
      if (path.includes('draft-version/appStoreVersionLocalizations'))
        return Promise.resolve([
          {
            id: 'v1',
            attributes: {
              locale: 'en-US',
              keywords: 'radio,jazz',
              description: 'World stations',
              whatsNew: 'New roam mode',
            },
          },
        ]);
      throw new Error(`Unexpected ASC request: ${path}`);
    });
    const api = new AscMetadataApi({ page } as unknown as AscRequester);
    expect(await api.snapshots('6451428572')).toEqual([
      {
        locale: 'en-US',
        versionState: 'PREPARE_FOR_SUBMISSION',
        versionString: '3.0.0',
        fields: {
          name: 'TuneRadar: Music Radio',
          subtitle: 'Lofi, Jazz & World Stations',
          keywords: 'radio,jazz',
          description: 'World stations',
          promotionalText: undefined,
          whatsNew: 'New roam mode',
        },
      },
    ]);
  });

  it('reads a published version when no editable version exists', async () => {
    const page = jest.fn().mockImplementation((path: string) => {
      if (path.includes('/appInfos?'))
        return Promise.resolve([
          {
            id: 'published-info',
            attributes: { appStoreState: 'READY_FOR_SALE' },
          },
        ]);
      if (path.includes('/appStoreVersions?'))
        return Promise.resolve([
          {
            id: 'published-version',
            attributes: {
              platform: 'IOS',
              appStoreState: 'READY_FOR_SALE',
            },
          },
        ]);
      if (path.includes('published-info/appInfoLocalizations'))
        return Promise.resolve([
          {
            id: 'i1',
            attributes: {
              locale: 'en-US',
              subtitle: 'Published radio subtitle',
            },
          },
        ]);
      if (path.includes('published-version/appStoreVersionLocalizations'))
        return Promise.resolve([]);
      throw new Error(`Unexpected ASC request: ${path}`);
    });
    const api = new AscMetadataApi({ page } as unknown as AscRequester);
    const snapshots = await api.snapshots('123');
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0].fields.subtitle).toBe('Published radio subtitle');
  });

  it('never retries PATCH requests and sends only specified fields', async () => {
    const send = jest.fn().mockResolvedValue({ status: 200 });
    const api = new AscMetadataApi({ send } as unknown as AscRequester);
    await api.patch(
      {
        appId: '123',
        appInfoId: 'i',
        versionId: 'v',
        appInfoLocalizationId: 'info-loc',
        versionLocalizationId: 'version-loc',
        locale: 'en-US',
        fields: {},
        hash: '',
      },
      { name: 'Updated', keywords: 'radio,music', whatsNew: 'Fixed bugs' },
    );
    expect(send).toHaveBeenCalledTimes(2);
    expect(send).toHaveBeenNthCalledWith(
      1,
      {
        method: 'PATCH',
        path: '/v1/appInfoLocalizations/info-loc',
        body: {
          data: {
            type: 'appInfoLocalizations',
            id: 'info-loc',
            attributes: { name: 'Updated' },
          },
        },
      },
      false,
    );
    expect(send).toHaveBeenNthCalledWith(
      2,
      {
        method: 'PATCH',
        path: '/v1/appStoreVersionLocalizations/version-loc',
        body: {
          data: {
            type: 'appStoreVersionLocalizations',
            id: 'version-loc',
            attributes: { keywords: 'radio,music', whatsNew: 'Fixed bugs' },
          },
        },
      },
      false,
    );
  });

  it('does not send a write for an empty diff', async () => {
    const send = jest.fn();
    const api = new AscMetadataApi({ send } as unknown as AscRequester);
    await api.patch(
      {
        appId: '123',
        appInfoId: 'i',
        versionId: 'v',
        locale: 'en-US',
        appInfoLocalizationId: 'il',
        versionLocalizationId: 'vl',
        fields: {},
        hash: '',
      },
      {},
    );
    expect(send).not.toHaveBeenCalled();
  });
});
