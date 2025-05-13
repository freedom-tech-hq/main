import { describe, it } from 'node:test';

import { sha256HashInfo } from 'freedom-basic-data';
import { plainId, storageRootIdInfo, type StructHashes, SyncablePath } from 'freedom-sync-types';
import { ACCESS_CONTROL_BUNDLE_ID } from 'freedom-syncable-store-types';
import { expectStrictEqual } from 'freedom-testing-tools';

import { insertIntoStructHashes } from '../insertIntoStructHashes.ts';

describe('insertIntoStructHashes', () => {
  it('should work with root base path', () => {
    const hashes: StructHashes = {};

    const basePath = new SyncablePath(storageRootIdInfo.make('test'));

    insertIntoStructHashes(hashes, basePath, basePath.append(plainId('folder', 'testing')), sha256HashInfo.make('testing-folder-hash'));
    insertIntoStructHashes(
      hashes,
      basePath,
      basePath.append(plainId('folder', 'testing'), ACCESS_CONTROL_BUNDLE_ID),
      sha256HashInfo.make('testing-folder-access-control-bundle-hash')
    );

    expectStrictEqual(hashes.contents?.[plainId('folder', 'testing')]?.hash, sha256HashInfo.make('testing-folder-hash'));
    expectStrictEqual(
      hashes.contents?.[plainId('folder', 'testing')]?.contents?.[ACCESS_CONTROL_BUNDLE_ID]?.hash,
      sha256HashInfo.make('testing-folder-access-control-bundle-hash')
    );
  });

  it('should work with non-root base path', () => {
    const hashes: StructHashes = {};

    const basePath = new SyncablePath(storageRootIdInfo.make('test'), plainId('folder', 'folder'));

    insertIntoStructHashes(hashes, basePath, basePath.append(plainId('folder', 'testing')), sha256HashInfo.make('testing-folder-hash'));
    insertIntoStructHashes(
      hashes,
      basePath,
      basePath.append(plainId('folder', 'testing'), ACCESS_CONTROL_BUNDLE_ID),
      sha256HashInfo.make('testing-folder-access-control-bundle-hash')
    );

    expectStrictEqual(hashes.contents?.[plainId('folder', 'testing')]?.hash, sha256HashInfo.make('testing-folder-hash'));
    expectStrictEqual(
      hashes.contents?.[plainId('folder', 'testing')]?.contents?.[ACCESS_CONTROL_BUNDLE_ID]?.hash,
      sha256HashInfo.make('testing-folder-access-control-bundle-hash')
    );
  });
});
