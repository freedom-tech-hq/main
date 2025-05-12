import type { SuiteContext, TestContext } from 'node:test';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { allResultsMapped } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import { makeTrace, makeUuid } from 'freedom-contexts';
import { generateCryptoCombinationKeySet } from 'freedom-crypto';
import type { PrivateCombinationCryptoKeySet } from 'freedom-crypto-data';
import type { UserKeys } from 'freedom-crypto-service';
import { invalidateAllInMemoryCaches } from 'freedom-in-memory-cache';
import { InMemorySyncableStoreBacking } from 'freedom-in-memory-syncable-store-backing';
import { DEFAULT_SALT_ID, encName, plainId, storageRootIdInfo, SyncablePathPattern, uuidId } from 'freedom-sync-types';
import { expectErrorCode, expectOk, expectStrictEqual } from 'freedom-testing-tools';

import { makeUserKeysForTesting } from '../../tests/makeUserKeysForTesting.ts';
import { DefaultSyncableStore } from '../../types/DefaultSyncableStore.ts';
import { createBinaryFileAtPath } from '../create/createBinaryFileAtPath.ts';
import { createBundleAtPath } from '../create/createBundleAtPath.ts';
import { createFolderAtPath } from '../create/createFolderAtPath.ts';
import { findSyncables } from '../findSyncables.ts';
import { generateProvenanceForNewSyncableStore } from '../generateProvenanceForNewSyncableStore.ts';
import { initializeRoot } from '../initializeRoot.ts';

describe('findSyncables', () => {
  let trace!: Trace;
  let privateKeys!: PrivateCombinationCryptoKeySet;
  let userKeys!: UserKeys;
  let storeBacking!: InMemorySyncableStoreBacking;
  let store!: DefaultSyncableStore;

  const storageRootId = storageRootIdInfo.make('test');

  afterEach(invalidateAllInMemoryCaches);

  beforeEach(async (_t: TestContext | SuiteContext) => {
    trace = makeTrace('test');

    const internalCryptoKeys = await generateCryptoCombinationKeySet(trace);
    expectOk(internalCryptoKeys);
    privateKeys = internalCryptoKeys.value;

    userKeys = makeUserKeysForTesting({ privateKeys: privateKeys });

    const provenance = await generateProvenanceForNewSyncableStore(trace, {
      storageRootId,
      userKeys,
      trustedTimeSignature: undefined
    });
    expectOk(provenance);

    storeBacking = new InMemorySyncableStoreBacking({ provenance: provenance.value });
    store = new DefaultSyncableStore({
      storageRootId,
      backing: storeBacking,
      userKeys,
      creatorPublicKeys: privateKeys.publicOnly(),
      saltsById: { [DEFAULT_SALT_ID]: makeUuid() }
    });

    expectOk(await initializeRoot(trace, store));
  });

  // Helper function to generate test data structure
  async function createTestStructure() {
    // Create root folder
    const rootFolder = await createFolderAtPath(trace, store, store.path.append(uuidId('folder')), {
      name: encName('root-folder')
    });
    expectOk(rootFolder);
    const rootPath = rootFolder.value.path;

    // Create subfolders
    const docs = await createFolderAtPath(trace, store, rootPath.append(plainId('folder', 'docs')), {
      name: encName('docs')
    });
    expectOk(docs);
    const docsPath = docs.value.path;

    const images = await createFolderAtPath(trace, store, rootPath.append(plainId('folder', 'images')), {
      name: encName('images')
    });
    expectOk(images);
    const imagesPath = images.value.path;

    // Create files in docs folder
    const readme = await createBinaryFileAtPath(trace, store, docsPath.append(plainId('file', 'readme.txt')), {
      name: encName('readme.txt'),
      value: Buffer.from('This is a readme file', 'utf-8')
    });
    expectOk(readme);

    const notes = await createBinaryFileAtPath(trace, store, docsPath.append(plainId('file', 'notes.txt')), {
      name: encName('notes.txt'),
      value: Buffer.from('Some notes here', 'utf-8')
    });
    expectOk(notes);

    // Create files in images folder
    const photo1 = await createBinaryFileAtPath(trace, store, imagesPath.append(plainId('file', 'photo1.jpg')), {
      name: encName('photo1.jpg'),
      value: Buffer.from('photo1 data', 'utf-8')
    });
    expectOk(photo1);

    const photo2 = await createBinaryFileAtPath(trace, store, imagesPath.append(plainId('file', 'photo2.jpg')), {
      name: encName('photo2.jpg'),
      value: Buffer.from('photo2 data', 'utf-8')
    });
    expectOk(photo2);

    // Create a bundle
    const bundle = await createBundleAtPath(trace, store, rootPath.append(plainId('bundle', 'settings')), {
      name: encName('settings')
    });
    expectOk(bundle);
    const bundlePath = bundle.value.path;

    // Create files in bundle
    const config = await createBinaryFileAtPath(trace, store, bundlePath.append(plainId('file', 'config.json')), {
      name: encName('config.json'),
      value: Buffer.from('{"setting": "value"}', 'utf-8')
    });
    expectOk(config);

    return {
      rootPath,
      docsPath,
      imagesPath,
      bundlePath
    };
  }

  it('should find all items at a path', async () => {
    const { rootPath } = await createTestStructure();

    // Find all items at root path
    const result = await findSyncables(trace, store, {
      basePath: rootPath,
      glob: { include: [new SyncablePathPattern('**')] }
    });

    expectOk(result);

    // Should find 8 items: 2 folders + (4 access control items per folder + 4 access control items for root), 1 bundle, and 5 files
    expectStrictEqual(result.value.length, 20);

    // Count by type
    const folderCount = result.value.filter((item) => item.type === 'folder').length;
    const fileCount = result.value.filter((item) => item.type === 'file').length;
    const bundleCount = result.value.filter((item) => item.type === 'bundle').length;

    expectStrictEqual(folderCount, 2); // 'docs' and 'images' folders
    expectStrictEqual(fileCount, 8); // 2 docs, 2 images, 1 config + 3 access control files
    expectStrictEqual(bundleCount, 10); // settings bundle + 3 bundles per access control
  });

  it('should filter by item type', async () => {
    const { rootPath } = await createTestStructure();

    // Find only files
    const filesResult = await findSyncables(trace, store, {
      basePath: rootPath,
      glob: { include: [new SyncablePathPattern('**')] },
      type: 'file'
    });

    expectOk(filesResult);
    expectStrictEqual(filesResult.value.length, 8); // 2 docs, 2 images, 1 config + 3 access control files
    filesResult.value.forEach((item) => {
      expectStrictEqual(item.type, 'file');
    });

    // Find only folders
    const foldersResult = await findSyncables(trace, store, {
      basePath: rootPath,
      glob: { include: [new SyncablePathPattern('**')] },
      type: 'folder'
    });

    expectOk(foldersResult);
    expectStrictEqual(foldersResult.value.length, 2);
    foldersResult.value.forEach((item) => {
      expectStrictEqual(item.type, 'folder');
    });

    // Find only bundles
    const bundlesResult = await findSyncables(trace, store, {
      basePath: rootPath,
      glob: { include: [new SyncablePathPattern('**')] },
      type: 'bundle'
    });

    expectOk(bundlesResult);
    expectStrictEqual(bundlesResult.value.length, 10); // settings bundle + 3 bundles per access control
    bundlesResult.value.forEach((item) => {
      expectStrictEqual(item.type, 'bundle');
    });
  });

  it('should find items within a specific subfolder', async () => {
    const { docsPath } = await createTestStructure();

    // Find all items in docs folder
    const result = await findSyncables(trace, store, {
      basePath: docsPath,
      glob: { include: [new SyncablePathPattern('**')] }
    });

    expectOk(result);
    expectStrictEqual(result.value.length, 6); // Just the 2 doc files + 4 access control items
  });

  it('should return not-found when basePath does not exist', async () => {
    // Create a path that doesn't exist
    const nonExistentPath = store.path.append(uuidId('folder')).append(uuidId('folder'));

    const result = await findSyncables(trace, store, {
      basePath: nonExistentPath,
      glob: { include: [new SyncablePathPattern('**')] }
    });
    expectErrorCode(result, 'not-found');
  });

  describe('include patterns', () => {
    it('should find items matching specific path patterns', async () => {
      const { rootPath } = await createTestStructure();

      // Find items in the images folder using wildcard
      const result = await findSyncables(trace, store, {
        basePath: rootPath,
        glob: { include: [new SyncablePathPattern(plainId('folder', 'images'), '**')] }
      });

      expectOk(result);
      expectStrictEqual(result.value.length, 7); // images folder + 2 image files + 4 access control items

      // Verify the specific files we found
      const fileNames = await allResultsMapped(
        trace,
        result.value.filter((item) => item.type === 'file'),
        {},
        async (trace, file) => await file.getName(trace)
      );
      expectOk(fileNames);

      // Should have found the image files
      expectStrictEqual(fileNames.value.includes('photo1.jpg'), true);
      expectStrictEqual(fileNames.value.includes('photo2.jpg'), true);
    });

    it('should find items matching multiple include patterns', async () => {
      const { rootPath } = await createTestStructure();

      // Find items matching either pattern
      const result = await findSyncables(trace, store, {
        basePath: rootPath,
        glob: {
          include: [
            // Match files directly in the docs folder
            new SyncablePathPattern(plainId('folder', 'docs'), '*'),
            // Match files in the settings bundle
            new SyncablePathPattern(plainId('bundle', 'settings'), '*')
          ]
        }
      });

      expectOk(result);

      // Should find 3 items: 2 doc files + 1 config file in bundle
      expectStrictEqual(result.value.length, 4); // + 1 access control item
      expectStrictEqual(result.value.filter((item) => item.type === 'file').length, 3);
    });

    it('should find items matching specific file patterns', async () => {
      const { rootPath } = await createTestStructure();

      // Find all .txt files
      const result = await findSyncables(trace, store, {
        basePath: rootPath,
        glob: { include: [new SyncablePathPattern('**', '*')] },
        type: 'file'
      });

      expectOk(result);

      // Verify the names of the files
      const fileNames = await allResultsMapped(trace, result.value, {}, async (trace, file) => await file.getName(trace));
      expectOk(fileNames);

      // Should find all 5 files + 3 access control files
      expectStrictEqual(fileNames.value.length, 8);

      // Filter to just .txt files
      const txtFiles = fileNames.value.filter((name) => name.endsWith('.txt'));
      expectStrictEqual(txtFiles.length, 2);
      expectStrictEqual(txtFiles.includes('readme.txt'), true);
      expectStrictEqual(txtFiles.includes('notes.txt'), true);
    });
  });

  describe('exclude patterns', () => {
    it('should exclude specific paths', async () => {
      const { rootPath } = await createTestStructure();

      // Find all items except those in the images folder
      const result = await findSyncables(trace, store, {
        basePath: rootPath,
        glob: {
          include: [new SyncablePathPattern('**')],
          exclude: [new SyncablePathPattern(plainId('folder', 'images'), '**')]
        }
      });

      expectOk(result);

      // Should find 5 items: root's direct children (2 folders + 1 bundle) + 2 doc files
      // But not the images folder or its contents + 4 access control items for the non-excluded folder and 4 access control items for the
      // root
      expectStrictEqual(result.value.length, 13);

      // Check folder names
      const folderNames = await allResultsMapped(
        trace,
        result.value.filter((item) => item.type === 'folder'),
        {},
        async (trace, folder) => await folder.getName(trace)
      );
      expectOk(folderNames);

      // Should include 'docs' but not 'images'
      expectStrictEqual(folderNames.value.includes('docs'), true);
      expectStrictEqual(folderNames.value.includes('images'), false);
    });

    it('should handle multiple exclude patterns', async () => {
      const { rootPath } = await createTestStructure();

      // Find all items except bundles and .txt files
      const result = await findSyncables(trace, store, {
        basePath: rootPath,
        glob: {
          include: [new SyncablePathPattern('**')],
          exclude: [
            // Exclude bundle type items
            new SyncablePathPattern('**', plainId('bundle', 'settings'), '**'),
            // Exclude .txt files in docs folder
            new SyncablePathPattern(plainId('folder', 'docs'), '**')
          ]
        }
      });

      expectOk(result);

      // Should find 4 items: 2 folders (docs, images) + 2 image files + 4 access control items for non-excluded folder and 4 access control
      // items for the root
      expectStrictEqual(result.value.length, 11);

      // Check types
      const typeCounts = {
        folder: result.value.filter((item) => item.type === 'folder').length,
        file: result.value.filter((item) => item.type === 'file').length,
        bundle: result.value.filter((item) => item.type === 'bundle').length
      };

      expectStrictEqual(typeCounts.folder, 1);
      expectStrictEqual(typeCounts.file, 4); // Only the image files + 2 access control files
      expectStrictEqual(typeCounts.bundle, 6); // 6 access control bundles
    });
  });

  describe('combined include and exclude patterns', () => {
    it('should handle complex path patterns', async () => {
      const { rootPath } = await createTestStructure();

      // Create a deeper structure for more complex pattern testing
      const imagesPath = rootPath.append(plainId('folder', 'images'));

      // Add a subfolder to images
      const archiveFolder = await createFolderAtPath(trace, store, imagesPath.append(plainId('folder', 'archive')), {
        name: encName('archive')
      });
      expectOk(archiveFolder);
      const archivePath = archiveFolder.value.path;

      // Add files to the archive folder
      const oldPhoto = await createBinaryFileAtPath(trace, store, archivePath.append(plainId('file', 'old_photo.jpg')), {
        name: encName('old_photo.jpg'),
        value: Buffer.from('old photo data', 'utf-8')
      });
      expectOk(oldPhoto);

      // Find using complex include/exclude patterns
      const result = await findSyncables(trace, store, {
        basePath: rootPath,
        glob: {
          include: [
            // Include all image files in any folder
            new SyncablePathPattern('**', '*')
          ],
          exclude: [
            // Exclude archived images
            new SyncablePathPattern('**', plainId('folder', 'archive'), '**')
          ]
        },
        type: 'file'
      });

      expectOk(result);

      // Should find 5 files: 2 docs, 2 regular images, 1 config
      // But not the archived image + 3 access control files
      expectStrictEqual(result.value.length, 8);

      // Check file names
      const fileNames = await allResultsMapped(trace, result.value, {}, async (trace, file) => await file.getName(trace));
      expectOk(fileNames);

      // Should include regular image files
      expectStrictEqual(fileNames.value.includes('photo1.jpg'), true);
      expectStrictEqual(fileNames.value.includes('photo2.jpg'), true);

      // Should not include archived images
      expectStrictEqual(fileNames.value.includes('old_photo.jpg'), false);
    });
  });

  describe('edge cases', () => {
    it('should handle empty folder', async () => {
      // Create an empty folder
      const emptyFolder = await createFolderAtPath(trace, store, store.path.append(plainId('folder', 'empty-folder')), {
        name: encName('empty-folder')
      });
      expectOk(emptyFolder);
      const emptyPath = emptyFolder.value.path;

      // Try to find items in empty folder
      const result = await findSyncables(trace, store, {
        basePath: emptyPath,
        glob: { include: [new SyncablePathPattern('**')] }
      });

      expectOk(result);
      expectStrictEqual(result.value.length, 4); // 4 access control items for the root folder
    });

    it('should handle wildcard patterns with no matches', async () => {
      const { rootPath } = await createTestStructure();

      // Use a pattern that won't match anything
      const result = await findSyncables(trace, store, {
        basePath: rootPath,
        glob: { include: [new SyncablePathPattern(plainId('folder', 'non-existent'), '**')] }
      });

      expectOk(result);
      expectStrictEqual(result.value.length, 0);
    });

    it('should handle arrays of types', async () => {
      const { rootPath } = await createTestStructure();

      // Find both files and folders, but not bundles
      const result = await findSyncables(trace, store, {
        basePath: rootPath,
        glob: { include: [new SyncablePathPattern('**')] },
        type: ['file', 'folder']
      });

      expectOk(result);

      // Should find 7 items: 2 folders + 5 files (but not the bundle) + 3 access control files
      expectStrictEqual(result.value.length, 10);

      // Verify types
      result.value.forEach((item) => {
        expectStrictEqual(['file', 'folder'].includes(item.type), true);
      });

      // Double-check counts by type
      const typeCounts = {
        folder: result.value.filter((item) => item.type === 'folder').length,
        file: result.value.filter((item) => item.type === 'file').length
      };

      expectStrictEqual(typeCounts.folder, 2);
      expectStrictEqual(typeCounts.file, 8); // 5 files + 3 access control files
    });

    it('should handle deep nesting', async () => {
      // Create a deeply nested structure
      const rootFolder = await createFolderAtPath(trace, store, store.path.append(uuidId('folder')), {
        name: encName('root')
      });
      expectOk(rootFolder);
      let currentPath = rootFolder.value.path;

      // Create 10 levels of nesting
      for (let i = 1; i <= 10; i++) {
        const folder = await createFolderAtPath(trace, store, currentPath.append(plainId('folder', `level-${i}`)), {
          name: encName(`level-${i}`)
        });
        expectOk(folder);
        currentPath = folder.value.path;

        // Add a file at each level
        const file = await createBinaryFileAtPath(trace, store, currentPath.append(plainId('file', `file-${i}.txt`)), {
          name: encName(`file-${i}.txt`),
          value: Buffer.from(`Level ${i} content`, 'utf-8')
        });
        expectOk(file);
      }

      // Find all items in the deep structure
      const result = await findSyncables(trace, store, {
        basePath: rootFolder.value.path,
        glob: { include: [new SyncablePathPattern('**')] }
      });

      expectOk(result);

      // Should find 20 items: 10 folders + 10 files + 4 access control items for each folder + 4 access control items for the root
      expectStrictEqual(result.value.length, 64);

      // Verify counts by type
      const folderCount = result.value.filter((item) => item.type === 'folder').length;
      const fileCount = result.value.filter((item) => item.type === 'file').length;

      expectStrictEqual(folderCount, 10);
      expectStrictEqual(fileCount, 21); // 10 files + 11 access control files
    });

    it('should handle finding only the deepest items', async () => {
      // Create a structure with some depth
      const rootFolder = await createFolderAtPath(trace, store, store.path.append(uuidId('folder')), {
        name: encName('deep-root')
      });
      expectOk(rootFolder);
      const rootPath = rootFolder.value.path;

      // Create level 1
      const level1 = await createFolderAtPath(trace, store, rootPath.append(plainId('folder', 'level1')), {
        name: encName('level1')
      });
      expectOk(level1);
      const level1Path = level1.value.path;

      // Create level 2
      const level2 = await createFolderAtPath(trace, store, level1Path.append(plainId('folder', 'level2')), {
        name: encName('level2')
      });
      expectOk(level2);
      const level2Path = level2.value.path;

      // Add files at each level
      const rootFile = await createBinaryFileAtPath(trace, store, rootPath.append(plainId('file', 'root-file.txt')), {
        name: encName('root-file.txt'),
        value: Buffer.from('Root content', 'utf-8')
      });
      expectOk(rootFile);

      const level1File = await createBinaryFileAtPath(trace, store, level1Path.append(plainId('file', 'level1-file.txt')), {
        name: encName('level1-file.txt'),
        value: Buffer.from('Level 1 content', 'utf-8')
      });
      expectOk(level1File);

      const level2File = await createBinaryFileAtPath(trace, store, level2Path.append(plainId('file', 'level2-file.txt')), {
        name: encName('level2-file.txt'),
        value: Buffer.from('Level 2 content', 'utf-8')
      });
      expectOk(level2File);

      // Find only the deepest files (level 2)
      const result = await findSyncables(trace, store, {
        basePath: rootPath,
        glob: { include: [new SyncablePathPattern(plainId('folder', 'level1'), plainId('folder', 'level2'), '*')] },
        type: 'file'
      });

      expectOk(result);

      // Should find 1 file at level 2 only
      expectStrictEqual(result.value.length, 1);

      // Verify the file name
      const fileName = await result.value[0].getName(trace);
      expectOk(fileName);
      expectStrictEqual(fileName.value, 'level2-file.txt');
    });
  });
});
