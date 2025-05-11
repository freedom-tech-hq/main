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
});
