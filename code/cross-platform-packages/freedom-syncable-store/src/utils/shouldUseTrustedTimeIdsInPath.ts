import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { SyncablePath } from 'freedom-sync-types';
import type { SyncableStore } from 'freedom-syncable-store-types';
import { ACCESS_CONTROL_BUNDLE_ID } from 'freedom-syncable-store-types';

export const shouldUseTrustedTimeIdsInPath = makeAsyncResultFunc(
  [import.meta.filename, 'shouldUseTrustedTimeIdsInPath'],
  async (_trace, _store: SyncableStore, path: SyncablePath): PR<boolean> => makeSuccess(path.ids.includes(ACCESS_CONTROL_BUNDLE_ID))
);
