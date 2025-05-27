import { describe, it } from 'node:test';

import { expect } from 'expect';
import { uncheckedResult } from 'freedom-async';
import { makeTrace } from 'freedom-contexts';
import { generateSha256HashFromHashesById } from 'freedom-crypto';
import { type SyncableId, type SyncableItemMetadata } from 'freedom-sync-types';
import { storageRootIdInfo, SyncablePath } from 'freedom-sync-types';
import { makeStoreParametersForTesting } from 'freedom-syncable-store/tests';
import type { SyncableStoreBackingItemMetadata } from 'freedom-syncable-store-backing-types';
import { expectOk } from 'freedom-testing-tools';

import { createGoogleStorageBucketForTests } from '../../tests/createGoogleStorageBucketForTests.ts';
import { GoogleStorageSyncableStoreBacking } from '../GoogleStorageSyncableStoreBacking.ts';

// Uncomment to enable temporarily
// createGoogleStorageBucketForTests.enableRealConnection();

// TODO: Split into test cases and unify with InMemorySyncableStoreBacking.test.ts
describe('GoogleStorageSyncableStoreBacking', () => {
  it('handles complete file lifecycle operations', async () => {
    // Arrange
    const trace = makeTrace();

    // Scenario Ids
    const storageRootId = storageRootIdInfo.make(`the-root-${Date.now()}`);
    const rootPath = new SyncablePath(storageRootId);

    const folderId: SyncableId = 'EyTbS_the+folder+WBSgooX+wBKoDDywARCAgg8jZ7mBueKM=';
    const folderPath = rootPath.append(folderId);

    const fileId: SyncableId = 'EyTfS_the+file+OAlXuPWDUbJdvClWPBLKd/S3avqoPjrNC8=';
    const filePath = rootPath.append(fileId);

    const subFolderId: SyncableId = 'EyTbS_the+sub+folder+WBSgowBKDDywARCAgg8jZ7mBueKM=';
    const subFolderPath = folderPath.append(subFolderId);

    const subFileId: SyncableId = 'EyTfS_the+sub+file+OAlXuPWDJdvClWBLKdS3avqoPjrNC8=';
    const subFilePath = folderPath.append(subFileId);

    const nonExistentFolderId: SyncableId = 'EyTbS_the+non+existent+folder+WBSgooAgg8jZ7mBueKM=';
    const nonExistentFileId: SyncableId = 'EyTfS_the+non+existent+file+WDUbJdvClW3avqoPjrNC8=';

    const { rootMetadata, provenance } = await makeStoreParametersForTesting(trace, storageRootId);
    const provenanceMatcher = {
      ...provenance,
      origin: {
        ...provenance.origin,
        value: {
          contentHash: provenance.origin.value.contentHash
          // is undefined and not included: trustedTimeSignature
        }
      }
    };

    // Create backing with test/mock bucket
    const { bucket, prefix } = createGoogleStorageBucketForTests();
    const backing = new GoogleStorageSyncableStoreBacking(bucket, prefix);

    // Initialize
    expectOk(await backing.initialize(trace, storageRootId, rootMetadata));

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // {
    //   // Arrange
    //   const fileMetadata: SyncableItemMetadata = {
    //     name: 'E_the+encrypted+file+name+base64',
    //     provenance
    //   };
    //   const fileHash = await uncheckedResult(generateSha256HashFromHashesById(trace, {}));
    //   const fileBackingMetadata: SyncableStoreBackingItemMetadata = {
    //     ...fileMetadata,
    //     hash: fileHash,
    //     numDescendants: 0,
    //     sizeBytes: 0
    //   };
    //
    //   // Act
    //   const createFileResult = await backing.createBinaryFileWithPath(trace, subFilePath, {
    //     data: new Uint8Array([1, 2, 3, 4, 5]),
    //     metadata: fileBackingMetadata
    //   });
    //
    //   // Assert
    //   expect(createFileResult).toStrictEqual({
    //     ok: true,
    //     value: {
    //       type: 'file',
    //       id: fileId,
    //       getBinary: expect.any(Function) // TODO: test
    //     }
    //   });
    //   return;
    // }
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    //////////// createFolderWithPath /////////////////////////////////////////////////
    // Arrange
    const folderMetadata: SyncableItemMetadata = {
      name: 'E_the+encrypted+name+base64',
      provenance
    };
    const folderHash = await uncheckedResult(generateSha256HashFromHashesById(trace, {}));
    const folderBackingMetadata: SyncableStoreBackingItemMetadata = {
      ...folderMetadata,
      hash: folderHash,
      numDescendants: 0,
      sizeBytes: 0
    };

    // Act
    const createFolderResult = await backing.createFolderWithPath(trace, folderPath, { metadata: folderBackingMetadata });

    // Assert
    expect(createFolderResult).toStrictEqual({
      ok: true,
      value: {
        type: 'folder',
        id: folderId
      }
    });

    // Arrange
    const subFolderMetadata: SyncableItemMetadata = {
      name: 'E_the+encrypted+subfolder+name+base64',
      provenance
    };
    const subFolderHash = await uncheckedResult(generateSha256HashFromHashesById(trace, {}));
    const subFolderBackingMetadata: SyncableStoreBackingItemMetadata = {
      ...subFolderMetadata,
      hash: subFolderHash,
      numDescendants: 0,
      sizeBytes: 0
    };

    // Act
    const createSubFolderResult = await backing.createFolderWithPath(trace, subFolderPath, { metadata: subFolderBackingMetadata });

    // Assert
    expect(createSubFolderResult).toStrictEqual({
      ok: true,
      value: {
        type: 'folder',
        id: subFolderId
      }
    });

    //////////// createBinaryFileWithPath /////////////////////////////////////////////
    // Arrange
    const fileMetadata: SyncableItemMetadata = {
      name: 'E_the+encrypted+file+name+base64',
      provenance
    };
    const fileHash = await uncheckedResult(generateSha256HashFromHashesById(trace, {}));
    const fileBackingMetadata: SyncableStoreBackingItemMetadata = { ...fileMetadata, hash: fileHash, numDescendants: 0, sizeBytes: 0 };

    // Act
    const createFileResult = await backing.createBinaryFileWithPath(trace, filePath, {
      data: new Uint8Array([1, 2, 3, 4, 5]),
      metadata: {
        ...fileBackingMetadata,
        provenance: provenanceMatcher
      }
    });

    // Assert
    expect(createFileResult).toStrictEqual({
      ok: true,
      value: {
        type: 'file',
        id: fileId,
        getBinary: expect.any(Function) // TODO: test
      }
    });

    // Arrange
    const subFileMetadata: SyncableItemMetadata = {
      name: 'E_the+encrypted+subfile+name+base64',
      provenance
    };
    const subFileHash = await uncheckedResult(generateSha256HashFromHashesById(trace, {}));
    const subFileBackingMetadata: SyncableStoreBackingItemMetadata = {
      ...subFileMetadata,
      hash: subFileHash,
      numDescendants: 0,
      sizeBytes: 0
    };

    // Act
    const createSubFileResult = await backing.createBinaryFileWithPath(trace, subFilePath, {
      data: new Uint8Array([1, 2, 3, 4, 5]),
      metadata: subFileBackingMetadata
    });

    // Assert
    expect(createSubFileResult).toStrictEqual({
      ok: true,
      value: {
        type: 'file',
        id: subFileId,
        getBinary: expect.any(Function) // TODO: test
      }
    });

    //////////// getIdsInPath /////////////////////////////////////////////////////////
    // Act
    const rootListResult = await backing.getIdsInPath(trace, rootPath);

    // Assert
    expect(rootListResult).toStrictEqual({
      ok: true,
      value: [folderId, fileId]
    });

    // Act
    const folderListResult = await backing.getIdsInPath(trace, folderPath);

    // Assert
    expect(folderListResult).toStrictEqual({
      ok: true,
      value: [subFolderId, subFileId]
    });

    //////////// existsAtPath /////////////////////////////////////////////////////////
    // Act, folder exists
    const folderExistsResult = await backing.existsAtPath(trace, folderPath);

    // Assert
    expect(folderExistsResult).toStrictEqual({
      ok: true,
      value: true
    });

    // Act, folder does not exist
    const folderNotExistResult = await backing.existsAtPath(trace, folderPath.append(nonExistentFolderId));

    // Assert
    expect(folderNotExistResult).toStrictEqual({
      ok: true,
      value: false
    });

    // Act, file exists
    const fileExistsResult = await backing.existsAtPath(trace, filePath);

    // Assert
    expect(fileExistsResult).toStrictEqual({
      ok: true,
      value: true
    });

    // Act, file does not exist
    const fileNotExistResult = await backing.existsAtPath(trace, filePath.append(nonExistentFileId));

    // Assert
    expect(fileNotExistResult).toStrictEqual({
      ok: true,
      value: false
    });

    //////////// getAtPath ///////////////////////////////////////////////////////////
    // Act - Get folder without type
    const getFolderResult = await backing.getAtPath(trace, folderPath);

    // Assert
    expect(getFolderResult).toStrictEqual({
      ok: true,
      value: {
        type: 'folder',
        id: folderId
      }
    });

    // Act - Get bundle-folder with correct type
    const getFolderWithTypeResult = await backing.getAtPath(trace, folderPath, 'bundle');

    // Assert
    expect(getFolderWithTypeResult).toStrictEqual({
      ok: true,
      value: {
        type: 'folder', // TODO: Hey, this is requested as 'bundle'
        id: folderId
      }
    });

    // // Act - Get folder-folder with correct type
    // const getFolderWithWrongTypeResult = await backing.getAtPath(trace, folderPath, 'folder');
    //
    // // Assert
    // expect(getFolderWithWrongTypeResult).toStrictEqual({
    //   ok: true,
    //   value: {
    //     type: 'folder',
    //     id: folderId
    //   }
    // });

    // Act - Get folder with wrong type
    const getFolderWrongTypeResult = await backing.getAtPath(trace, folderPath, 'file');

    // Assert
    expect(getFolderWrongTypeResult).toStrictEqual({
      ok: false,
      value: expect.objectContaining({
        errorCode: 'wrong-type'
      })
    });

    // Act - Get non-existent item
    const getNonExistentResult = await backing.getAtPath(trace, folderPath.append(nonExistentFolderId));

    // Assert
    expect(getNonExistentResult).toStrictEqual({
      ok: false,
      value: expect.objectContaining({
        errorCode: 'not-found'
      })
    });

    // TODO: Do the same for file, sub-folder, sub-file

    //////////// getMetadataAtPath ////////////////////////////////////////////////////
    // Act
    const folderMetadataResult = await backing.getMetadataAtPath(trace, folderPath);

    // Assert
    expect(folderMetadataResult).toStrictEqual({
      ok: true,
      value: {
        ...folderBackingMetadata,
        provenance: provenanceMatcher
      }
    });

    // Act
    const fileMetadataResult = await backing.getMetadataAtPath(trace, filePath);

    // Assert
    expect(fileMetadataResult).toStrictEqual({
      ok: true,
      value: {
        ...fileBackingMetadata,
        provenance: provenanceMatcher
      }
    });

    // Act
    const nonExistentMetadataResult = await backing.getMetadataAtPath(trace, folderPath.append(nonExistentFolderId));

    // Assert
    expect(nonExistentMetadataResult).toStrictEqual({
      ok: false,
      value: expect.objectContaining({
        errorCode: 'not-found'
      })
    });

    // Act
    const subFolderMetadataResult = await backing.getMetadataAtPath(trace, subFolderPath);

    // Assert
    expect(subFolderMetadataResult).toStrictEqual({
      ok: true,
      value: {
        ...subFolderBackingMetadata,
        provenance: provenanceMatcher
      }
    });

    // Act
    const subFileMetadataResult = await backing.getMetadataAtPath(trace, subFilePath);

    // Assert
    expect(subFileMetadataResult).toStrictEqual({
      ok: true,
      value: {
        ...subFileBackingMetadata,
        provenance: provenanceMatcher
      }
    });

    //////////// getMetadataByIdInPath ///////////////////////////////////////////////
    // Act
    const rootMetadataByIdResult = await backing.getMetadataByIdInPath(trace, rootPath, new Set([folderId, fileId]));

    // Assert
    expect(rootMetadataByIdResult).toStrictEqual({
      ok: true,
      value: {
        [folderId]: {
          ...folderBackingMetadata,
          provenance: provenanceMatcher
        },
        [fileId]: {
          ...fileBackingMetadata,
          provenance: provenanceMatcher
        }
      }
    });

    // Act
    const nonExistentMetadataByIdResult = await backing.getMetadataByIdInPath(
      trace,
      rootPath,
      new Set([nonExistentFolderId, nonExistentFileId])
    );

    // Assert
    expect(nonExistentMetadataByIdResult).toStrictEqual({
      ok: true, // TODO: fix
      value: {}
    });

    // Act
    const subMetadataByIdResult = await backing.getMetadataByIdInPath(trace, folderPath, new Set([subFolderId, subFileId]));

    // Assert
    expect(subMetadataByIdResult).toStrictEqual({
      ok: true,
      value: {
        [subFolderId]: {
          ...subFolderBackingMetadata,
          provenance: provenanceMatcher
        },
        [subFileId]: {
          ...subFileBackingMetadata,
          provenance: provenanceMatcher
        }
      }
    });

    //////////// updateLocalMetadataAtPath ///////////////////////////////////////////
    // Act
    const updateFolderMetadataResult = await backing.updateLocalMetadataAtPath(trace, folderPath, {
      numDescendants: 1,
      sizeBytes: 1
    });
    const updatedFolderMetadataResult = await backing.getMetadataAtPath(trace, folderPath);

    // Assert
    expect(updateFolderMetadataResult).toStrictEqual({
      ok: true,
      value: undefined
    });
    expect(updatedFolderMetadataResult).toStrictEqual({
      ok: true,
      value: {
        ...folderBackingMetadata,
        provenance: provenanceMatcher,
        numDescendants: 1,
        sizeBytes: 1
      }
    });

    // Act
    const updateFileMetadataResult = await backing.updateLocalMetadataAtPath(trace, filePath, {
      numDescendants: 2,
      sizeBytes: 2
    });
    const updatedFileMetadataResult = await backing.getMetadataAtPath(trace, filePath);

    // Assert
    expect(updateFileMetadataResult).toStrictEqual({
      ok: true,
      value: undefined
    });
    expect(updatedFileMetadataResult).toStrictEqual({
      ok: true,
      value: {
        ...fileBackingMetadata,
        provenance: provenanceMatcher,
        numDescendants: 2,
        sizeBytes: 2
      }
    });

    // Act
    const updateSubFolderMetadataResult = await backing.updateLocalMetadataAtPath(trace, subFolderPath, {
      numDescendants: 3,
      sizeBytes: 3
    });
    const updatedSubFolderMetadataResult = await backing.getMetadataAtPath(trace, subFolderPath);

    // Assert
    expect(updateSubFolderMetadataResult).toStrictEqual({
      ok: true,
      value: undefined
    });
    expect(updatedSubFolderMetadataResult).toStrictEqual({
      ok: true,
      value: {
        ...subFolderBackingMetadata,
        provenance: provenanceMatcher,
        numDescendants: 3,
        sizeBytes: 3
      }
    });

    // Act
    const updateSubFileMetadataResult = await backing.updateLocalMetadataAtPath(trace, subFilePath, {
      numDescendants: 4,
      sizeBytes: 4
    });
    const updatedSubFileMetadataResult = await backing.getMetadataAtPath(trace, subFilePath);

    // Assert
    expect(updateSubFileMetadataResult).toStrictEqual({
      ok: true,
      value: undefined
    });
    expect(updatedSubFileMetadataResult).toStrictEqual({
      ok: true,
      value: {
        ...subFileBackingMetadata,
        provenance: provenanceMatcher,
        numDescendants: 4,
        sizeBytes: 4
      }
    });

    //////////// deleteAtPath ///////////////////////////////////////////////////////////
    // Delete sub-file first
    // Act
    const deleteSubFileResult = await backing.deleteAtPath(trace, subFilePath);
    const folderListAfterSubFileDelete = await backing.getIdsInPath(trace, folderPath);

    // Assert
    expect(deleteSubFileResult).toStrictEqual({
      ok: true,
      value: undefined
    });
    expect(folderListAfterSubFileDelete).toStrictEqual({
      ok: true,
      value: [subFolderId]
    });

    // Delete sub-folder
    // Act
    const deleteSubFolderResult = await backing.deleteAtPath(trace, subFolderPath);
    const folderListAfterSubFolderDelete = await backing.getIdsInPath(trace, folderPath);

    // Assert
    expect(deleteSubFolderResult).toStrictEqual({
      ok: true,
      value: undefined
    });
    expect(folderListAfterSubFolderDelete).toStrictEqual({
      ok: true,
      value: []
    });

    // Delete file
    // Act
    const deleteFileResult = await backing.deleteAtPath(trace, filePath);
    const rootListAfterFileDelete = await backing.getIdsInPath(trace, rootPath);

    // Assert
    expect(deleteFileResult).toStrictEqual({
      ok: true,
      value: undefined
    });
    expect(rootListAfterFileDelete).toStrictEqual({
      ok: true,
      value: [folderId]
    });

    // Delete folder
    // Act
    const deleteFolderResult = await backing.deleteAtPath(trace, folderPath);
    const rootListAfterFolderDelete = await backing.getIdsInPath(trace, rootPath);

    // Assert
    expect(deleteFolderResult).toStrictEqual({
      ok: true,
      value: undefined
    });
    expect(rootListAfterFolderDelete).toStrictEqual({
      ok: true,
      value: []
    });

    // Try to delete non-existent item
    // Act
    const deleteNonExistentResult = await backing.deleteAtPath(trace, rootPath.append(nonExistentFolderId));

    // Assert
    expect(deleteNonExistentResult).toStrictEqual({
      ok: false,
      value: expect.objectContaining({
        errorCode: 'not-found'
      })
    });
  });
});
