import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import { parse } from 'freedom-serialization';
import type { SyncableItemMetadata } from 'freedom-sync-types';

import type { FileSystemLocalItemMetadata } from '../types/FileSystemLocalItemMetadata.ts';
import { storedMetadataSchema } from '../types/StoredMetadata.ts';
import { readStringFile } from './readStringFile.ts';

export const readMetadataFile = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, filePath: string): PR<SyncableItemMetadata & FileSystemLocalItemMetadata, 'not-found' | 'wrong-type'> => {
    const metadataJsonString = await readStringFile(trace, filePath);
    if (!metadataJsonString.ok) {
      return metadataJsonString;
    }

    return await parse(trace, metadataJsonString.value, storedMetadataSchema);
  }
);
