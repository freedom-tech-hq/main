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
  /*
  Let's rething the concept.
  1. Create a folder in the root
  2. Create a file in the root
  3. Create a folder in the folder
  4. Create a file in the folder

  5. Test functions one by one on every object, including non-existent
    - existsAtPath
    - getAtPath
    - getIdsInPath
    - getMetadataAtPath
    - getMetadataByIdInPath

  6. deleteAtPath
  7. updateLocalMetadataAtPath
  */



  it('handles complete file lifecycle operations', async () => {
    // Arrange
    const trace = makeTrace();

    // Scenario Ids
    const storageRootId = storageRootIdInfo.make('the-root');
    const rootPath = new SyncablePath(storageRootId);

    const folderId: SyncableId =
      'EyTbS_the+folder+WBSgooX+wBKoDDywARCAgg8jZ7mBueKM=';
    const folderPath = rootPath.append(folderId);

    const fileId: SyncableId =
      'EyTfS_the+file+OAlXuPWDUbJdvClWPBLKd/S3avqoPjrNC8=';
    const filePath = rootPath.append(fileId);

    const subFolderId: SyncableId =
      'EyTbS_the+sub+folder+WBSgowBKDDywARCAgg8jZ7mBueKM=';
    const subFolderPath = folderPath.append(subFolderId);

    const subFileId: SyncableId =
      'EyTfS_the+sub+file+OAlXuPWDJdvClWBLKdS3avqoPjrNC8=';
    const subFilePath = folderPath.append(subFileId);

    const nonExistentFolderId: SyncableId =
      'EyTbS_the+non+existent+folder+WBSgooAgg8jZ7mBueKM=';
    const nonExistentFileId: SyncableId =
      'EyTfS_the+non+existent+file+WDUbJdvClW3avqoPjrNC8=';

    const provenance: SyncableProvenance = 'not-used' as unknown as SyncableProvenance;

    // Backing
    const backing = new InMemorySyncableStoreBacking({ provenance: provenance });

    //////////// createFolderWithPath /////////////////////////////////////////////////
    // Arrange
    const folderMetadata: SyncableItemMetadata = {
      name: 'E_the+encrypted+name+base64',
      provenance,
    }
    const folderHash = await uncheckedResult(generateSha256HashFromHashesById(trace, {}));
    const folderBackingMetadata: SyncableStoreBackingItemMetadata = { ...folderMetadata, hash: folderHash, numDescendants: 0, sizeBytes: 0 };

    // Act
    const createFolderResult = await backing.createFolderWithPath(trace, folderPath, { metadata: folderBackingMetadata });

    // Assert
    expect(createFolderResult).toStrictEqual({
      ok: true,
      value: {
        type: 'folder',
        "id": folderId
      }
    });

    // Arrange
    const subFolderMetadata: SyncableItemMetadata = {
      name: 'E_the+encrypted+subfolder+name+base64',
      provenance,
    }
    const subFolderHash = await uncheckedResult(generateSha256HashFromHashesById(trace, {}));
    const subFolderBackingMetadata: SyncableStoreBackingItemMetadata = { ...subFolderMetadata, hash: subFolderHash, numDescendants: 0, sizeBytes: 0 };

    // Act
    const createSubFolderResult = await backing.createFolderWithPath(trace, subFolderPath, { metadata: subFolderBackingMetadata });

    // Assert
    expect(createSubFolderResult).toStrictEqual({
      ok: true,
      value: {
        type: 'folder',
        "id": subFolderId
      }
    });

    //////////// createBinaryFileWithPath /////////////////////////////////////////////
    // Arrange
    const fileMetadata: SyncableItemMetadata = {
      name: 'E_the+encrypted+file+name+base64',
      provenance,
    }
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
      value: {
        type: 'file',
        "id": fileId,
        getBinary: expect.any(Function) // TODO: test
      }
    });

    // Arrange
    const subFileMetadata: SyncableItemMetadata = {
      name: 'E_the+encrypted+subfile+name+base64',
      provenance,
    }
    const subFileHash = await uncheckedResult(generateSha256HashFromHashesById(trace, {}));
    const subFileBackingMetadata: SyncableStoreBackingItemMetadata = { ...subFileMetadata, hash: subFileHash, numDescendants: 0, sizeBytes: 0 };

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
        "id": subFileId,
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
    const folderNotExistResult = await backing.existsAtPath(
      trace,
      folderPath.append(nonExistentFolderId)
    );

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
    const fileNotExistResult = await backing.existsAtPath(
      trace,
      filePath.append(nonExistentFileId)
    );

    // Assert
    expect(fileNotExistResult).toStrictEqual({
      ok: false, // TODO: fix
      value: expect.anything()
    });

    //////////// getAtPath ///////////////////////////////////////////////////////////
    // TODO: later

    //////////// getMetadataAtPath ////////////////////////////////////////////////////
    // Act
    const folderMetadataResult = await backing.getMetadataAtPath(trace, folderPath);

    // Assert
    expect(folderMetadataResult).toStrictEqual({
      ok: true,
      value: folderBackingMetadata
    });

    // Act
    const fileMetadataResult = await backing.getMetadataAtPath(trace, filePath);

    // Assert
    expect(fileMetadataResult).toStrictEqual({
      ok: true,
      value: fileBackingMetadata
    });

    // Act
    const nonExistentMetadataResult = await backing.getMetadataAtPath(
      trace,
      folderPath.append(nonExistentFolderId)
    );

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
      value: subFolderBackingMetadata
    });

    // Act
    const subFileMetadataResult = await backing.getMetadataAtPath(trace, subFilePath);

    // Assert
    expect(subFileMetadataResult).toStrictEqual({
      ok: true,
      value: subFileBackingMetadata
    });

    //////////// getMetadataByIdInPath ///////////////////////////////////////////////
    // Act
    const rootMetadataByIdResult = await backing.getMetadataByIdInPath(
      trace,
      rootPath,
      new Set([folderId, fileId])
    );

    // Assert
    expect(rootMetadataByIdResult).toStrictEqual({
      ok: true,
      value: {
        [folderId]: folderBackingMetadata,
        [fileId]: fileBackingMetadata
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
    const subMetadataByIdResult = await backing.getMetadataByIdInPath(
      trace,
      folderPath,
      new Set([subFolderId, subFileId])
    );

    // Assert
    expect(subMetadataByIdResult).toStrictEqual({
      ok: true,
      value: {
        [subFolderId]: subFolderBackingMetadata,
        [subFileId]: subFileBackingMetadata
      }
    });

    // TODO:
    // deleteAtPath
    // updateLocalMetadataAtPath
  });
});
