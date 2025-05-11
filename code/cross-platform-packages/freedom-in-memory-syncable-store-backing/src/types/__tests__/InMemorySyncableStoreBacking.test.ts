import { describe, it } from 'node:test';
import { expect } from 'expect';
import { makeTrace, makeUuid } from 'freedom-contexts';
import type { SyncableId, SyncableItemMetadata, SyncableProvenance } from 'freedom-sync-types';
import { SyncablePath, storageRootIdInfo } from 'freedom-sync-types';
import type { SyncableStoreBackingItemMetadata } from 'freedom-syncable-store-backing-types';

import { InMemorySyncableStoreBacking } from '../InMemorySyncableStoreBacking.ts';
import { expectOk } from 'freedom-testing-tools';
import { ROOT_FOLDER_ID } from '../../internal/consts/special-ids.ts';
import { generateSha256HashFromHashesById } from 'freedom-crypto';
import { uncheckedResult } from 'freedom-async';

describe('InMemorySyncableStoreBacking', () => {
  // Scenario 1: Basic File Lifecycle
  it('handles complete file lifecycle operations', async () => {
    // Arrange, shared
    const trace = makeTrace();

    const storageRootId = storageRootIdInfo.make('the-root');
    const rootPath = new SyncablePath(storageRootId);

    const provenance: SyncableProvenance = 'not-used' as unknown as SyncableProvenance;

    const backing = new InMemorySyncableStoreBacking({ provenance: provenance });

    ///////////////////////////////////////////////////////////////////////////////////
    //////////// Folder ///////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////

    //////////// createFolderWithPath /////////////////////////////////////////////////
    // Arrange
    const folderId: SyncableId = 'EyTbS_1vDPSdHgVmnWBSgooX+wBKoDDywARCAgg8jZ7mBueKM=';
    const folderMetadata: SyncableItemMetadata = {
      name: 'E_AbcAbcAbc',
      provenance,
    }
    const folderPath = rootPath.append(folderId);
    const folderHash = await uncheckedResult(generateSha256HashFromHashesById(trace, {}));
    const folderBackingMetadata: SyncableStoreBackingItemMetadata = { ...folderMetadata, hash: folderHash, numDescendants: 0, sizeBytes: 0 };

    // Act
    const createFolderResult = await backing.createFolderWithPath(trace, folderPath, { metadata: folderBackingMetadata });

    // Assert
    expect(createFolderResult).toStrictEqual({
      ok: true,
      value: expect.objectContaining({ type: 'folder' })
    });

    //////////// existsAtPath /////////////////////////////////////////////////////////
    // Act, exists
    const existsResult = await backing.existsAtPath(trace, folderPath);

    // Assert
    expect(existsResult).toStrictEqual({
      ok: true,
      value: true
    });

    // Act, does not exist
    const notExistsResult = await backing.existsAtPath(
      trace,
      // Different ID
      folderPath.append('EyTFS_UmIkl8PodtjgIGzZsey1LH7rX1Hrj1z+C+3MBao5l7Y=')
    );

    // Assert
    expect(notExistsResult).toStrictEqual({
      ok: true,
      value: false
    });

    //////////// getMetadataAtPath ////////////////////////////////////////////////////
    // Act
    const metadataResult = await backing.getMetadataAtPath(trace, folderPath);

    // Assert
    expect(metadataResult).toStrictEqual({
      ok: true,
      value: {
        name: folderMetadata.name
      }
    });

    //////////// getMetadataByIdInPath ///////////////////////////////////////////////
    // Act
    const metadataByIdResult = await backing.getMetadataByIdInPath(trace, rootPath);

    // Assert
    expect(metadataByIdResult).toStrictEqual({
      ok: true,
      value: {
        [folderId]: {
          name: folderMetadata.name
        }
      }
    });

    //////////// getIdsInPath /////////////////////////////////////////////////////////
    // Act
    const rootListResult = await backing.getIdsInPath(trace, rootPath);

    // Assert
    expect(rootListResult).toStrictEqual({
      ok: true,
      value: [folderId]
    });

    ///////////////////////////////////////////////////////////////////////////////////
    //////////// File /////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////
    // Arrange
    const fileId: SyncableId = 'EyTfS_Iz5CW754XOAlXuPWDUbJdvClWPBLKd/S3avqoPjrNC8=';
    const fileMetadata: SyncableItemMetadata = {
      name: 'E_AbcAbcAbc',
      provenance,
    }
    const filePath = rootPath.append(fileId);
    const fileHash = await uncheckedResult(generateSha256HashFromHashesById(trace, {}));
    const fileBackingMetadata: SyncableStoreBackingItemMetadata = { ...fileMetadata, hash: fileHash, numDescendants: 0, sizeBytes: 0 };

    // Act
    const createFileResult = await backing.createBinaryFileWithPath(trace, filePath, {
      data: new Uint8Array([1, 2, 3, 4, 5]),
      metadata: fileBackingMetadata
    });

    // Assert
    expect(createFileResult).toStrictEqual({
      ok: true,
      value: expect.objectContaining({ type: 'file' })
    });

    // Act
    const rootListResult2 = await backing.getIdsInPath(trace, rootPath);

    // Assert
    expect(rootListResult2).toStrictEqual({
      ok: true,
      value: expect.arrayContaining([folderId, fileId])
    });
  });

  it('x', async () => {
    // Arrange
    const trace = makeTrace();
    // Create metadata with required properties
    const testMetadata: SyncableStoreBackingItemMetadata = {
      // The provenance will be assigned when creating the file
      provenance: {
        uuid: makeUuid()
      },
      // Optional properties from LocalItemMetadata can be partial
      hash: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      numDescendants: 0,
      sizeBytes: 0,
      name: 'test-file'
    };
    const backing = new InMemorySyncableStoreBacking(testMetadata);

    // Create test path
    const storageRootId = storageRootIdInfo.make('test');
    const rootPath = new SyncablePath(storageRootId);
    const testPath = new SyncablePath(storageRootId, 'test-folder', 'test-file');

    // Act - Check if path exists initially
    const initialExistsResult = await backing.existsAtPath(trace, testPath);

    // Assert - Should not exist initially
    expect(initialExistsResult).toStrictEqual({
      ok: true,
      value: false
    });

    const x = await backing.getIdsInPath(trace, rootPath);
    console.log(x);

    // // Act - Create binary file
    // const fileContent = new Uint8Array([1, 2, 3, 4, 5]);
    // const createResult = await backing.createBinaryFileWithPath(trace, testPath, {
    //   data: fileContent,
    //   metadata: testMetadata
    // });
    //
    // // Assert - File should be created successfully
    // expect(createResult).toStrictEqual({
    //   ok: true,
    //   value: expect.objectContaining({
    //     type: 'file'
    //   })
    // });
    //
    // // Act - Verify path exists now
    // const existsResult = await backing.existsAtPath(trace, testPath);
    //
    // // Assert - Path should exist
    // expect(existsResult).toStrictEqual({
    //   ok: true,
    //   value: true
    // });
    //
    // // Act - Retrieve file accessor
    // const getResult = await backing.getAtPath(trace, testPath, 'file');
    //
    // // Assert - Should retrieve file accessor correctly
    // expect(getResult).toStrictEqual({
    //   ok: true,
    //   value: expect.objectContaining({
    //     type: 'file'
    //   })
    // });
    //
    // // Act - Try with wrong type
    // const wrongTypeResult = await backing.getAtPath(trace, testPath, 'folder');
    //
    // // Assert - Should fail with wrong-type
    // expect(wrongTypeResult).toStrictEqual(
    //   { ok: false, errorCode: 'wrong-type' }
    // );
    //
    // // Act - Get metadata
    // const metadataResult = await backing.getMetadataAtPath(trace, testPath);
    //
    // // Assert - Metadata should match creation metadata
    // expect(metadataResult).toStrictEqual({
    //   ok: true,
    //   value: expect.objectContaining({
    //     name: testMetadata.name
    //   })
    // });
    // // Assertion already covered in the assert.deepEqual above
    //
    // // Act - Update local metadata
    // const updatedMetadata = {
    //   hash: 'sha256:updated',
    //   numDescendants: 1,
    //   sizeBytes: 10
    // };
    // const updateResult = await backing.updateLocalMetadataAtPath(trace, testPath, updatedMetadata);
    //
    // // Assert - Update should succeed
    // expect(updateResult.ok).toBe(true);
    //
    // // Act - Get updated metadata
    // const updatedMetadataResult = await backing.getMetadataAtPath(trace, testPath);
    //
    // // Assert - Should show updated values
    // expect(updatedMetadataResult).toStrictEqual({
    //   ok: true,
    //   value: expect.objectContaining({
    //     hash: 'sha256:updated'
    //   })
    // });
    //
    // // Act - Delete file
    // const deleteResult = await backing.deleteAtPath(trace, testPath);
    //
    // // Assert - Delete should succeed
    // expect(deleteResult.ok).toBe(true);
    //
    // // Act - Verify deletion
    // const finalExistsResult = await backing.existsAtPath(trace, testPath);
    //
    // // Assert - Should not exist after deletion
    // expect(finalExistsResult).toStrictEqual({
    //   ok: true,
    //   value: false
    // });
  });
});
