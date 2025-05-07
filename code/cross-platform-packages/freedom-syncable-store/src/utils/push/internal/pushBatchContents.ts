import type { PR } from 'freedom-async';
import { allResultsMappedSkipFailures, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { Cast, objectEntries } from 'freedom-cast';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { SyncablePath, SyncBatchContents } from 'freedom-sync-types';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';
import { disableLam } from 'freedom-trace-logging-and-metrics';

import { createViaSyncBundleAtPath } from '../../../internal/utils/sync/createViaSyncBundleAtPath.ts';
import { createViaSyncFolderAtPath } from '../../../internal/utils/sync/createViaSyncFolderAtPath.ts';
import { createViaSyncPreEncodedBinaryFileAtPath } from '../../../internal/utils/sync/createViaSyncPreEncodedBinaryFileAtPath.ts';

export const pushBatchContents = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, store: MutableSyncableStore, parentPath: SyncablePath, batchContents: SyncBatchContents): PR<undefined, 'not-found'> => {
    if (batchContents.folders !== undefined) {
      const pushedFolders = await allResultsMappedSkipFailures(
        trace,
        objectEntries(batchContents.folders),
        { _errorCodeType: Cast<'conflict' | 'not-found'>(), skipErrorCodes: ['conflict'] },
        async (trace, [id, folder]): PR<undefined, 'conflict' | 'not-found'> => {
          if (folder === undefined) {
            return makeSuccess(undefined);
          }

          const newPath = parentPath.append(id);
          const created = await disableLam('conflict', createViaSyncFolderAtPath)(trace, store, newPath, folder.metadata);
          if (!created.ok) {
            return generalizeFailureResult(trace, created, ['untrusted', 'wrong-type'], `Failed to push folder: ${newPath.toString()}`);
          }

          return makeSuccess(undefined);
        }
      );
      if (!pushedFolders.ok) {
        return pushedFolders;
      }
    }

    if (batchContents.bundles !== undefined) {
      const pushedBundles = await allResultsMappedSkipFailures(
        trace,
        objectEntries(batchContents.bundles),
        { _errorCodeType: Cast<'conflict' | 'not-found'>(), skipErrorCodes: ['conflict'] },
        async (trace, [id, bundle]): PR<undefined, 'conflict' | 'not-found'> => {
          if (bundle === undefined) {
            return makeSuccess(undefined);
          }

          const newPath = parentPath.append(id);
          const created = await disableLam('conflict', createViaSyncBundleAtPath)(trace, store, newPath, bundle.metadata);
          if (!created.ok) {
            return generalizeFailureResult(trace, created, ['untrusted', 'wrong-type'], `Failed to push bundle: ${newPath.toString()}`);
          }

          return makeSuccess(undefined);
        }
      );
      if (!pushedBundles.ok) {
        return pushedBundles;
      }
    }

    if (batchContents.files !== undefined) {
      const pushedFiles = await allResultsMappedSkipFailures(
        trace,
        objectEntries(batchContents.files),
        { _errorCodeType: Cast<'conflict' | 'not-found'>(), skipErrorCodes: ['conflict'] },
        async (trace, [id, file]): PR<undefined, 'conflict' | 'not-found'> => {
          if (file === undefined) {
            return makeSuccess(undefined);
          }

          const newPath = parentPath.append(id);
          const created = await disableLam('conflict', createViaSyncPreEncodedBinaryFileAtPath)(
            trace,
            store,
            newPath,
            file.data,
            file.metadata
          );
          if (!created.ok) {
            return generalizeFailureResult(trace, created, ['untrusted', 'wrong-type'], `Failed to push file: ${newPath.toString()}`);
          }

          return makeSuccess(undefined);
        }
      );
      if (!pushedFiles.ok) {
        return pushedFiles;
      }
    }

    return makeSuccess(undefined);
  }
);
