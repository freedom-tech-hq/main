import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { LocalItemMetadata, SyncableId } from 'freedom-sync-types';
import { merge } from 'lodash-es';

import { getFsPathForMetadataFile } from './getFsPathForMetadataFile.ts';
import { readMetadataFile } from './readMetadataFile.ts';
import { writeMetadataFile } from './writeMetadataFile.ts';

export const updateLocalMetadata = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, rootPath: string, ids: readonly SyncableId[], metadataChanges: Partial<LocalItemMetadata>): PR<undefined> => {
    const filePath = getFsPathForMetadataFile(rootPath, ids);

    const metadata = await readMetadataFile(trace, filePath);
    if (!metadata.ok) {
      return generalizeFailureResult(trace, metadata, ['not-found', 'wrong-type']);
    }

    merge(metadata.value, metadataChanges);

    const wrote = await writeMetadataFile(trace, filePath, metadata.value);
    if (!wrote.ok) {
      return wrote;
    }

    return makeSuccess(undefined);
  }
);
