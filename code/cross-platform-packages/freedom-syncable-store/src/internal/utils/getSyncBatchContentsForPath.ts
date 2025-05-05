import type { PR } from 'freedom-async';
import { allResultsMapped, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { objectKeys } from 'freedom-cast';
import type { SyncableId, SyncableItemMetadata, SyncablePath, SyncBatchContents } from 'freedom-sync-types';
import { extractSyncableItemTypeFromId, syncableItemTypes } from 'freedom-sync-types';
import type { SyncableStore } from 'freedom-syncable-store-types';

import { getSyncableAtPath } from '../../utils/get/getSyncableAtPath.ts';

export const getSyncBatchContentsForPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, store: SyncableStore, path: SyncablePath): PR<SyncBatchContents, 'not-found' | 'untrusted' | 'wrong-type'> => {
    const item = await getSyncableAtPath(trace, store, path, syncableItemTypes.exclude('file'));
    if (!item.ok) {
      return item;
    }

    const metadataById = await item.value.getMetadataById(trace);
    if (!metadataById.ok) {
      return metadataById;
    }

    let folders: Record<SyncableId, { metadata: SyncableItemMetadata }> | undefined;
    let bundles: Record<SyncableId, { metadata: SyncableItemMetadata }> | undefined;
    let files: Record<SyncableId, { data: Uint8Array; metadata: SyncableItemMetadata }> | undefined;

    const ids = objectKeys(metadataById.value);

    const loaded = await allResultsMapped(trace, ids, {}, async (trace, id) => {
      const metadata = metadataById.value[id];
      if (metadata === undefined) {
        return makeSuccess(undefined);
      }

      const itemType = extractSyncableItemTypeFromId(id);
      switch (itemType) {
        case 'bundle':
          if (bundles === undefined) {
            bundles = {};
          }
          bundles[id] = { metadata };
          break;
        case 'folder':
          if (folders === undefined) {
            folders = {};
          }
          folders[id] = { metadata };
          break;
        case 'file': {
          if (files === undefined) {
            files = {};
          }

          const file = await getSyncableAtPath(trace, store, path.append(id), 'file');
          if (!file.ok) {
            return file;
          }

          const data = await file.value.getEncodedBinary(trace);
          if (!data.ok) {
            return data;
          }

          files[id] = { data: data.value, metadata };

          break;
        }
      }

      return makeSuccess(undefined);
    });
    if (!loaded.ok) {
      return loaded;
    }

    return makeSuccess({ bundles, files, folders });
  }
);
