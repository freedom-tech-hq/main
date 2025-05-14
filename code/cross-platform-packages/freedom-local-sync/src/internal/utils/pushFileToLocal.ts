import { debugTopic, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { PushFile, SyncablePath } from 'freedom-sync-types';
import { createViaSyncPreEncodedBinaryFileAtPath } from 'freedom-syncable-store';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

export const pushFileToLocal = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, userFs: MutableSyncableStore, item: PushFile, { path }: { path: SyncablePath }) => {
    DEV: debugTopic('SYNC', (log) => log(trace, `Pushing ${path.toShortString()} to local`));

    const created = await createViaSyncPreEncodedBinaryFileAtPath(trace, userFs, path, item.data, item.metadata);
    if (!created.ok) {
      return generalizeFailureResult(trace, created, ['untrusted', 'wrong-type']);
    }

    return makeSuccess(undefined);
  }
);
