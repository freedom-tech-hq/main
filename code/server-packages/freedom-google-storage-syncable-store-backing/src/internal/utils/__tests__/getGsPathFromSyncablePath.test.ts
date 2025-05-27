import { describe, it } from 'node:test';

import { expect } from 'expect';
import { storageRootIdInfo, SyncablePath } from 'freedom-sync-types';

import { getGsPathFromSyncablePath } from '../getGsPathFromSyncablePath.ts';

describe('getGsPathFromSyncablePath', () => {
  // Common test data
  const prefix = 'the-prefix/';
  const storageRootId = storageRootIdInfo.make('the-root');
  const storageRootXx = storageRootId.replaceAll('/', '`');
  // Ensure every block contains + and /
  const folderId = 'EyTbS_the+folder+WBSgooX+wBKoDDywA/CAgg8jZ7mBueKM=';
  const folderXx = 'EyTbS_the+folder+WBSgooX+wBKoDDywA`CAgg8jZ7mBueKM=';
  const fileId = 'EyTfS_the+file+OAlXuPWDUbJdvClWPBLKd/S3avqoPjrNC8=';
  const fileXx = 'EyTfS_the+file+OAlXuPWDUbJdvClWPBLKd`S3avqoPjrNC8=';
  const subFolderId = 'EyTbS_the+sub+folder+WBSgowBKDDyw/RCAgg8jZ7mBueKM=';
  const subFolderXx = 'EyTbS_the+sub+folder+WBSgowBKDDyw`RCAgg8jZ7mBueKM=';

  it('handles a root-only path', async () => {
    // Arrange
    const rootPath = new SyncablePath(storageRootId);

    // Act
    const result = getGsPathFromSyncablePath(prefix, rootPath, 'item');

    // Assert
    expect(result).toBe(`${prefix}_/${storageRootId}`);
  });

  it('handles one level', async () => {
    // Arrange
    const rootPath = new SyncablePath(storageRootId);
    const folderPath = rootPath.append(folderId);

    // Act
    const result = getGsPathFromSyncablePath(prefix, folderPath, 'item');

    // Assert
    expect(result).toBe(`${prefix}${storageRootXx}/_/${folderXx}`);
  });

  it('handles multiple levels', async () => {
    // Arrange
    const rootPath = new SyncablePath(storageRootId);
    const subFolderPath = rootPath.append(folderId).append(subFolderId).append(fileId);

    // Act
    const result = getGsPathFromSyncablePath(prefix, subFolderPath, 'item');

    // Assert
    expect(result).toBe(`${prefix}${storageRootXx}/${folderXx}/${subFolderXx}/_/${fileXx}`);
  });

  it('creates scan-dir prefix for store', async () => {
    // Arrange
    const rootPath = new SyncablePath(storageRootId);

    // Act
    const result = getGsPathFromSyncablePath(prefix, rootPath, 'scan-direct');

    // Assert
    expect(result).toBe(`${prefix}${storageRootXx}/_`);
  });

  it('creates scan-dir prefix', async () => {
    // Arrange
    const rootPath = new SyncablePath(storageRootId);
    const subFolderPath = rootPath.append(folderId).append(subFolderId);

    // Act
    const result = getGsPathFromSyncablePath(prefix, subFolderPath, 'scan-direct');

    // Assert
    expect(result).toBe(`${prefix}${storageRootXx}/${folderXx}/${subFolderXx}/_`);
  });

  it('creates scan-recursive path', async () => {
    // Arrange
    const rootPath = new SyncablePath(storageRootId);
    const subFolderPath = rootPath.append(folderId).append(subFolderId);

    // Act
    const result = getGsPathFromSyncablePath(prefix, subFolderPath, 'scan-recursive');

    // Assert
    expect(result).toBe(`${prefix}${storageRootXx}/${folderXx}/${subFolderXx}`);
  });
});
