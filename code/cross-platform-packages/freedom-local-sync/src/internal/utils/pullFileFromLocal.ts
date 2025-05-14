import type { PR } from 'freedom-async';
import { debugTopic, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { LocalItemMetadata, PullItem, SyncableItemMetadata } from 'freedom-sync-types';
import type { SyncableFileAccessor } from 'freedom-syncable-store-types';

export const pullFileFromLocal = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    item: SyncableFileAccessor,
    { metadata, sendData }: { metadata: SyncableItemMetadata & LocalItemMetadata; sendData: boolean }
  ): PR<PullItem> => {
    DEV: debugTopic('SYNC', (log) => log(trace, `Pulling ${item.path.toShortString()} from local`));

    const data = sendData ? await item.getEncodedBinary(trace) : undefined;
    if (data !== undefined && !data.ok) {
      return data;
    }

    return makeSuccess({ metadata, sizeBytes: metadata.sizeBytes, data: data?.value });
  }
);
